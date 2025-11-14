import io
import os
import zipfile
from pathlib import Path
from typing import List

import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from config import settings
from image_processor import ImageProcessor
from models import ResizeRequest, ResizeResponse

app = FastAPI(title="Image Resizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

processor = ImageProcessor()


@app.post("/api/upload", response_model=ResizeResponse)
async def upload_images(files: List[UploadFile] = File(...)):
    """Upload images and return their IDs"""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    file_ids = []
    for file in files:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not an image")

        file_id = await processor.save_uploaded_file(file)
        file_ids.append(file_id)

    return ResizeResponse(file_ids=file_ids, total=len(file_ids))


@app.post("/api/resize")
async def resize_images(request: ResizeRequest):
    """Resize images based on request parameters"""
    if not request.file_ids:
        raise HTTPException(status_code=400, detail="No file IDs provided")

    task_id = await processor.start_resize_task(
        file_ids=request.file_ids,
        width=request.width,
        height=request.height,
        mode=request.mode,
        fill_color=request.fill_color,
        fill_colors=request.fill_colors
    )

    return {"task_id": task_id}


@app.get("/api/progress/{task_id}")
async def get_progress(task_id: str):
    """Get progress of resize task"""
    progress = processor.get_progress(task_id)
    if progress is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return progress


@app.get("/api/download/{task_id}")
async def download_images(task_id: str):
    """Download resized images as zip or single image"""
    result = processor.get_result(task_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Task not found")

    if result["status"] != "completed":
        raise HTTPException(status_code=400, detail="Task not completed")

    files = result["files"]
    filenames = result.get("filenames", {})

    def get_original_filename(file_path: str) -> str:
        """Get original filename with resized_ prefix, without UUID prefix"""
        # Try exact match first
        if file_path in filenames:
            return filenames[file_path]

        # Try normalized path match
        normalized_path = str(Path(file_path).resolve())
        if normalized_path in filenames:
            return filenames[normalized_path]

        # Fallback: extract filename and remove task_id prefix if present
        file_name = Path(file_path).name
        if file_name.startswith(f"{task_id}_"):
            # Remove task_id prefix, keep resized_ prefix
            return file_name[len(f"{task_id}_"):]
        return file_name

    if len(files) == 1:
        # Single file - return as image
        file_path = files[0]
        original_filename = get_original_filename(file_path)

        def generate():
            with open(file_path, "rb") as f:
                yield from f

        return StreamingResponse(
            generate(),
            media_type="image/png",
            headers={"Content-Disposition": f'attachment; filename="{original_filename}"'}
        )
    else:
        # Multiple files - return as zip
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for file_path in files:
                original_filename = get_original_filename(file_path)
                zip_file.write(file_path, original_filename)

        zip_buffer.seek(0)
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="resized_images.zip"'}
        )


@app.delete("/api/cleanup/{task_id}")
async def cleanup_task(task_id: str):
    """Clean up task files"""
    processor.cleanup_task(task_id)
    return {"status": "cleaned"}


if __name__ == "__main__":
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
    uvicorn.run(app, host="0.0.0.0", port=8000)
