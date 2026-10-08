from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum

class ProcessingPreset(str, Enum):
    BALANCED = "balanced"
    AGGRESSIVE = "aggressive"
    GENTLE = "gentle"
    PODCAST = "podcast"

class ProcessingOptions(BaseModel):
    preset: ProcessingPreset = Field(
        default=ProcessingPreset.BALANCED,
        description="Pre-configured tuning profile"
    )
    noise_reduction_strength: float = Field(
        default=0.75,
        ge=0.0,
        le=1.0,
        description="Spectral gating noise suppression strength (0.0=off, 1.0=maximum)"
    )
    speech_clarity_boost: float = Field(
        default=0.6,
        ge=0.0,
        le=1.0,
        description="Formant presence enhancement for speech intelligibility (1-4kHz)"
    )
    low_cut_hz: float = Field(
        default=85.0,
        ge=20.0,
        le=300.0,
        description="High-pass filter cutoff to eliminate HVAC, desk rumble, and wind"
    )
    high_cut_hz: float = Field(
        default=10500.0,
        ge=4000.0,
        le=20000.0,
        description="Low-pass filter cutoff to dampen harsh sibilance and high hiss"
    )
    voice_presence_boost_db: float = Field(
        default=3.5,
        ge=0.0,
        le=12.0,
        description="Gain in dB applied to vocal clarity frequency bands"
    )
    normalize_loudness: bool = Field(
        default=True,
        description="Automatic gain control to bring vocals to studio broadcast levels (-1.0 dBFS)"
    )
    enhancer_type: str = Field(
        default="spectral_gate",
        description="Audio enhancer backend: 'spectral_gate' (modular baseline) or pluggable ML models"
    )

class AudioMetrics(BaseModel):
    original_snr_db: float = Field(..., description="Estimated SNR of input audio in dB")
    enhanced_snr_db: float = Field(..., description="Estimated SNR of enhanced audio in dB")
    snr_improvement_db: float = Field(..., description="Improvement in Signal-to-Noise Ratio in dB")
    noise_floor_reduction_db: float = Field(..., description="Estimated noise floor reduction in dB")
    original_peak_db: float = Field(..., description="Peak amplitude of input in dBFS")
    enhanced_peak_db: float = Field(..., description="Peak amplitude of enhanced in dBFS")
    original_noise_floor_db: float = Field(..., description="Estimated background noise level before")
    enhanced_noise_floor_db: float = Field(..., description="Estimated background noise level after")

class TaskStatusResponse(BaseModel):
    task_id: str
    filename: str
    status: Literal["queued", "processing", "completed", "failed"]
    progress: int = Field(default=0, ge=0, le=100)
    step: str = "Queued for processing"
    error: Optional[str] = None
    original_video_url: Optional[str] = None
    enhanced_video_url: Optional[str] = None
    original_audio_url: Optional[str] = None
    enhanced_audio_url: Optional[str] = None
    metrics: Optional[AudioMetrics] = None
    processing_time_sec: Optional[float] = None
    options_used: Optional[ProcessingOptions] = None
    video_duration_sec: Optional[float] = None
