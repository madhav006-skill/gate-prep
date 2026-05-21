import fitz  # PyMuPDF
import re
import uuid
import base64

def _is_meaningful_diagram(drawings_in_zone):
    if len(drawings_in_zone) < 6:
        return False
    closed_count = 0
    all_rects = []
    for d in drawings_in_zone:
        r = d["rect"]
        all_rects.append(r)
        if r.width > 20 and r.height > 10:
            closed_count += 1
    if closed_count < 3:
        return False
    min_y = min(r.y0 for r in all_rects)
    max_y = max(r.y1 for r in all_rects)
    if (max_y - min_y) < 60:
        return False
    return True

def process_pdf_job(file_path: str, job_id: str, progress_callback):
    progress_callback(job_id, 10)

    doc = fitz.open(file_path)
    total_pages = len(doc)

    questions_data = []
    current_q = None
    current_marks = 1

    # ── Pass 1: Extract text and preserve block coordinates ────────────────
    for i in range(total_pages):
        page = doc.load_page(i)
        blocks = page.get_text("blocks")
        blocks.sort(key=lambda b: b[1])  # top-to-bottom

        for b in blocks:
            b_rect = fitz.Rect(b[:4])
            text = b[4].strip()
            if not text:
                continue

            block_lines_for_q = []
            
            for line in text.split('\n'):
                line_clean = line.strip()
                if not line_clean:
                    continue

                if re.search(r'page\s*\d+\s*of\s*\d+', line_clean, re.IGNORECASE): continue
                if re.search(r'Organizing Institute:?', line_clean, re.IGNORECASE): continue
                if "General Aptitude (GA)" in line_clean or "Computer Science" in line_clean: continue

                mark_match = re.search(r'carry\s+(one|two|1|2)\s+mark', line_clean, re.IGNORECASE)
                if mark_match:
                    val = mark_match.group(1).lower()
                    current_marks = 2 if val in ['two', '2'] else 1
                    continue

                if re.match(r'^Q\.?\s*\d+\s*(?:-|to|–)\s*Q', line_clean, re.IGNORECASE):
                    continue

                m = re.match(r'^Q\.?\s*(\d+)(?:\.|:)?\s*(.*)', line_clean, re.IGNORECASE)
                if m:
                    # Save existing lines to current Q before starting new one
                    if current_q and block_lines_for_q:
                        current_q["blocks"].append((b_rect, "\n".join(block_lines_for_q)))
                        block_lines_for_q = []
                    
                    if current_q:
                        questions_data.append(current_q)
                        
                    current_q = {
                        "num": int(m.group(1)),
                        "blocks": [],
                        "marks": current_marks,
                        "page_num": i,
                        "y_start": b[3],
                        "base64Image": None,
                        "clip_rect": None
                    }
                    if m.group(2).strip():
                        block_lines_for_q.append(m.group(2).strip())
                else:
                    block_lines_for_q.append(line)

            # Assign remaining lines of the block to the current question
            if current_q and block_lines_for_q and current_q["page_num"] == i:
                current_q["blocks"].append((b_rect, "\n".join(block_lines_for_q)))

        progress_callback(job_id, 10 + int(((i + 1) / total_pages) * 40))

    if current_q and current_q not in questions_data:
        questions_data.append(current_q)

    doc.close()
    progress_callback(job_id, 55)

    # ── Pass 2: Detect diagrams and calculate their clip boxes ─────────────
    doc2 = fitz.open(file_path)

    for q_idx, q in enumerate(questions_data):
        page_num = q["page_num"]
        page = doc2.load_page(page_num)
        page_height = page.rect.height
        page_width  = page.rect.width

        y0 = q["y_start"]

        next_q = next((nq for nq in questions_data[q_idx + 1:] if nq["page_num"] == page_num), None)
        y1 = (next_q["y_start"] - 10) if next_q else page_height

        if (y1 - y0) < 40:
            continue

        drawings_in_zone = [
            d for d in page.get_drawings()
            if d["rect"].y0 >= y0 and d["rect"].y1 <= y1
        ]

        raster_in_zone = []
        for img in page.get_images(full=True):
            for r in page.get_image_rects(img[0]):
                if r.y0 >= y0 and r.y1 <= y1:
                    raster_in_zone.append(r)

        has_raster = len(raster_in_zone) > 0
        has_diagram = _is_meaningful_diagram(drawings_in_zone)

        if not has_diagram and not has_raster:
            continue

        all_rects = [d["rect"] for d in drawings_in_zone] + raster_in_zone
        if not all_rects:
            continue

        union = all_rects[0]
        for r in all_rects[1:]:
            union = union | r

        PAD = 25
        clip = fitz.Rect(
            max(0, union.x0 - PAD),
            max(0, union.y0 - PAD),
            min(page_width, union.x1 + PAD),
            min(page_height, union.y1 + PAD),
        )

        if clip.is_empty or clip.width < 20 or clip.height < 20:
            continue

        q["clip_rect"] = clip

        try:
            pix = page.get_pixmap(clip=clip, dpi=180)
            b64 = base64.b64encode(pix.tobytes("png")).decode("utf-8")
            q["base64Image"] = f"data:image/png;base64,{b64}"
        except Exception as e:
            print(f"Diagram extraction failed for Q{q['num']}: {e}")

    doc2.close()
    progress_callback(job_id, 80)

    # ── Pass 3: Build HTML by excluding text inside diagrams ───────────────
    extracted_questions = []

    for q in questions_data:
        clip = q.get("clip_rect")
        text_parts = []
        
        for rect, text_content in q["blocks"]:
            # If a diagram was found, ignore text blocks that fall visually inside it
            # This perfectly removes table contents, cell numbers, etc.
            if clip:
                cx = (rect.x0 + rect.x1) / 2
                cy = (rect.y0 + rect.y1) / 2
                
                # Shrink the clip rect slightly for text-exclusion so we don't 
                # accidentally delete the question text just above the diagram.
                # inner_clip excludes a 10px margin inside the original padded clip
                inner_clip = clip + (10, 10, -10, -10)
                
                if inner_clip.contains(fitz.Point(cx, cy)):
                    # Protect option labels so MCQ parsing doesn't break when options are images
                    if re.match(r'^\s*\([A-Da-d]\)\s*', text_content):
                        pass # Keep it
                    else:
                        continue # Skip this table/diagram text!

            text_parts.append(text_content)

        content = "\n".join(text_parts).strip()
        marks   = q["marks"]
        options = []
        q_type  = "NAT"

        option_split = re.split(r'\n?\s*\([Aa]\)\s*', content, maxsplit=1)
        if len(option_split) > 1:
            q_type        = "MCQ"
            question_body = option_split[0].strip()
            options_text  = "(A) " + option_split[1]

            for match in re.finditer(
                r'\(([A-Da-d])\)\s*(.*?)(?=\s*\([A-Da-d]\)|$)',
                options_text, flags=re.DOTALL
            ):
                val = match.group(2).strip().replace('\n', ' ')
                if not val:
                    val = f"Option {match.group(1).upper()}"
                options.append({"text": val})

            if len(options) < 2:
                options = [
                    {"text": "Option A"}, {"text": "Option B"},
                    {"text": "Option C"}, {"text": "Option D"},
                ]
        else:
            question_body = content

        if re.search(r'\bMSQ\b|Multiple Select', question_body, re.IGNORECASE):
            q_type = "MSQ"

        extracted = {
            "id":            str(uuid.uuid4()),
            "questionHtml":  f"<p>{question_body.replace(chr(10), '<br/>')}</p>",
            "options":       options,
            "correctAnswer": options[0]["text"] if options else "0",
            "type":          q_type,
            "questionType":  q_type,
            "subject":       "CS",
            "topic":         "General",
            "difficulty":    "medium",
            "marks":         marks,
            "negativeMarks": round(marks / 3, 2) if q_type == "MCQ" else 0,
            "images":        [],
        }

        if q.get("base64Image"):
            extracted["base64Image"] = q["base64Image"]

        extracted_questions.append(extracted)

    progress_callback(job_id, 100)
    return extracted_questions
