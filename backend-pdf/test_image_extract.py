import fitz

doc = fitz.open('F:/CS1.pdf')
print(f"Total pages: {len(doc)}")

for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    
    # Check if Q.42 is on this page (case insensitive search)
    text = page.get_text("text")
    if "Q.42" in text or "Q. 42" in text:
        print(f"Found Q.42 on page {page_num + 1}")
        
        # Check embedded images
        images = page.get_images(full=True)
        print(f"Embedded raster images on this page: {len(images)}")
        
        # Check vector drawings (lines, curves, rects)
        drawings = page.get_drawings()
        print(f"Vector drawings on this page: {len(drawings)}")
        
        # Let's break after finding it
        break
