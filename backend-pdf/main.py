from fastapi import FastAPI, File, UploadFile, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import uuid
import asyncio
from extractor import process_pdf_job
from pydantic import BaseModel
from typing import Dict

app = FastAPI(title="PDF to Question Import System OCR API")

ALLOWED_ORIGINS = [
    "https://gate-prep-backend.onrender.com",
    "https://frontend-murex-two-47.vercel.app",
    "http://localhost:5000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "Authorization"],
)

# In-memory dictionary to track job statuses
# In production, this would be Redis/Postgres
jobs: Dict[str, dict] = {}

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class JobResponse(BaseModel):
    job_id: str
    status: str

MAX_FILE_SIZE_MB = 10

@app.post("/api/pdf/upload", response_model=JobResponse)
async def upload_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Read content and check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Max size is {MAX_FILE_SIZE_MB}MB")

    job_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}.pdf")
    
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    jobs[job_id] = {
        "status": "processing",
        "file_name": file.filename,
        "progress": 0,
        "result": None,
        "error": None
    }
    
    # Send to background worker queue
    background_tasks.add_task(run_ocr_pipeline, job_id, file_path)
    
    return {"job_id": job_id, "status": "processing"}

@app.get("/api/pdf/status/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

async def run_ocr_pipeline(job_id: str, file_path: str):
    try:
        # We run the heavy OCR pipeline in an executor to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        extracted_data = await loop.run_in_executor(None, process_pdf_job, file_path, job_id, update_progress)
        
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["result"] = extracted_data
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
    finally:
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)

def update_progress(job_id: str, progress: int):
    if job_id in jobs:
        jobs[job_id]["progress"] = progress

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
