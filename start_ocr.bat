@echo off
cd /d F:\gate-prep\backend-pdf
F:\gate-prep\backend-pdf\venv\Scripts\uvicorn.exe main:app --port 8000 --host 127.0.0.1
