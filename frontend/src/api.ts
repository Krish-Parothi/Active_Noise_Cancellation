import type { ProcessingOptions, TaskStatusResponse, UploadResponse, BackendHealth } from './types';

const API_BASE = '/api';

export async function checkBackendHealth(): Promise<BackendHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed (${res.status})`);
  }
  return res.json();
}

export async function uploadVideoFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed with status ${res.status}`);
  }

  return res.json();
}

export async function requestDemoClip(): Promise<UploadResponse> {
  const res = await fetch(`${API_BASE}/demo-clip`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error(`Failed to generate demo clip (${res.status})`);
  }

  return res.json();
}

export async function startProcessing(
  taskId: string,
  options: ProcessingOptions
): Promise<TaskStatusResponse> {
  const res = await fetch(`${API_BASE}/process/${taskId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Processing start failed (${res.status})`);
  }

  return res.json();
}

export async function pollTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  const res = await fetch(`${API_BASE}/status/${taskId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch task status (${res.status})`);
  }
  return res.json();
}

export function getDownloadUrl(taskId: string, mediaType: 'enhanced-video' | 'enhanced-audio'): string {
  return `${API_BASE}/media/${taskId}/${mediaType}?download=true`;
}
