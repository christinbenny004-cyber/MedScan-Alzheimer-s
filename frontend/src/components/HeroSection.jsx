/**
 * HeroSection — Landing page hero with clinical badges, metrics, and CTA triggers.
 */
export default function HeroSection({ onLaunchStudio, onExploreExplainability }) {
  return (
    <section className="hero-section">
      <div className="content-container">
        {/* Badge */}
        <div className="hero-badge">
          <span>🧠</span>
          <span>AI-Powered Neuroimaging Decision Support</span>
        </div>

        {/* Headline */}
        <h1 className="hero-title">
          Precision Alzheimer's Detection with{' '}
          <span className="hero-title__gradient">Explainable AI</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          Transform raw axial brain MRI scans into transparent, clinically interpretable
          diagnostic insights. MedScan combines deep residual networks with Grad-CAM activation
          mapping to detect structural neurodegeneration before symptoms escalate.
        </p>

        {/* CTA Buttons */}
        <div className="hero-cta-group">
          <button className="btn-primary" onClick={onLaunchStudio}>
            <span>Launch Diagnostic Studio</span>
            <span>↓</span>
          </button>
          <button className="btn-secondary" onClick={onExploreExplainability}>
            <span>Explore Clinical Pipeline</span>
            <span>➔</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="hero-stats">
          <div className="hero-stat-card">
            <div className="hero-stat-value">99.8%</div>
            <div className="hero-stat-label">Model Accuracy</div>
            <div className="hero-stat-desc">OASIS-1 Subject-Split Benchmark</div>
          </div>

          <div className="hero-stat-card">
            <div className="hero-stat-value">&lt; 350ms</div>
            <div className="hero-stat-label">Inference Latency</div>
            <div className="hero-stat-desc">Near-instantaneous AI screening</div>
          </div>

          <div className="hero-stat-card">
            <div className="hero-stat-value">ResNet-34</div>
            <div className="hero-stat-label">Deep Architecture</div>
            <div className="hero-stat-desc">21.2M parameter residual trunk</div>
          </div>

          <div className="hero-stat-card">
            <div className="hero-stat-value">Grad-CAM</div>
            <div className="hero-stat-label">Visual Attribution</div>
            <div className="hero-stat-desc">Anatomical attention mapping</div>
          </div>
        </div>
      </div>
    </section>
  );
}
