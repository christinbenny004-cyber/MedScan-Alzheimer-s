import { useEffect, useState } from 'react';

/**
 * ResultsSection — Displays classification results, confidence bars,
 * interactive MRI comparison (Side-by-Side vs Opacity Overlay), Grad-CAM color legend,
 * and comprehensive anatomical explainability breakdown.
 *
 * Props:
 *   result: { prediction, gradcam_image, original_image, analysis }
 *   onReset: () => void  — go back to upload view
 */
export default function ResultsSection({ result, onReset }) {
  const { prediction, gradcam_image, original_image, analysis } = result;
  const [animatedBars, setAnimatedBars] = useState(false);
  const [viewerMode, setViewerMode] = useState('side-by-side'); // 'side-by-side' | 'overlay'
  const [overlayOpacity, setOverlayOpacity] = useState(0.65);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedBars(true), 120);
    return () => clearTimeout(timer);
  }, []);

  // Determine safety
  const isSafe =
    prediction.predicted_class === 'Non Demented' ||
    prediction.predicted_class === 'Cognitively Normal' ||
    prediction.predicted_class === 'Normal';

  const maxProb = Math.max(...Object.values(prediction.probabilities));

  return (
    <div className="results-section">
      {/* ── Section Header ─────────────────────────────────── */}
      <div className="results-header">
        <div className="section-badge">Diagnostic Report</div>
        <h2 className="results-header__title">Analysis & Explainability Results</h2>
        <p className="results-header__subtitle">
          Deep residual neural classification combined with Grad-CAM visual attention mapping.
        </p>
      </div>

      {/* ── Classification Result Card ────────────────────── */}
      <div className={`glass-card result-card ${isSafe ? 'result-card--safe' : 'result-card--danger'}`}>
        <p className="result-card__label">Diagnostic Verdict</p>
        <h3 className={`result-card__class ${isSafe ? 'result-card__class--safe' : 'result-card__class--danger'}`}>
          {prediction.predicted_class}
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <div className="result-card__confidence">
            <span>Model Confidence:</span>
            <span className="result-card__confidence-value">
              {(prediction.confidence * 100).toFixed(1)}%
            </span>
          </div>

          {analysis?.clinical_status && (
            <div
              className="result-card__confidence"
              style={{
                background: isSafe ? 'var(--status-safe-bg)' : 'var(--status-danger-bg)',
                borderColor: isSafe ? 'var(--status-safe-border)' : 'var(--status-danger-border)',
                color: isSafe ? 'var(--status-safe-text)' : 'var(--status-danger-text)',
              }}
            >
              <span>Status:</span>
              <span>{analysis.clinical_status}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Class Probabilities Card ──────────────────────── */}
      <div className="glass-card confidence-panel">
        <div className="confidence-panel__title">
          <span>Class Probability Distribution</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Softmax Calibrated Output
          </span>
        </div>

        {Object.entries(prediction.probabilities).map(([className, prob]) => {
          const percentage = (prob * 100).toFixed(1);
          const isDanger =
            className !== 'Non Demented' &&
            className !== 'Cognitively Normal' &&
            className !== 'Normal';
          const isMaxClass = prob === maxProb;

          return (
            <div className="confidence-bar" key={className}>
              <div className="confidence-bar__header">
                <span className="confidence-bar__name">
                  {isMaxClass ? '▸ ' : ''}
                  {className}
                </span>
                <span className="confidence-bar__value">{percentage}%</span>
              </div>
              <div className="confidence-bar__track">
                <div
                  className={`confidence-bar__fill ${
                    isDanger && isMaxClass ? 'confidence-bar__fill--danger' : ''
                  }`}
                  style={{
                    width: animatedBars ? `${percentage}%` : '0%',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Interactive MRI Viewer & Comparison ────────────── */}
      <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
        <div className="viewer-controls">
          <div className="tab-group">
            <button
              type="button"
              className={`tab-btn ${viewerMode === 'side-by-side' ? 'tab-btn--active' : ''}`}
              onClick={() => setViewerMode('side-by-side')}
            >
              Side-by-Side View
            </button>
            <button
              type="button"
              className={`tab-btn ${viewerMode === 'overlay' ? 'tab-btn--active' : ''}`}
              onClick={() => setViewerMode('overlay')}
            >
              Interactive Overlay Slider
            </button>
          </div>

          {viewerMode === 'overlay' && (
            <div className="opacity-slider-box">
              <span>Heatmap Blend:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="opacity-slider"
                aria-label="Heatmap Blend Opacity"
              />
              <span style={{ minWidth: 40, fontWeight: 700, color: 'var(--accent-primary)' }}>
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* View Mode 1: Side by Side */}
        {viewerMode === 'side-by-side' && (
          <div className="mri-comparison">
            <div className="mri-panel">
              <p className="mri-panel__label">Original T1 MRI Scan</p>
              <div className="mri-panel__image-wrapper">
                <img
                  src={`data:image/png;base64,${original_image}`}
                  alt="Original MRI scan"
                  className="mri-panel__image"
                />
              </div>
            </div>

            <div className="mri-panel">
              <p className="mri-panel__label">Grad-CAM Heatmap Localization</p>
              <div className="mri-panel__image-wrapper">
                <img
                  src={`data:image/png;base64,${gradcam_image}`}
                  alt="Grad-CAM heatmap overlay showing regions of interest"
                  className="mri-panel__image"
                />
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Interactive Overlay */}
        {viewerMode === 'overlay' && (
          <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
            <p className="mri-panel__label" style={{ marginBottom: 'var(--space-sm)' }}>
              Interactive Anatomical Blend (Adjust slider above to peel heatmap)
            </p>
            <div className="mri-overlay-wrapper">
              <img
                src={`data:image/png;base64,${original_image}`}
                alt="Underlying MRI Scan"
                className="mri-overlay__base"
              />
              <img
                src={`data:image/png;base64,${gradcam_image}`}
                alt="Grad-CAM Overlay"
                className="mri-overlay__layer"
                style={{ opacity: overlayOpacity }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Grad-CAM Color Legend ─────────────────────────── */}
      <div className="xai-legend-card">
        <h4 className="xai-legend-card__title">
          <span>🎨</span>
          <span>Grad-CAM Activation Heatmap Legend</span>
        </h4>
        <div className="xai-legend-grid">
          <div className="xai-legend-item">
            <div className="xai-swatch xai-swatch--high" />
            <div className="xai-legend-text">
              <strong>Crimson / Red (Peak Attention &gt; 70%)</strong>
              Primary anatomical biomarkers actively driving the AI model's prediction.
            </div>
          </div>

          <div className="xai-legend-item">
            <div className="xai-swatch xai-swatch--medium" />
            <div className="xai-legend-text">
              <strong>Yellow / Amber (Contributory 40–70%)</strong>
              Secondary structural features and adjacent parenchymal boundaries.
            </div>
          </div>

          <div className="xai-legend-item">
            <div className="xai-swatch xai-swatch--low" />
            <div className="xai-legend-text">
              <strong>Blue / Transparent (Baseline &lt; 40%)</strong>
              Unaffected or non-influential background brain tissue.
            </div>
          </div>
        </div>
      </div>

      {/* ── Deep Anatomical & Clinical Explainability ──────── */}
      {analysis && (
        <div className="xai-breakdown-card">
          <div className="xai-breakdown-header">
            <h3 className="xai-breakdown-title">
              <span>🧠</span>
              <span>Anatomical Region Attribution & Interpretation</span>
            </h3>

            <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
              <div className="xai-region-badge">
                <span>📍</span>
                <span>{analysis.region}</span>
              </div>
              {analysis.hemisphere && (
                <div
                  className="xai-region-badge"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                >
                  <span>{analysis.hemisphere}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="xai-details-grid">
            <div className="xai-detail-block">
              <span className="xai-detail-block__label">Anatomical Landmark</span>
              <p className="xai-detail-block__headline">{analysis.biomarker || analysis.region}</p>
              <p className="xai-detail-block__desc">{analysis.anatomical_role}</p>
            </div>

            <div className="xai-detail-block">
              <span className="xai-detail-block__label">Neuropathological Rationale</span>
              <p className="xai-detail-block__headline">
                {isSafe ? 'Structural Preservation' : 'Pathological Biomarker Infiltration'}
              </p>
              <p className="xai-detail-block__desc">{analysis.pathological_findings}</p>
            </div>
          </div>

          {/* Severity Metric Box */}
          <div className="severity-gauge-card">
            <div className="severity-gauge__header">
              <span className="severity-gauge__title">
                {analysis.metric_label || 'Diagnostic Index'}
              </span>
              <span
                className={`severity-gauge__score ${
                  isSafe
                    ? 'severity-gauge__score--safe'
                    : analysis.severity_score >= 7
                    ? 'severity-gauge__score--danger'
                    : 'severity-gauge__score--warning'
                }`}
              >
                {analysis.severity_score} / 10
              </span>
            </div>

            <div className="severity-gauge__track">
              <div
                className="severity-gauge__fill"
                style={{
                  width: `${(analysis.severity_score / 10) * 100}%`,
                  background: isSafe
                    ? 'linear-gradient(135deg, #059669, #34d399)'
                    : analysis.severity_score >= 7
                    ? 'linear-gradient(135deg, var(--status-danger), #ff7b8f)'
                    : 'linear-gradient(135deg, var(--status-warning), #ffd180)',
                }}
              />
            </div>

            <div className="severity-gauge__info">
              <span>Classification: <strong>{analysis.category}</strong></span>
              {analysis.coverage_pct !== undefined && (
                <span>Spatial Attention Area: <strong>{analysis.coverage_pct}% of brain volume</strong></span>
              )}
            </div>
          </div>

          {/* Clinical Next Steps */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="recommendations-box">
              <h4 className="recommendations-box__title">
                <span>📋</span>
                <span>Recommended Clinical Follow-Up & Next Steps</span>
              </h4>
              <ul className="recommendations-list">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Clinical Disclaimer ──────────────────────────── */}
      <div className="disclaimer">
        <span className="disclaimer__icon">⚠️</span>
        <p className="disclaimer__text">
          <strong>Clinical Decision Support Disclaimer:</strong> MedScan is an experimental artificial
          intelligence system engineered for exploratory and decision-support research. It is{' '}
          <strong>not an autonomous medical diagnostic device</strong>. All Grad-CAM heatmaps,
          class probabilities, and severity scores must be verified by a board-certified neurologist or
          radiologist in conjunction with comprehensive clinical assessments (e.g. MoCA, MMSE, and CSF biomarkers).
        </p>
      </div>

      {/* ── Scan Again Button ────────────────────────────── */}
      <button className="btn-scan-again" onClick={onReset}>
        <span>🔄 Scan Another Brain MRI</span>
      </button>
    </div>
  );
}
