import numpy as np
from typing import Tuple
from app.models.schema import AudioMetrics

def compute_frame_energies(audio: np.ndarray, frame_length: int = 1024, hop_length: int = 512) -> np.ndarray:
    """Computes RMS energy in dBFS for overlapping frames of audio."""
    if len(audio) < frame_length:
        rms = np.sqrt(np.mean(audio ** 2) + 1e-12)
        return np.array([20.0 * np.log10(max(rms, 1e-6))])
        
    # Number of frames
    num_frames = 1 + (len(audio) - frame_length) // hop_length
    shape = (num_frames, frame_length)
    strides = (audio.strides[0] * hop_length, audio.strides[0])
    frames = np.lib.stride_tricks.as_strided(audio, shape=shape, strides=strides)
    
    rms = np.sqrt(np.mean(frames ** 2, axis=1) + 1e-12)
    energies_db = 20.0 * np.log10(np.maximum(rms, 1e-6))
    return energies_db

def estimate_snr_and_noise_floor(audio: np.ndarray, sr: int = 48000) -> Tuple[float, float, float]:
    """
    Estimates (SNR in dB, noise floor in dBFS, peak amplitude in dBFS).
    Uses statistical energy distribution:
    - Noise floor estimated from the 10th percentile energy frames.
    - Signal (speech) estimated from the 85th percentile energy frames.
    """
    if len(audio) == 0:
        return 0.0, -96.0, -96.0
        
    frame_len = int(0.025 * sr) # 25 ms window
    hop_len = int(0.010 * sr)   # 10 ms hop
    
    energies_db = compute_frame_energies(audio, frame_len, hop_len)
    
    noise_floor_db = float(np.percentile(energies_db, 10))
    speech_energy_db = float(np.percentile(energies_db, 85))
    
    # SNR = Speech Level - Noise Level
    estimated_snr = max(0.0, speech_energy_db - noise_floor_db)
    
    peak_linear = np.max(np.abs(audio))
    peak_db = float(20.0 * np.log10(max(peak_linear, 1e-6)))
    
    return round(estimated_snr, 1), round(noise_floor_db, 1), round(peak_db, 1)

def calculate_audio_metrics(original_audio: np.ndarray, enhanced_audio: np.ndarray, sr: int = 48000) -> AudioMetrics:
    """Calculates comprehensive comparative metrics before and after VoiceClean processing."""
    orig_snr, orig_floor, orig_peak = estimate_snr_and_noise_floor(original_audio, sr)
    enh_snr, enh_floor, enh_peak = estimate_snr_and_noise_floor(enhanced_audio, sr)
    
    snr_improvement = round(max(0.0, enh_snr - orig_snr), 1)
    # How much lower the noise floor dropped (higher positive number = cleaner silence)
    noise_reduction = round(orig_floor - enh_floor, 1)
    if noise_reduction < 0:
        noise_reduction = 0.0
        
    return AudioMetrics(
        original_snr_db=orig_snr,
        enhanced_snr_db=enh_snr,
        snr_improvement_db=snr_improvement,
        noise_floor_reduction_db=noise_reduction,
        original_peak_db=orig_peak,
        enhanced_peak_db=enh_peak,
        original_noise_floor_db=orig_floor,
        enhanced_noise_floor_db=enh_floor
    )
