import uuid
import asyncio
import logging
from typing import Dict, Optional
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

from app.models.schema import TaskStatusResponse, ProcessingOptions
from app.services.pipeline import VoiceCleanPipeline
from app.config import PROCESSED_DIR

logger = logging.getLogger(__name__)

class TaskManager:
    def __init__(self):
        self._tasks: Dict[str, dict] = {}
        self._executor = ThreadPoolExecutor(max_workers=3)

    def create_task(self, filename: str, input_video_path: Path) -> str:
        task_id = str(uuid.uuid4())
        self._tasks[task_id] = {
            "task_id": task_id,
            "filename": filename,
            "input_video_path": input_video_path,
            "status": "queued",
            "progress": 0,
            "step": "Queued for processing",
            "error": None,
            "original_video_url": f"/api/media/{task_id}/original-video",
            "enhanced_video_url": None,
            "original_audio_url": None,
            "enhanced_audio_url": None,
            "metrics": None,
            "processing_time_sec": None,
            "options_used": None,
            "video_duration_sec": None,
            "result_paths": {}
        }
        return task_id

    def get_task(self, task_id: str) -> Optional[dict]:
        return self._tasks.get(task_id)

    def get_task_response(self, task_id: str) -> Optional[TaskStatusResponse]:
        data = self._tasks.get(task_id)
        if not data:
            return None
        return TaskStatusResponse(
            task_id=data["task_id"],
            filename=data["filename"],
            status=data["status"],
            progress=data["progress"],
            step=data["step"],
            error=data["error"],
            original_video_url=data["original_video_url"],
            enhanced_video_url=data["enhanced_video_url"],
            original_audio_url=data["original_audio_url"],
            enhanced_audio_url=data["enhanced_audio_url"],
            metrics=data["metrics"],
            processing_time_sec=data["processing_time_sec"],
            options_used=data["options_used"],
            video_duration_sec=data["video_duration_sec"],
        )

    def start_processing(self, task_id: str, options: ProcessingOptions):
        task_data = self._tasks.get(task_id)
        if not task_data:
            raise KeyError(f"Task {task_id} not found")

        task_data["status"] = "processing"
        task_data["options_used"] = options
        task_data["step"] = "Starting voice cleaning pipeline..."
        task_data["progress"] = 5

        def progress_callback(progress: int, step_desc: str):
            if task_id in self._tasks:
                self._tasks[task_id]["progress"] = progress
                self._tasks[task_id]["step"] = step_desc

        def worker():
            try:
                task_dir = PROCESSED_DIR / task_id
                pipeline = VoiceCleanPipeline(progress_callback=progress_callback)
                res = pipeline.process(
                    video_input_path=task_data["input_video_path"],
                    output_dir=task_dir,
                    options=options
                )
                
                # Update task with completion status
                self._tasks[task_id].update({
                    "status": "completed",
                    "progress": 100,
                    "step": f"Finished in {res['processing_time']}s",
                    "enhanced_video_url": f"/api/media/{task_id}/enhanced-video",
                    "original_audio_url": f"/api/media/{task_id}/original-audio",
                    "enhanced_audio_url": f"/api/media/{task_id}/enhanced-audio",
                    "metrics": res["metrics"],
                    "processing_time_sec": res["processing_time"],
                    "video_duration_sec": res["duration"],
                    "result_paths": {
                        "enhanced_video": res["output_video_path"],
                        "original_audio": res["original_audio_path"],
                        "enhanced_audio": res["enhanced_audio_path"],
                    }
                })
            except Exception as e:
                logger.error(f"Task {task_id} failed: {e}", exc_info=True)
                if task_id in self._tasks:
                    self._tasks[task_id]["status"] = "failed"
                    self._tasks[task_id]["error"] = str(e)
                    self._tasks[task_id]["step"] = "Error encountered during processing"

        # Submit background thread worker
        self._executor.submit(worker)

# Global singleton task manager
task_manager = TaskManager()
