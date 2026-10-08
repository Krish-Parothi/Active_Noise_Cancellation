import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VideoUploader } from './components/VideoUploader';
import { ParameterControls } from './components/ParameterControls';
import { ProcessingProgress } from './components/ProcessingProgress';
import { VideoComparisonPlayer } from './components/VideoComparisonPlayer';
import { AudioMetricsCard } from './components/AudioMetricsCard';
import { ContributorGuideModal } from './components/ContributorGuideModal';

import { checkBackendHealth, startProcessing, pollTaskStatus } from './api';
import type { BackendHealth, ProcessingOptions, TaskStatusResponse, UploadResponse } from './types';
import { Sparkles, Film } from 'lucide-react';

export const App: React.FC = () => {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadResponse | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatusResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showContributorModal, setShowContributorModal] = useState(false);

  const [options, setOptions] = useState<ProcessingOptions>({
    preset: 'balanced',
    noise_reduction_strength: 0.75,
    speech_clarity_boost: 0.6,
    low_cut_hz: 85.0,
    high_cut_hz: 10500.0,
    voice_presence_boost_db: 3.5,
    normalize_loudness: true,
    enhancer_type: 'spectral_gate',
  });

  // Verify backend connectivity on load
  useEffect(() => {
    checkBackendHealth()
      .then(setHealth)
      .catch((err) => console.warn('Backend offline or starting up:', err));
  }, []);

  // Poll status while processing
  useEffect(() => {
    let timer: number;
    if (isProcessing && taskStatus?.task_id) {
      timer = window.setInterval(async () => {
        try {
          const status = await pollTaskStatus(taskStatus.task_id);
          setTaskStatus(status);
          if (status.status === 'completed' || status.status === 'failed') {
            setIsProcessing(false);
          }
        } catch (e) {
          console.error('Error polling status:', e);
        }
      }, 700);
    }
    return () => clearInterval(timer);
  }, [isProcessing, taskStatus?.task_id]);

  const handleUploadSuccess = (data: UploadResponse) => {
    setUploadedData(data);
    setTaskStatus(null);
  };

  const handleStartProcessing = async () => {
    if (!uploadedData) return;
    setIsProcessing(true);
    try {
      const initialStatus = await startProcessing(uploadedData.task_id, options);
      setTaskStatus(initialStatus);
    } catch (err: any) {
      alert(err.message || 'Failed to start processing');
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setUploadedData(null);
    setTaskStatus(null);
    setIsProcessing(false);
  };

  const isCompleted = taskStatus?.status === 'completed';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        health={health}
        onOpenContributorGuide={() => setShowContributorModal(true)}
      />

      <main style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: '32px 20px', flex: 1 }}>
        {/* Intro Banner */}
        {!isCompleted && !isProcessing && !uploadedData && (
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 999,
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              color: 'var(--accent-cyan)',
              fontSize: '0.84rem',
              fontWeight: 600,
              marginBottom: 16
            }}>
              <Sparkles size={14} />
              <span>Crystal Clear Voice • Zero Background Noise</span>
            </div>
            <h2 style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              marginBottom: 12
            }}>
              Isolate Human Voice. <br />
              <span style={{
                background: 'linear-gradient(135deg, #06B6D4 0%, #10B981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Eliminate Background Noise.
              </span>
            </h2>
            <p style={{ maxWidth: 640, margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Upload any video with speech contaminated by fans, AC, chatter, or traffic.
              VoiceClean extracts the 48kHz audio, performs spectral voice isolation and formant clarity boost,
              and remuxes clean video locally.
            </p>
          </div>
        )}

        {/* UPLOAD VIEW */}
        {!isCompleted && (
          <div>
            {!uploadedData ? (
              <VideoUploader
                onUploadSuccess={handleUploadSuccess}
                isProcessing={isProcessing}
              />
            ) : (
              /* Video selected and ready to process card */
              <div className="glass-panel" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'rgba(6, 182, 212, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Film size={22} color="var(--accent-cyan)" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{uploadedData.filename}</h3>
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: 'var(--accent-emerald)',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          Audio Verified
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Duration: {uploadedData.duration_sec.toFixed(1)}s • Ready for speech isolation
                      </p>
                    </div>
                  </div>

                  {!isProcessing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={handleReset}
                        className="btn-secondary"
                        style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                      >
                        Choose Different Video
                      </button>
                      <button
                        onClick={handleStartProcessing}
                        className="btn-primary"
                        style={{ padding: '9px 20px', fontSize: '0.9rem' }}
                      >
                        <Sparkles size={16} />
                        <span>Clean Voice & Denoise Video</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Parameter sliders */}
                <ParameterControls
                  options={options}
                  onChange={setOptions}
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* PROCESSING PROGRESS BAR */}
            {taskStatus && (
              <ProcessingProgress taskStatus={taskStatus} />
            )}
          </div>
        )}

        {/* COMPLETED COMPARISON & METRICS VIEW */}
        {isCompleted && taskStatus && (
          <div>
            <VideoComparisonPlayer
              task={taskStatus}
              onReset={handleReset}
            />

            {taskStatus.metrics && (
              <AudioMetricsCard
                metrics={taskStatus.metrics}
                taskId={taskStatus.task_id}
              />
            )}
          </div>
        )}
      </main>

      {/* Contributor Guide Modal */}
      <ContributorGuideModal
        isOpen={showContributorModal}
        onClose={() => setShowContributorModal(false)}
      />

      {/* Technical Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '20px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        marginTop: 40
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            VoiceClean • Local Video Speech Isolation & Noise Cancellation Engine
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>Backend: Python FastAPI + uv</span>
            <span>DSP: Spectral Gating & Formant EQ</span>
            <span>Engine: FFmpeg 48kHz</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
