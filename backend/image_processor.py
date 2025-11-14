import asyncio
import multiprocessing as mp
import os
import time
import uuid
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from PIL import Image

from config import settings
from metrics import (
    images_uploaded_total,
    images_uploaded_size_bytes,
    images_processed_total,
    image_processing_duration_seconds,
    image_output_size_bytes,
    resize_tasks_total,
    resize_task_duration_seconds,
    images_per_task,
    active_tasks
)


class ImageProcessor:
    def __init__(self):
        self.tasks: Dict[str, Dict] = {}
        self.file_info: Dict[str, Dict] = {}  # file_id -> {filename, path}
        self.executor = ProcessPoolExecutor(max_workers=mp.cpu_count())
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        os.makedirs(settings.OUTPUT_DIR, exist_ok=True)

    async def save_uploaded_file(self, file) -> str:
        """Save uploaded file and return file ID"""
        file_id = str(uuid.uuid4())
        original_filename = file.filename or "image"
        file_path = Path(settings.UPLOAD_DIR) / f"{file_id}_{original_filename}"

        content = await file.read()
        file_size = len(content)
        
        with open(file_path, "wb") as f:
            f.write(content)

        # Store file info
        self.file_info[file_id] = {
            "filename": original_filename,
            "path": str(file_path),
            "size": file_size
        }

        # Track metrics
        images_uploaded_total.inc()
        images_uploaded_size_bytes.observe(file_size)

        return file_id

    def _get_file_path(self, file_id: str) -> Optional[Path]:
        """Find file path by file ID"""
        upload_dir = Path(settings.UPLOAD_DIR)
        for file_path in upload_dir.glob(f"{file_id}_*"):
            return file_path
        return None

    async def start_resize_task(
            self,
            file_ids: List[str],
            width: int,
            height: int,
            mode: str,
            fill_color: Optional[str],
            fill_colors: Optional[Dict[str, str]] = None
    ) -> str:
        """Start resize task and return task ID"""
        task_id = str(uuid.uuid4())

        # Get file paths and original filenames
        file_data = []
        for file_id in file_ids:
            if file_id in self.file_info:
                file_info = self.file_info[file_id]
                # Get the clean original filename (stored without UUID prefix)
                original_filename = file_info["filename"]
                file_data.append({
                    "file_id": file_id,
                    "path": file_info["path"],
                    "filename": original_filename,
                    "size": file_info.get("size", 0)
                })

        if not file_data:
            raise ValueError("No valid files found")

        # Track metrics
        images_per_task.observe(len(file_data))
        resize_tasks_total.labels(mode=mode, status="started").inc()
        active_tasks.inc()

        # Initialize task
        self.tasks[task_id] = {
            "status": "processing",
            "total": len(file_data),
            "completed": 0,
            "files": [],
            "filenames": {},
            "started_at": time.time(),
            "mode": mode
        }

        # Start processing in background
        asyncio.create_task(self._process_images(
            task_id, file_data, width, height, mode, fill_color, fill_colors
        ))

        return task_id

    async def _process_images(
            self,
            task_id: str,
            file_data: List[Dict],
            width: int,
            height: int,
            mode: str,
            fill_color: Optional[str],
            fill_colors: Optional[Dict[str, str]] = None
    ):
        """Process images using multiprocessing"""
        try:
            loop = asyncio.get_event_loop()
            output_files = []

            # Process files in batches
            batch_size = mp.cpu_count()
            for i in range(0, len(file_data), batch_size):
                batch = file_data[i:i + batch_size]

                # Create tasks for batch
                task_data_list = []
                for file_item in batch:
                    file_id = file_item["file_id"]
                    file_path = file_item["path"]
                    original_filename = file_item["filename"]

                    # Determine fill color for this image
                    image_fill_color = None
                    if mode == "fill":
                        if fill_colors and file_id in fill_colors:
                            image_fill_color = fill_colors[file_id]
                        elif fill_color:
                            image_fill_color = fill_color

                    # Use the clean original filename - NEVER add UUID to output filename
                    # original_filename is already clean (stored without UUID prefix)
                    original_path = Path(original_filename)
                    # Get just the stem (filename without extension)
                    base_name = original_path.stem
                    # Create output filename with resized_ prefix
                    output_filename = f"resized_{base_name}.png"
                    output_path = Path(settings.OUTPUT_DIR) / f"{task_id}_{output_filename}"

                    output_path_str = str(output_path.resolve())
                    task = loop.run_in_executor(
                        self.executor,
                        resize_image,
                        file_path,
                        output_path_str,
                        width,
                        height,
                        mode,
                        image_fill_color
                    )
                    task_data_list.append({
                        "task": task,
                        "output_path": output_path_str,
                        "output_filename": output_filename
                    })

                # Wait for batch to complete
                results = await asyncio.gather(*[item["task"] for item in task_data_list])

                for result, task_data in zip(results, task_data_list):
                    if result:
                        output_files.append(result)
                        output_filename = task_data["output_filename"]
                        # Store with both original result and normalized paths for reliable lookup
                        self.tasks[task_id]["filenames"][result] = output_filename
                        normalized_path = str(Path(result).resolve())
                        self.tasks[task_id]["filenames"][normalized_path] = output_filename
                        self.tasks[task_id]["completed"] += 1

            task_duration = time.time() - self.tasks[task_id]["started_at"]
            self.tasks[task_id]["status"] = "completed"
            self.tasks[task_id]["files"] = output_files

            # Track metrics
            resize_tasks_total.labels(mode=mode, status="completed").inc()
            resize_task_duration_seconds.labels(mode=mode).observe(task_duration)
            images_processed_total.labels(mode=mode, status="success").inc(len(output_files))

            # Track output file sizes
            for output_file in output_files:
                try:
                    file_size = os.path.getsize(output_file)
                    image_output_size_bytes.observe(file_size)
                except:
                    pass

        except Exception as e:
            self.tasks[task_id]["status"] = "error"
            self.tasks[task_id]["error"] = str(e)
            resize_tasks_total.labels(mode=mode, status="error").inc()
            images_processed_total.labels(mode=mode, status="error").inc(len(file_data))
        finally:
            active_tasks.dec()

    def get_progress(self, task_id: str) -> Optional[Dict]:
        """Get progress of resize task"""
        if task_id not in self.tasks:
            return None

        task = self.tasks[task_id]
        progress = (task["completed"] / task["total"]) * 100 if task["total"] > 0 else 0

        return {
            "status": task["status"],
            "progress": round(progress, 2),
            "completed": task["completed"],
            "total": task["total"]
        }

    def get_result(self, task_id: str) -> Optional[Dict]:
        """Get result of resize task"""
        return self.tasks.get(task_id)

    def cleanup_task(self, task_id: str):
        """Clean up task files"""
        if task_id in self.tasks:
            result = self.tasks[task_id]
            if "files" in result:
                for file_path in result["files"]:
                    try:
                        os.remove(file_path)
                    except:
                        pass

            # Clean up uploaded files
            upload_dir = Path(settings.UPLOAD_DIR)
            for file_path in upload_dir.glob(f"*_{task_id}_*"):
                try:
                    os.remove(file_path)
                except:
                    pass

            del self.tasks[task_id]


