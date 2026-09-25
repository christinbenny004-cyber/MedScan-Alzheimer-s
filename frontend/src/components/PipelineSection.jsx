/**
 * PipelineSection — Explains the 3-step deep learning and explainability pipeline.
 */
export default function PipelineSection() {
  return (
    <section className="pipeline-section" id="how-it-works">
      <div className="content-container">
        <div className="section-header">
          <div className="section-badge">How It Works</div>
          <h2 className="section-title">Transparent Diagnostic Intelligence</h2>
          <p className="section-subtitle">
            MedScan bridges the gap between black-box computer vision and clinical decision-making
            with a rigorous three-stage neuroimaging pipeline.
          </p>
        </div>

        <div className="pipeline-grid">
          {/* Step 1 */}
          <div className="pipeline-card">
            <span className="pipeline-step-badge">01</span>
            <div className="pipeline-card__icon">🔬</div>
            <h3 className="pipeline-card__title">T1-Weighted MRI Ingestion</h3>
            <p className="pipeline-card__desc">
              Accepts clinical axial brain MRI slices in standard image formats. Inputs undergo
              bi-cubic interpolation, ImageNet contrast normalization, and spatial tensor alignment
              ready for deep neural screening.
            </p>
          </div>

          {/* Step 2 */}
          <div className="pipeline-card">
            <span className="pipeline-step-badge">02</span>
            <div className="pipeline-card__icon">🧠</div>
            <h3 className="pipeline-card__title">Deep Residual Classification</h3>
            <p className="pipeline-card__desc">
              A 34-layer residual convolutional network extracts multi-scale spatial features. The model
              detects micro-structural biomarkers—including ventricular enlargement and hippocampal tissue
              attenuation—producing calibrated class probabilities.
            </p>
          </div>

          {/* Step 3 */}
          <div className="pipeline-card">
            <span className="pipeline-step-badge">03</span>
            <div className="pipeline-card__icon">🎯</div>
            <h3 className="pipeline-card__title">Grad-CAM Anatomical Mapping</h3>
            <p className="pipeline-card__desc">
              Gradients flowing into the final convolutional block are spatially pooled to generate
              interpretable heatmaps. Clinicians can directly visualize the specific brain structures
              driving the AI’s diagnostic verdict.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
