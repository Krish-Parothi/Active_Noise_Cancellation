import os
import sys
import subprocess
import tempfile
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import soundfile as sf

from app.models.schema import ProcessingOptions
from app.services.pipeline import VoiceCleanPipeline
from app.services.ffmpeg_service import FFmpegService
from app.config import FFMPEG_PATH

def create_synthetic_noisy_video(output_mp4: Path, duration_sec: float = 3.0, sr: int = 48000) -> Path:
    """
    Creates a synthetic video with a colored test card and an audio track
    containing voice-like speech formants mixed with heavy background noise.
    """
    t = np.linspace(0, duration_sec, int(sr * duration_sec), endpoint=False)
    
    # Simulate speech: intermittent harmonic tones (e.g. 220Hz, 440Hz, 880Hz, 2500Hz)
    speech_signal = np.sin(2 * np.pi * 220 * t) * 0.4 + np.sin(2 * np.pi * 440 * t) * 0.25 + np.sin(2 * np.pi * 2500 * t) * 0.15
    # Modulate like human syllables (rhythm)
    envelope = np.clip(np.sin(2 * np.pi * 2.5 * t), 0, 1) ** 2
    speech = speech_signal * envelope
    
    # Heavy background noise: 60Hz power hum + air conditioning rumble + white noise
    hum = np.sin(2 * np.pi * 60 * t) * 0.15
    white_noise = np.random.normal(0, 0.08, len(t))
    noisy_audio = speech + hum + white_noise
    
    # Clip to valid audio range
    noisy_audio = np.clip(noisy_audio, -0.95, 0.95).astype(np.float32)
    
    temp_wav = output_mp4.parent / "temp_synth_audio.wav"
    sf.write(str(temp_wav), noisy_audio, sr, subtype="PCM_16")

    # Generate synthetic video using FFmpeg testsrc
    cmd = [
        FFMPEG_PATH,
        "-y",
        "-f", "lavfi",
        "-i", f"testsrc=duration={duration_sec}:size=640x360:rate=24",
        "-i", str(temp_wav),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        str(output_mp4)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg synthetic video creation failed: {res.stderr}")
        
    temp_wav.unlink(missing_ok=True)
    return output_mp4

def test_pipeline_end_to_end():
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        noisy_video_path = tmp_path / "noisy_input.mp4"
        processed_dir = tmp_path / "processed"
        
        # 1. Create synthetic noisy video
        create_synthetic_noisy_video(noisy_video_path, duration_sec=3.0)
        assert noisy_video_path.exists()
        
        # 2. Probe media
        info = FFmpegService.probe_media(noisy_video_path)
        assert info["has_video"] is True
        assert info["has_audio"] is True
        assert info["duration"] > 2.0
        
        # 3. Run VoiceClean Pipeline
        progress_updates = []
        pipeline = VoiceCleanPipeline(progress_callback=lambda p, s: progress_updates.append((p, s)))
        
        options = ProcessingOptions(
            noise_reduction_strength=0.8,
            speech_clarity_boost=0.7,
            low_cut_hz=85.0
        )
        
        result = pipeline.process(
            video_input_path=noisy_video_path,
            output_dir=processed_dir,
            options=options
        )
        
        # 4. Verify outputs
        assert result["output_video_path"].exists()
        assert result["original_audio_path"].exists()
        assert result["enhanced_audio_path"].exists()
        
        metrics = result["metrics"]
        print(f"Original SNR: {metrics.original_snr_db} dB")
        print(f"Enhanced SNR: {metrics.enhanced_snr_db} dB")
        print(f"SNR Improvement: {metrics.snr_improvement_db} dB")
        print(f"Noise floor reduction: {metrics.noise_floor_reduction_db} dB")
        
        # We expect noise floor reduction to be positive
        assert metrics.noise_floor_reduction_db >= 0.0
        assert len(progress_updates) >= 5
        print("Test passed successfully!")

if __name__ == "__main__":
    test_pipeline_end_to_end()