def resize_image(
        input_path: str,
        output_path: str,
        width: int,
        height: int,
        mode: str,
        fill_color: Optional[str]
) -> Optional[str]:
    """Resize single image (runs in separate process)"""
    start_time = time.time()
    try:
        with Image.open(input_path) as img:
            # Convert RGBA if needed
            if img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGBA")
            else:
                img = img.convert("RGB")

            if mode == "stretch":
                resized = img.resize((width, height), Image.Resampling.LANCZOS)

            elif mode == "fit":
                img.thumbnail((width, height), Image.Resampling.LANCZOS)
                resized = Image.new("RGB", (width, height), (255, 255, 255))
                x = (width - img.width) // 2
                y = (height - img.height) // 2
                if img.mode == "RGBA":
                    resized.paste(img, (x, y), img)
                else:
                    resized.paste(img, (x, y))

            elif mode == "fill":
                # Calculate scaling to fill (cover entire area)
                scale = max(width / img.width, height / img.height)
                new_width = int(img.width * scale)
                new_height = int(img.height * scale)

                resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

                # Create canvas with fill color
                if fill_color:
                    color = tuple(int(fill_color[i:i + 2], 16) for i in (1, 3, 5))
                else:
                    # Extract dominant color from image
                    color = extract_dominant_color(img)

                canvas = Image.new("RGB", (width, height), color)

                # Center and crop
                x = (new_width - width) // 2
                y = (new_height - height) // 2
                cropped = resized.crop((x, y, x + width, y + height))

                # Handle transparency
                if cropped.mode == "RGBA":
                    canvas.paste(cropped, (0, 0), cropped)
                else:
                    canvas.paste(cropped, (0, 0))
                resized = canvas

            # Save
            resized.save(output_path, "PNG", optimize=True)

            # Track processing duration
            duration = time.time() - start_time
            image_processing_duration_seconds.labels(mode=mode).observe(duration)
            
            return str(output_path)

    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        images_processed_total.labels(mode=mode, status="error").inc()
        return None


def extract_dominant_color(img: Image.Image) -> Tuple[int, int, int]:
    """Extract dominant color from image"""
    try:
        # Convert to RGB if needed
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Resize for faster processing
        img = img.resize((50, 50))
        colors = img.getcolors(maxcolors=256 * 256 * 256)

        if colors:
            # Get most common color
            colors.sort(key=lambda x: x[0], reverse=True)
            color = colors[0][1]
            if isinstance(color, tuple) and len(color) >= 3:
                return color[:3]
    except Exception as e:
        print(f"Error extracting color: {e}")

    return (255, 255, 255)
