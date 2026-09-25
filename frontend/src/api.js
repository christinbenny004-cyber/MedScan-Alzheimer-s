/**
 * MedScan — API Client
 * Handles all communication with the Flask backend.
 */

const API_BASE_URL = 'http://127.0.0.1:4000';

/**
 * Check if the backend is running and the model is loaded.
 * @returns {Promise<{status: string, model: string, num_classes: number, class_names: string[]}>}
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Upload an image for classification and Grad-CAM generation.
 * @param {File} file - The image file to upload
 * @returns {Promise<object>} The prediction results and image data
 */
export async function predictImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Prediction failed: ${response.status}`);
  }

  return response.json();
}
