from pathlib import Path
import os
import shutil

# Base directory for the backend
BASE_DIR = Path(__file__).resolve().parent.parent

# Storage directories for uploads, intermediate audio, and outputs
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
PROCESSED_DIR = DATA_DIR / "processed"
TEMP_DIR = DATA_DIR / "temp"

# Create necessary directories
for path in [UPLOAD_DIR, PROCESSED_DIR, TEMP_DIR]:
    path.mkdir(parents=True, exist_ok=True)

# File constraints
MAX_FILE_SIZE_MB = int(os.getenv("VOICECLEAN_MAX_FILE_SIZE_MB", "500"))
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v"}
ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg", ".opus", ".wma"}
ALLOWED_EXTENSIONS = ALLOWED_VIDEO_EXTENSIONS | ALLOWED_AUDIO_EXTENSIONS

# Locate FFmpeg executable (supports PATH or custom environment/path)
def find_ffmpeg_binaries():
    ffmpeg_exec = shutil.which("ffmpeg")
    ffprobe_exec = shutil.which("ffprobe")
    
    # Common fallback paths on Windows if not immediately in PATH
    fallback_bins = [
        Path(r"C:\ffmpeg\bin"),
        Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "ffmpeg" / "bin",
    ]
    
    if not ffmpeg_exec:
        for fb in fallback_bins:
            candidate = fb / "ffmpeg.exe"
            if candidate.exists():
                ffmpeg_exec = str(candidate)
                break
                
    if not ffprobe_exec:
        for fb in fallback_bins:
            candidate = fb / "ffprobe.exe"
            if candidate.exists():
                ffprobe_exec = str(candidate)
                break
                
    return ffmpeg_exec or "ffmpeg", ffprobe_exec or "ffprobe"

FFMPEG_PATH, FFPROBE_PATH = find_ffmpeg_binaries()
