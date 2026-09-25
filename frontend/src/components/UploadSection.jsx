import { useState, useRef } from 'react';

/**
 * UploadSection — Drag-and-drop MRI image upload with quick OASIS benchmark samples.
 *
 * Props:
 *   onAnalyse(file) — called when user clicks "Analyse Scan"
 *   isLoading — disables the button during inference
 */
export default function UploadSection({ onAnalyse, isLoading }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const fileInputRef = useRef(null);

  // ── Drag Events ────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // ── Click to Upload ────────────────────────────────────
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  // ── Quick Load Benchmark Sample ────────────────────────
  const loadSample = async (samplePath, filename) => {
    try {
      setSampleLoading(true);
      const response = await fetch(samplePath);
      const blob = await response.blob();
      const sampleFile = new File([blob], filename, { type: 'image/png' });
      handleFile(sampleFile);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    } finally {
      setSampleLoading(false);
    }
  };

  // ── Remove File ────────────────────────────────────────
  const handleRemove = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ── Submit ─────────────────────────────────────────────
  const handleAnalyse = () => {
    if (file && onAnalyse) {
      onAnalyse(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section className="upload-section" id="upload-studio">
      <div className="content-container">
        <div className="studio-card">
          {/* Section Header */}
          <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="section-badge">Diagnostic Studio</div>
            <h2 className="section-title">Upload Axial Brain MRI</h2>
            <p className="section-subtitle">
              Input a T1-weighted axial slice for deep residual classification and
              Grad-CAM anatomical explainability.
            </p>
          </div>

          {/* Sample MRI Scans Bar */}
          <div className="sample-bar">
            <span className="sample-bar__label">
              ⚡ Quick Test with OASIS Benchmark Samples:
            </span>
            <div className="sample-bar__pills">
              <button
                className="sample-pill"
                type="button"
                onClick={() => loadSample('/samples/sample_healthy.png', 'oasis_normal_cdr0.0.png')}
                disabled={isLoading || sampleLoading}
              >
                <span>🟢</span>
                <span>Healthy Control (CDR 0.0)</span>
              </button>
              <button
                className="sample-pill"
                type="button"
                onClick={() => loadSample('/samples/sample_demented.png', 'oasis_demented_cdr1.0.png')}
                disabled={isLoading || sampleLoading}
              >
                <span>🔴</span>
                <span>Alzheimer's Patient (CDR 1.0)</span>
              </button>
            </div>
          </div>

          {/* Dropzone or Preview */}
          {!file ? (
            <div
              className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClick}
              role="button"
              tabIndex={0}
              aria-label="Upload MRI scan"
            >
              <div className="dropzone__icon">📁</div>
              <p className="dropzone__text">
                <strong>Click to browse</strong> or drag & drop an MRI scan here
              </p>
              <p className="dropzone__formats">
                Supports PNG, JPG, JPEG, TIFF, BMP (Max 16 MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="upload-preview">
              <div className="upload-preview__container">
                <button
                  className="upload-preview__remove"
                  onClick={handleRemove}
                  aria-label="Remove file"
                  title="Remove file"
                >
                  ✕
                </button>
                <img
                  src={preview}
                  alt="Selected MRI scan"
                  className="upload-preview__image"
                />
                <div className="upload-preview__details">
                  <span className="upload-preview__name">{file.name}</span>
                  <span style={{ color: 'var(--text-light)' }}>•</span>
                  <span>{formatFileSize(file.size)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Analyse Button */}
          {file && (
            <button
              className="btn-analyse"
              onClick={handleAnalyse}
              disabled={isLoading || sampleLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner"
                    style={{ width: 22, height: 22, borderWidth: 2, borderTopColor: '#ffffff' }}
                  />
                  <span>Running ResNet & Grad-CAM Analysis...</span>
                </>
              ) : (
                <>
                  <span>🔍 Run Diagnostic Analysis</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
