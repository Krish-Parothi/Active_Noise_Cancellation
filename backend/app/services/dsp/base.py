from abc import ABC, abstractmethod
from typing import Dict, Type
import numpy as np

from app.models.schema import ProcessingOptions

class BaseAudioEnhancer(ABC):
    """
    Abstract base class for all audio enhancement / voice isolation modules in VoiceClean.
    
    Open-source contributors can implement custom speech denoisers (e.g. DeepFilterNet,
    Demucs, RNNoise, Wave-U-Net) by subclassing BaseAudioEnhancer and registering it.
    """
    
    @abstractmethod
    def enhance(self, audio: np.ndarray, sr: int, options: ProcessingOptions) -> np.ndarray:
        """
        Process the raw 1D floating point audio numpy array and return the cleaned audio.
        
        Args:
            audio: 1D numpy array of audio samples (float32, range [-1.0, 1.0]).
            sr: Sample rate in Hz (e.g. 48000).
            options: Tunable parameters (strength, filters, EQ boosts).
            
        Returns:
            1D numpy array of cleaned audio samples (float32).
        """
        pass

# Registry mapping enhancer identifier strings to their class implementations
ENHANCER_REGISTRY: Dict[str, Type[BaseAudioEnhancer]] = {}

def register_enhancer(name: str):
    """Decorator to register a new audio enhancer in VoiceClean."""
    def decorator(cls: Type[BaseAudioEnhancer]):
        ENHANCER_REGISTRY[name.lower()] = cls
        return cls
    return decorator

def get_enhancer(name: str) -> BaseAudioEnhancer:
    """Retrieves an instantiated enhancer by name, falling back to 'spectral_gate'."""
    key = name.lower()
    if key not in ENHANCER_REGISTRY:
        key = "spectral_gate"
    cls = ENHANCER_REGISTRY.get(key)
    if cls is None:
        raise ValueError(f"No enhancer registered for '{name}'")
    return cls()
