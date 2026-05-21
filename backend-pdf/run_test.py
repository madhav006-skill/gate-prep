import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, '.')
from extractor import process_pdf_job
import base64

def prog(j, p):
    pass

print("Testing CS1.pdf extraction...")
questions = process_pdf_job("F:/CS1.pdf", "test", prog)

with_img = [q for q in questions if q.get("base64Image")]
without_img = [q for q in questions if not q.get("base64Image")]

print(f"Total questions extracted : {len(questions)}")
print(f"Questions WITH diagram    : {len(with_img)}")
print(f"Questions WITHOUT diagram : {len(without_img)}")
print()

print("--- Questions that got a diagram ---")
for q in with_img:
    text = q["questionHtml"][:120].encode("ascii", "replace").decode("ascii")
    b64_raw = q["base64Image"].split(",")[1]
    kb = len(base64.b64decode(b64_raw)) // 1024
    print(f"  [{q['marks']}M] {text[:80]}... ({kb} KB)")

# Save first 3 diagrams to visually verify
for i, q in enumerate(with_img[:5]):
    b64_raw = q["base64Image"].split(",")[1]
    fname = f"auto_diagram_{i+1}.png"
    with open(fname, "wb") as f:
        f.write(base64.b64decode(b64_raw))
    print(f"  Saved: {fname}")

print()
print("DONE!")
