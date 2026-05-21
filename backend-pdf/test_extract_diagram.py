import fitz

doc = fitz.open('F:/CS1.pdf')
page = doc.load_page(30) # Page 31 (0-indexed 30)

# 1. Search for "Q.42"
q_rects = page.search_for("Q.42")
if not q_rects:
    print("Q.42 not found")
    exit()
q_y0 = q_rects[0].y0
q_y1 = q_rects[0].y1

# 2. Search for "(A)"
a_rects = page.search_for("(A)")
# Filter to ones below Q.42
a_rects = [r for r in a_rects if r.y0 > q_y1]
if not a_rects:
    print("(A) not found below Q.42")
    exit()
a_y0 = a_rects[0].y0

print(f"Question starts around Y={q_y0}, Options start around Y={a_y0}")

# 3. Find drawings between these Y coordinates
drawings = page.get_drawings()
diagram_rect = fitz.Rect()

for d in drawings:
    r = d["rect"]
    if r.y0 > q_y1 and r.y1 < a_y0:
        diagram_rect |= r # Union of rects

# Check images as well
for img in page.get_images(full=True):
    xref = img[0]
    rects = page.get_image_rects(xref)
    for r in rects:
        if r.y0 > q_y1 and r.y1 < a_y0:
            diagram_rect |= r

if diagram_rect.is_empty:
    print("No diagram found in this region.")
else:
    # Add a margin
    diagram_rect.x0 -= 10
    diagram_rect.y0 -= 10
    diagram_rect.x1 += 10
    diagram_rect.y1 += 10
    
    # Render the area
    pix = page.get_pixmap(clip=diagram_rect, dpi=300)
    pix.save("q42_diagram.png")
    print(f"Diagram extracted and saved to q42_diagram.png. Dimensions: {pix.width}x{pix.height}")
