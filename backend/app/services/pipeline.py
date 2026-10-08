import time
import logging
from pathlib import Path
from typing import Callable, Optional
import soundfile as sf
import numpy as np

from app.models.schema import ProcessingOptions, AudioMetrics
from app.services.ffmpeg_service import FFmpegService
from app.services.dsp import get_enhancer, SpeechEnhancer, calculate_audio_metrics

logger = logging.getLogger(__name__)

class VoiceCleanPipeline:
    """
    Modular execution pipeline for VoiceClean:
    Video Upload -> Extract Audio -> Voice/Speech Isolation -> Noise Reduction 
                 -> Enhanced Audio -> Merge with Video -> Output Video
    """

    def __init__(self, progress_callback: Optional[Callable[[int, str], None]] = None):
        self.progress_callback = progress_callback or (lambda p, s: None)

    def _update(self, progress: int, step: str):
        logger.info(f"Pipeline progress [{progress}%]: {step}")
        self.progress_callback(progress, step)

    def process(
        self,
        video_input_path: Path,
        output_dir: Path,
        options: ProcessingOptions
    ) -> dict:
        """
        Executes the end-to-end voice cleaning and noise reduction workflow.
        """
        start_time = time.time()
        output_dir.mkdir(parents=True, exist_ok=True)
        
        extracted_wav_path = output_dir / "original_audio.wav"
        enhanced_wav_path = output_dir / "enhanced_audio.wav"
        output_video_path = output_dir / "voiceclean_output.mp4"

        # -------------------------------------------------------------
        # STEP 1: Probe Media Metadata & Audio Streams
        # -------------------------------------------------------------
        self._update(10, "Probing media container and audio stream...")
        media_info = FFmpegService.probe_media(video_input_path)
        duration = media_info.get("duration", 0.0)
        has_audio = media_info.get("has_audio", False)
        has_video = media_info.get("has_video", False)
        
        if not has_audio:
            raise ValueError("Input file does not contain any audio stream to process.")

        # -------------------------------------------------------------
        # STEP 2: Extract Audio via FFmpeg (48kHz 16-bit PCM WAV)
        # -------------------------------------------------------------
        self._update(25, "Extracting high-fidelity 48kHz audio track...")
        target_sr = 48000
        FFmpegService.extract_audio(video_input_path, extracted_wav_path, sample_rate=target_sr)

        # -------------------------------------------------------------
        # STEP 3: Load Audio into Memory
        # -------------------------------------------------------------
        self._update(40, "Loading audio waveform and computing noise profile...")
        audio_data, sr = sf.read(str(extracted_wav_path), dtype="float32")
        
        # If stereo, average to mono for speech enhancement or process channel
        if audio_data.ndim > 1:
            audio_data = np.mean(audio_data, axis=1)

        # -------------------------------------------------------------
        # STEP 4: Voice/Speech Isolation & Spectral Noise Reduction
        # -------------------------------------------------------------
        self._update(55, "Performing voice isolation & spectral gating noise suppression...")
        enhancer = get_enhancer(options.enhancer_type)
        denoised_audio = enhancer.enhance(audio_data, sr, options)

        # -------------------------------------------------------------
        # STEP 5: Speech Clarity & Formant Presence Enhancement
        # -------------------------------------------------------------
        self._update(72, "Applying speech formant clarity EQ, rumble filter & leveling...")
        enhanced_audio = SpeechEnhancer.enhance(denoised_audio, sr, options)

        # -------------------------------------------------------------
        # STEP 6: Compute Scientific Metrics & Write Enhanced WAV
        # -------------------------------------------------------------
        self._update(85, "Analyzing SNR improvements and writing enhanced audio master...")
        sf.write(str(enhanced_wav_path), enhanced_audio, sr, subtype="PCM_16")
        
        metrics = calculate_audio_metrics(audio_data, enhanced_audio, sr=sr)

        # -------------------------------------------------------------
        # STEP 7: Re-mux Enhanced Audio or Generate Preview
        # -------------------------------------------------------------
        if has_video:
            self._update(92, "Remuxing clean audio stream into video container...")
            FFmpegService.merge_audio_with_video(
                original_video_path=video_input_path,
                enhanced_audio_path=enhanced_wav_path,
                output_video_path=output_video_path
            )
        else:
            self._update(92, "Mastering clean audio and generating playback preview...")
            FFmpegService.create_audio_preview_video(
                audio_path=enhanced_wav_path,
                output_video_path=output_video_path
            )

        processing_time = round(time.time() - start_time, 2)
        self._update(100, f"Completed successfully in {processing_time}s")

        return {
            "output_video_path": output_video_path,
            "original_audio_path": extracted_wav_path,
            "enhanced_audio_path": enhanced_wav_path,
            "metrics": metrics,
            "processing_time": processing_time,
            "duration": duration,
        }
