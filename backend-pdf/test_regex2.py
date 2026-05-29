import re

real_mcq = """What is 2+2?
(A) 3
(B) 4
(C) 5
(D) 6"""

options_text = "(A) 3\n(B) 4\n(C) 5\n(D) 6"

options = []
# Old regex
print("Old regex:")
for match in re.finditer(r'\(([A-Da-d])\)\s*(.*?)(?=\s*\([A-Da-d]\)|$)', options_text, flags=re.DOTALL):
    print(match.group(1), "->", match.group(2).strip())

print("\nNew regex:")
# Note: Since options_text might not start with \n, we can prepend a \n to it to make the regex simpler!
options_text_padded = "\n" + options_text
for match in re.finditer(r'\n\s*\(([A-Da-d])\)\s+(.*?)(?=\n\s*\([A-Da-d]\)\s+|$)', options_text_padded, flags=re.DOTALL):
    print(match.group(1), "->", match.group(2).strip())
