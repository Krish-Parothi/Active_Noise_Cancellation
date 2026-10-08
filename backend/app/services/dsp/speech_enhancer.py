import logging
import numpy as np
from scipy import signal

from app.models.schema import ProcessingOptions

logger = logging.getLogger(__name__)

class SpeechEnhancer:
    """
    Multi-stage DSP vocal clarity and speech enhancement engine:
    1. Low-cut Rumble Filter: Eliminates HVAC, desk rumble, mic handling noise (<85Hz).
    2. Vocal Articulation EQ: Boosts 2.2kHz-3.8kHz speech presence for intelligible, crisp vocals.
    3. High-cut Harshness Filter: Damps high-frequency digital hash and hiss (>10.5kHz).
    4. Adaptive Loudness Normalization & Soft Limiter: Levels speech to studio broadcast standards (-1.0 dBFS).
    """

    @classmethod
    def apply_highpass(cls, audio: np.ndarray, sr: int, cutoff_hz: float = 85.0) -> np.ndarray:
        """Applies a 4th-order Butterworth highpass filter to eliminate sub-bass rumble."""
        nyquist = 0.5 * sr
        normalized_cutoff = min(cutoff_hz / nyquist, 0.99)
        if normalized_cutoff <= 0:
            return audio
            
        b, a = signal.butter(4, normalized_cutoff, btype='highpass')
        filtered = signal.filtfilt(b, a, audio)
        return filtered.astype(np.float32)

    @classmethod
    def apply_lowpass(cls, audio: np.ndarray, sr: int, cutoff_hz: float = 10500.0) -> np.ndarray:
        """Applies a 2nd-order Butterworth lowpass filter to damp harsh high-frequency noise."""
        nyquist = 0.5 * sr
        normalized_cutoff = min(cutoff_hz / nyquist, 0.99)
        if normalized_cutoff >= 0.99:
            return audio
            
        b, a = signal.butter(2, normalized_cutoff, btype='lowpass')
        filtered = signal.filtfilt(b, a, audio)
        return filtered.astype(np.float32)

    @classmethod
    def apply_presence_eq(
        cls,
        audio: np.ndarray,
        sr: int,
        center_freq_hz: float = 2800.0,
        gain_db: float = 3.5,
        q: float = 1.2
    ) -> np.ndarray:
        """
        Parametric peaking filter that boosts the human speech clarity/intelligibility formant band.
        Uses standard digital biquad filter formulation.
        """
        if abs(gain_db) < 0.1:
            return audio
            
        A = 10.0 ** (gain_db / 40.0)
        omega = 2.0 * np.pi * (center_freq_hz / sr)
        sin_omega = np.sin(omega)
        cos_omega = np.cos(omega)
        alpha = sin_omega / (2.0 * q)
        
        b0 = 1.0 + alpha * A
        b1 = -2.0 * cos_omega
        b2 = 1.0 - alpha * A
        a0 = 1.0 + alpha / A
        a1 = -2.0 * cos_omega
        a2 = 1.0 - alpha / A
        
        b = np.array([b0 / a0, b1 / a0, b2 / a0], dtype=np.float64)
        a = np.array([1.0, a1 / a0, a2 / a0], dtype=np.float64)
        
        boosted = signal.lfilter(b, a, audio)
        return boosted.astype(np.float32)

    @classmethod
    def normalize_loudness(cls, audio: np.ndarray, target_peak_db: float = -1.0) -> np.ndarray:
        """
        Normalizes vocal amplitude to target peak level (-1.0 dBFS by default)
        with soft-knee tanh limiting to prevent digital clipping.
        """
        current_peak = np.max(np.abs(audio))
        if current_peak < 1e-6:
            return audio
            
        target_linear = 10.0 ** (target_peak_db / 20.0) # approx 0.891
        gain = target_linear / current_peak
        
        # Apply gentle gain
        scaled = audio * gain
        
        # Soft tanh saturation if slight overshoot occurs
        overshoot = np.abs(scaled) > 0.95
        if np.any(overshoot):
            scaled = np.where(np.abs(scaled) > 0.9, np.tanh(scaled / 0.9) * 0.9, scaled)
            
        return scaled.astype(np.float32)

    @classmethod
    def enhance(cls, audio: np.ndarray, sr: int, options: ProcessingOptions) -> np.ndarray:
        """Runs the complete speech improvement and presence enhancement pipeline."""
        if len(audio) == 0:
            return audio

        processed = audio.copy()
        
        # Step 1: Remove low rumble / air conditioning hum
        if options.low_cut_hz > 20.0:
            processed = cls.apply_highpass(processed, sr, cutoff_hz=options.low_cut_hz)

        # Step 2: Vocal clarity & presence enhancement
        if options.speech_clarity_boost > 0.05:
            # Scale gain_db based on clarity boost factor
            effective_gain_db = options.voice_presence_boost_db * (options.speech_clarity_boost / 0.6)
            processed = cls.apply_presence_eq(
                processed,
                sr,
                center_freq_hz=2800.0,
                gain_db=effective_gain_db,
                q=1.2
            )

        # Step 3: Tame harsh highs
        if options.high_cut_hz < 18000.0:
            processed = cls.apply_lowpass(processed, sr, cutoff_hz=options.high_cut_hz)

        # Step 4: Level speech to broadcast standard
        if options.normalize_loudness:
            processed = cls.normalize_loudness(processed, target_peak_db=-1.0)

        return processed
