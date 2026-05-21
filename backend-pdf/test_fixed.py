import fitz
import base64

doc = fitz.open('F:/CS1.pdf')
page = doc.load_page(30)  # Page 31 = index 30

# Q.42 question line
q_rects = page.search_for("Q.42")
y0 = q_rects[0].y1  # bottom of question text line

# Find (A) below the question
a_rects = page.search_for("(A)")
a_rects_below = [r for r in a_rects if r.y0 > y0 + 5]
y1 = a_rects_below[0].y0

print(f"Diagram zone: y0={y0:.1f}  y1={y1:.1f}  gap={y1-y0:.1f}px")

# Check drawings in zone
drawings = page.get_drawings()
in_zone = [d for d in drawings if d["rect"].y0 >= y0 and d["rect"].y1 <= y1]
print(f"Drawings in zone: {len(in_zone)}")

# Clip full horizontal width
page_width = page.rect.width
clip_rect = fitz.Rect(30, y0 + 2, page_width - 30, y1 - 2)
pix = page.get_pixmap(clip=clip_rect, dpi=180)
pix.save("q42_fixed.png")
print(f"Saved q42_fixed.png  ({pix.width}x{pix.height})")
