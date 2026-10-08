import os
import shutil
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse, StreamingResponse

from app.config import UPLOAD_DIR, PROCESSED_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB, FFMPEG_PATH
from app.models.schema import ProcessingOptions, TaskStatusResponse
from app.services.task_manager import task_manager
from app.services.ffmpeg_service import FFmpegService
from app.services.dsp.base import ENHANCER_REGISTRY

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

@router.get("/health")
def health_check():
    """Health status and environment capabilities."""
    return {
        "status": "healthy",
        "service": "VoiceClean API",
        "ffmpeg_path": FFMPEG_PATH,
        "available_enhancers": list(ENHANCER_REGISTRY.keys()),
        "max_file_size_mb": MAX_FILE_SIZE_MB,
        "allowed_extensions": list(ALLOWED_EXTENSIONS)
    }

@router.post("/demo-clip")
def create_demo_clip():
    """Generates an instant synthetic demo video with voice formants + noise for testing."""
    import uuid
    import numpy as np
    import soundfile as sf
    import subprocess
    
    task_id = str(uuid.uuid4())
    task_upload_dir = UPLOAD_DIR
    task_upload_dir.mkdir(parents=True, exist_ok=True)
    
    demo_video_path = task_upload_dir / f"demo_{task_id[:8]}.mp4"
    temp_wav = task_upload_dir / f"temp_{task_id[:8]}.wav"
    
    duration = 4.0
    sr = 48000
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    
    # Simulate voice: 220Hz harmonic voice with speech cadence + 2.8kHz formant
    speech_signal = (
        np.sin(2 * np.pi * 220 * t) * 0.45 +
        np.sin(2 * np.pi * 440 * t) * 0.30 +
        np.sin(2 * np.pi * 880 * t) * 0.15 +
        np.sin(2 * np.pi * 2800 * t) * 0.20
    )
    # Speech rhythm envelope (words & pauses)
    syllables = np.clip(np.sin(2 * np.pi * 2.2 * t) * np.sin(2 * np.pi * 0.8 * t), 0, 1) ** 1.5
    speech = speech_signal * syllables
    
    # Realistic background noise: 60Hz fan/HVAC hum + ambient white/pink noise
    hum = np.sin(2 * np.pi * 60 * t) * 0.18 + np.sin(2 * np.pi * 120 * t) * 0.08
    ambient_noise = np.random.normal(0, 0.09, len(t))
    noisy_mix = np.clip(speech + hum + ambient_noise, -0.92, 0.92).astype(np.float32)
    
    sf.write(str(temp_wav), noisy_mix, sr, subtype="PCM_16")
    
    # Create test video with FFmpeg
    cmd = [
        FFMPEG_PATH,
        "-y",
        "-f", "lavfi",
        "-i", f"testsrc=duration={duration}:size=854x480:rate=30",
        "-i", str(temp_wav),
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(demo_video_path)
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    temp_wav.unlink(missing_ok=True)
    
    created_id = task_manager.create_task("sample_noisy_speech.mp4", demo_video_path)
    task_manager.get_task(created_id)["video_duration_sec"] = duration
    
    return {
        "task_id": created_id,
        "filename": "sample_noisy_speech.mp4",
        "duration_sec": duration,
        "status": "queued",
        "original_video_url": f"/api/media/{created_id}/original-video"
    }

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """Uploads a video file, validates container format, and creates a task."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Save to upload directory
    temp_save_dir = UPLOAD_DIR
    temp_save_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique storage filename
    import uuid
    stored_name = f"{uuid.uuid4().hex[:12]}_{file.filename}"
    saved_path = temp_save_dir / stored_name

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Check file size limit
    size_mb = saved_path.stat().st_size / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        saved_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds max allowed size of {MAX_FILE_SIZE_MB}MB (uploaded: {size_mb:.1f}MB)"
        )

    # Probe media
    probe_info = FFmpegService.probe_media(saved_path)
    if not probe_info.get("has_audio"):
        saved_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail="The uploaded file does not contain an audio stream to denoise."
        )

    has_video = probe_info.get("has_video", False)
    preview_video_path = saved_path

    # If it's a voice/audio file, generate a companion lightweight MP4 preview for HTML5 video player
    if not has_video:
        preview_path = temp_save_dir / f"preview_{stored_name}.mp4"
        try:
            FFmpegService.create_audio_preview_video(saved_path, preview_path)
            preview_video_path = preview_path
        except Exception as e:
            logger.warning(f"Could not generate MP4 preview for audio file: {e}")
            preview_video_path = saved_path

    task_id = task_manager.create_task(
        filename=file.filename or "uploaded_audio.wav",
        input_video_path=saved_path
    )
    
    # Store duration and audio metadata
    task_manager.get_task(task_id)["video_duration_sec"] = probe_info.get("duration", 0.0)
    task_manager.get_task(task_id)["is_audio_only"] = not has_video
    task_manager.get_task(task_id)["preview_video_path"] = preview_video_path

    return {
        "task_id": task_id,
        "filename": file.filename,
        "duration_sec": probe_info.get("duration", 0.0),
        "status": "queued",
        "original_video_url": f"/api/media/{task_id}/original-video"
    }

@router.post("/process/{task_id}", response_model=TaskStatusResponse)
def process_task(task_id: str, options: ProcessingOptions = ProcessingOptions()):
    """Triggers background voice cleaning pipeline for an uploaded video."""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task_manager.start_processing(task_id, options)
    resp = task_manager.get_task_response(task_id)
    if not resp:
        raise HTTPException(status_code=500, detail="Failed to retrieve task")
    return resp

@router.get("/status/{task_id}", response_model=TaskStatusResponse)
def get_task_status(task_id: str):
    """Polls processing progress, steps, metrics, and media URLs."""
    resp = task_manager.get_task_response(task_id)
    if not resp:
        raise HTTPException(status_code=404, detail="Task not found")
    return resp

@router.get("/media/{task_id}/{media_type}")
def get_media(
    task_id: str,
    media_type: str,
    download: bool = Query(default=False)
):
    """
    Streams or downloads original/enhanced video or audio.
    media_type: 'original-video', 'enhanced-video', 'original-audio', 'enhanced-audio'
    """
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    file_path: Optional[Path] = None
    media_content_type = "video/mp4"
    attachment_name = f"voiceclean_{task_id}.mp4"

    if media_type == "original-video":
        file_path = task.get("preview_video_path") or task.get("input_video_path")
        media_content_type = "video/mp4"
        attachment_name = f"original_{task.get('filename')}"
    elif media_type == "enhanced-video":
        file_path = task.get("result_paths", {}).get("enhanced_video")
        media_content_type = "video/mp4"
        stem = Path(task.get("filename", "video")).stem
        attachment_name = f"{stem}_voicecleaned.mp4"
    elif media_type == "original-audio":
        file_path = task.get("result_paths", {}).get("original_audio")
        media_content_type = "audio/wav"
        attachment_name = f"original_{task_id}.wav"
    elif media_type == "enhanced-audio":
        file_path = task.get("result_paths", {}).get("enhanced_audio")
        media_content_type = "audio/wav"
        attachment_name = f"enhanced_{task_id}.wav"
    else:
        raise HTTPException(status_code=400, detail=f"Invalid media type '{media_type}'")

    if not file_path or not Path(file_path).exists():
        raise HTTPException(status_code=404, detail="Requested media is not yet generated or available")

    # Send response
    headers = {}
    if download:
        headers["Content-Disposition"] = f'attachment; filename="{attachment_name}"'

    return FileResponse(
        path=str(file_path),
        media_type=media_content_type,
        filename=attachment_name if download else None,
        headers=headers
    )
