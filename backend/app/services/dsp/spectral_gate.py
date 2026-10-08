import logging
import numpy as np
import noisereduce as nr

from app.models.schema import ProcessingOptions
from app.services.dsp.base import BaseAudioEnhancer, register_enhancer

logger = logging.getLogger(__name__)

@register_enhancer("spectral_gate")
class SpectralGateEnhancer(BaseAudioEnhancer):
    """
    Modular baseline noise suppressor using Spectral Gating DSP.
    Effectively attenuates continuous and ambient noise (fans, air conditioning,
    traffic hum, electrical hiss) while maintaining vocal fundamentals.
    """
    
    def enhance(self, audio: np.ndarray, sr: int, options: ProcessingOptions) -> np.ndarray:
        if len(audio) == 0:
            return audio
            
        strength = float(np.clip(options.noise_reduction_strength, 0.0, 1.0))
        if strength <= 0.01:
            logger.info("Noise reduction strength set to 0. Skipping spectral gating.")
            return audio

        # Determine stationary vs non-stationary mode based on preset
        stationary = options.preset != "aggressive"
        
        # prop_decrease maps 0.0 - 1.0 strength to suppression depth
        # 0.75 default provides strong noise reduction with minimal voice artifacting
        prop_decrease = strength

        logger.info(f"Applying spectral gate denoiser (strength={prop_decrease:.2f}, stationary={stationary}, sr={sr})")

        try:
            # noisereduce supports stationary spectral gating and time-frequency masking
            cleaned = nr.reduce_noise(
                y=audio,
                sr=sr,
                stationary=stationary,
                prop_decrease=prop_decrease,
                n_fft=2048,
                win_length=2048,
                hop_length=512,
                n_std_thresh_stationary=1.5,
                use_torch=False
            )
            return cleaned.astype(np.float32)
        except Exception as e:
            logger.error(f"Error in SpectralGateEnhancer: {e}", exc_info=True)
            # Graceful fallback: return original if gating encounters numerical issue
            return audio
