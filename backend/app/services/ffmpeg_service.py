import subprocess
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

from app.config import FFMPEG_PATH, FFPROBE_PATH

logger = logging.getLogger(__name__)

class FFmpegService:
    @staticmethod
    def probe_media(file_path: Path) -> Dict[str, Any]:
        """Inspects media container streams and metadata via ffprobe."""
        cmd = [
            FFPROBE_PATH,
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            str(file_path)
        ]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(result.stdout)
            
            # Extract basic duration and stream summaries
            duration = float(data.get("format", {}).get("duration", 0.0))
            has_video = any(s.get("codec_type") == "video" for s in data.get("streams", []))
            has_audio = any(s.get("codec_type") == "audio" for s in data.get("streams", []))
            
            return {
                "duration": duration,
                "has_video": has_video,
                "has_audio": has_audio,
                "format": data.get("format", {}),
                "streams": data.get("streams", [])
            }
        except subprocess.CalledProcessError as e:
            logger.error(f"ffprobe failed: {e.stderr}")
            return {"duration": 0.0, "has_video": False, "has_audio": False}
        except Exception as e:
            logger.error(f"Error inspecting media: {e}")
            return {"duration": 0.0, "has_video": False, "has_audio": False}

    @staticmethod
    def extract_audio(video_path: Path, output_wav_path: Path, sample_rate: int = 48000) -> Path:
        """
        Extracts high-resolution PCM 16-bit WAV audio from video file.
        Uses 48kHz for broadcast/video standard compliance.
        """
        output_wav_path.parent.mkdir(parents=True, exist_ok=True)
        cmd = [
            FFMPEG_PATH,
            "-y",
            "-i", str(video_path),
            "-vn",                       # Skip video
            "-acodec", "pcm_s16le",       # 16-bit linear PCM
            "-ar", str(sample_rate),     # 48000 Hz
            "-ac", "1",                  # Single-channel mono for voice isolation clarity
            str(output_wav_path)
        ]
        
        logger.info(f"Extracting audio: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"FFmpeg audio extraction failed:\n{result.stderr}")
            raise RuntimeError(f"Audio extraction failed: {result.stderr.strip()[-200:]}")
            
        if not output_wav_path.exists() or output_wav_path.stat().st_size == 0:
            raise RuntimeError("Extracted audio file is missing or empty.")
            
        return output_wav_path

    @staticmethod
    def merge_audio_with_video(
        original_video_path: Path,
        enhanced_audio_path: Path,
        output_video_path: Path
    ) -> Path:
        """
        Multiplexes the enhanced audio stream back into the original video container.
        Attempts lossless video stream copy first for maximum speed.
        Falls back to H.264 encode if container copy is incompatible.
        """
        output_video_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Primary pass: fast stream-copy of video track + AAC encode for clean audio
        cmd = [
            FFMPEG_PATH,
            "-y",
            "-i", str(original_video_path),
            "-i", str(enhanced_audio_path),
            "-map", "0:v:0",             # Original video track
            "-map", "1:a:0",             # Enhanced audio track
            "-c:v", "copy",              # Fast video pass-through without quality loss
            "-c:a", "aac",               # High quality AAC audio
            "-b:a", "256k",
            "-shortest",                 # Match shortest stream
            "-movflags", "+faststart",   # Web-optimized MP4 playback
            str(output_video_path)
        ]
        
        logger.info(f"Merging audio and video (stream-copy): {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.warning(f"Fast video stream-copy failed; falling back to re-encode: {result.stderr}")
            # Fallback pass: re-encode video with fast H.264
            cmd_fallback = [
                FFMPEG_PATH,
                "-y",
                "-i", str(original_video_path),
                "-i", str(enhanced_audio_path),
                "-map", "0:v:0",
                "-map", "1:a:0",
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "21",
                "-c:a", "aac",
                "-b:a", "256k",
                "-shortest",
                "-movflags", "+faststart",
                str(output_video_path)
            ]
            fallback_res = subprocess.run(cmd_fallback, capture_output=True, text=True)
            if fallback_res.returncode != 0:
                logger.error(f"Fallback video merge failed: {fallback_res.stderr}")
                raise RuntimeError(f"Video merging failed: {fallback_res.stderr.strip()[-200:]}")

        if not output_video_path.exists() or output_video_path.stat().st_size == 0:
            raise RuntimeError("Merged output video is empty or missing.")

        return output_video_path

    @staticmethod
    def create_audio_preview_video(
        audio_path: Path,
        output_video_path: Path
    ) -> Path:
        """
        Generates a lightweight MP4 video container with a dark slate background for an audio file.
        This enables browser HTML5 <video> components to stream and scrub voice audio cleanly.
        """
        output_video_path.parent.mkdir(parents=True, exist_ok=True)
        cmd = [
            FFMPEG_PATH,
            "-y",
            "-f", "lavfi",
            "-i", "color=c=0x0b1120:s=640x360:r=1",
            "-i", str(audio_path),
            "-c:v", "libx264",
            "-tune", "stillimage",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            "-movflags", "+faststart",
            str(output_video_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"Failed to create audio preview video: {result.stderr}")
            raise RuntimeError(f"Audio preview generation failed: {result.stderr.strip()[-200:]}")
        return output_video_path

