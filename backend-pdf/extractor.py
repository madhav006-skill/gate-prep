import fitz  # PyMuPDF
import re
import uuid
import base64
from PIL import Image
import io

def process_pdf_job(file_path: str, job_id: str, progress_callback):
    progress_callback(job_id, 10)
    
    doc = fitz.open(file_path)
    total_pages = len(doc)
    
    # 1. Find all Q.X markers
    q_markers = []
    
    for page_num in range(total_pages):
        page = doc.load_page(page_num)
        blocks = page.get_text("blocks")
        
        # Sort blocks top-to-bottom
        blocks.sort(key=lambda b: b[1])
        
        for b in blocks:
            text = b[4].strip()
            
            # Find Q. X or Q.X
            m = re.match(r'^Q\.?\s*(\d+)(?:\.|:)?', text, re.IGNORECASE)
            if m:
                q_num = int(m.group(1))
                y0 = b[1]
                q_markers.append({
                    "q_num": q_num,
                    "page_num": page_num,
                    "y_start": y0,
                    "text_content": text
                })
                
    progress_callback(job_id, 30)

    # Sort markers strictly by page then Y-coordinate
    q_markers.sort(key=lambda x: (x["page_num"], x["y_start"]))
    
    extracted_questions = []
    total_q = len(q_markers)
    
    for i, marker in enumerate(q_markers):
        q_num = marker["q_num"]
        start_page = marker["page_num"]
        start_y = marker["y_start"]
        
        # Determine end boundary
        if i + 1 < total_q:
            next_marker = q_markers[i+1]
            end_page = next_marker["page_num"]
            end_y = next_marker["y_start"]
        else:
            end_page = start_page
            end_y = doc.load_page(end_page).rect.height
            
        # Extract images for the region
        images = []
        for p in range(start_page, end_page + 1):
            page = doc.load_page(p)
            rect = page.rect
            
            crop_y0 = start_y if p == start_page else 0
            crop_y1 = end_y if p == end_page else rect.height
            
            # Remove top/bottom headers/footers slightly if on different pages
            if crop_y0 < 50 and p != start_page: crop_y0 = 50
            if crop_y1 > rect.height - 50 and p != end_page: crop_y1 = rect.height - 50
            
            if crop_y1 - crop_y0 < 20: 
                continue # Too small
                
            crop_rect = fitz.Rect(0, max(0, crop_y0 - 5), rect.width, crop_y1) # -5 for padding
            
            pix = page.get_pixmap(clip=crop_rect, dpi=200) # High quality
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            images.append(img)
            
        # Stitch images vertically
        if not images:
            continue
            
        total_height = sum(img.height for img in images)
        max_width = max(img.width for img in images)
        
        stitched = Image.new('RGB', (max_width, total_height), (255, 255, 255))
        y_offset = 0
        for img in images:
            stitched.paste(img, (0, y_offset))
            y_offset += img.height
            
        # Convert to base64
        buffered = io.BytesIO()
        stitched.save(buffered, format="PNG", optimize=True)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        base64_final = f"data:image/png;base64,{img_str}"
        
        # Determine Marks (1 or 2)
        marks = 1
        if "carry two mark" in marker["text_content"].lower() or "carry 2 mark" in marker["text_content"].lower():
            marks = 2
        elif q_num >= 26:
            marks = 2
            
        # Try to detect question type using simple full text scan
        full_text = ""
        for p in range(start_page, end_page + 1):
            page = doc.load_page(p)
            crop_y0 = start_y if p == start_page else 0
            crop_y1 = end_y if p == end_page else page.rect.height
            crop_rect = fitz.Rect(0, crop_y0, page.rect.width, crop_y1)
            full_text += page.get_text("text", clip=crop_rect)
            
        q_type = "NAT"
        if re.search(r'\([A-Da-d]\)', full_text):
            q_type = "MCQ"
        if re.search(r'\bMSQ\b|Multiple Select', full_text, re.IGNORECASE):
            q_type = "MSQ"
            
        options = []
        if q_type == "MCQ" or q_type == "MSQ":
            options = [
                {"text": "Option A"},
                {"text": "Option B"},
                {"text": "Option C"},
                {"text": "Option D"},
            ]
            
        extracted = {
            "id": str(uuid.uuid4()),
            "questionHtml": "", # Empty, because we rely entirely on base64Image
            "base64Image": base64_final,
            "options": options,
            "correctAnswer": "Option A" if options else "0",
            "type": q_type,
            "questionType": q_type,
            "subject": "CS",
            "topic": "General",
            "difficulty": "medium",
            "marks": marks,
            "negativeMarks": round(marks / 3, 2) if q_type == "MCQ" else 0,
            "images": []
        }
        
        # Avoid exact duplicates if Q number was parsed multiple times closely
        if extracted_questions and extracted_questions[-1]["base64Image"] == base64_final:
            continue
            
        extracted_questions.append(extracted)
        
        progress_callback(job_id, 30 + int(((i + 1) / total_q) * 60))

    doc.close()
    progress_callback(job_id, 100)
    return extracted_questions
