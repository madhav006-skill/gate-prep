import re

text = """Consider a CPU that has to execute two types of processes. The first type,
Actuators (A), requires a CPU burst of 6 seconds. The second type, Controllers (C),
requires a CPU burst of 8 seconds. A new process of type A arrives at time t = 10,
20, 30, 40, and 50 (in seconds). Similarly, a new process of type C arrives at time t =
11, 22, 33, 44, and 55 (in seconds). The CPU scheduling policy is First Come First
Serve (FCFS). The first process of type A starts running at t = 10 seconds. The
average waiting time (in seconds) for the 10 processes is _______. (rounded off
to one decimal place)"""

print("Original Buggy split:")
print(re.split(r'\n?\s*\([Aa]\)\s*', text, maxsplit=1))

print("\nFixed split (requires newline):")
print(re.split(r'\n\s*\([Aa]\)\s+', text, maxsplit=1))

print("\nWhat if it was a real MCQ:")
real_mcq = """What is 2+2?
(A) 3
(B) 4
(C) 5
(D) 6"""
print(re.split(r'\n\s*\([Aa]\)\s+', real_mcq, maxsplit=1))
