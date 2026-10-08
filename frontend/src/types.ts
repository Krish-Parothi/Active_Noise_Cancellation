export type ProcessingPreset = 'balanced' | 'aggressive' | 'gentle' | 'podcast';

export interface ProcessingOptions {
  preset: ProcessingPreset;
  noise_reduction_strength: number; // 0.0 - 1.0
  speech_clarity_boost: number;     // 0.0 - 1.0
  low_cut_hz: number;               // 20 - 300
  high_cut_hz: number;              // 4000 - 20000
  voice_presence_boost_db: number;  // 0 - 12
  normalize_loudness: boolean;
  enhancer_type: string;            // 'spectral_gate', etc.
}

export interface AudioMetrics {
  original_snr_db: number;
  enhanced_snr_db: number;
  snr_improvement_db: number;
  noise_floor_reduction_db: number;
  original_peak_db: number;
  enhanced_peak_db: number;
  original_noise_floor_db: number;
  enhanced_noise_floor_db: number;
}

export interface TaskStatusResponse {
  task_id: string;
  filename: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  step: string;
  error?: string | null;
  original_video_url?: string | null;
  enhanced_video_url?: string | null;
  original_audio_url?: string | null;
  enhanced_audio_url?: string | null;
  metrics?: AudioMetrics | null;
  processing_time_sec?: number | null;
  options_used?: ProcessingOptions | null;
  video_duration_sec?: number | null;
}

export interface UploadResponse {
  task_id: string;
  filename: string;
  duration_sec: number;
  status: string;
  original_video_url: string;
}

export interface BackendHealth {
  status: string;
  service: string;
  ffmpeg_path: string;
  available_enhancers: string[];
  max_file_size_mb: number;
  allowed_extensions: string[];
}
