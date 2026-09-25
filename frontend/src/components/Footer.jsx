/**
 * Footer — Professional clinical disclaimer, architecture references, and version.
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="content-container">
        <div className="footer__links">
          <span>ResNet-34 Deep Residual Network</span>
          <span>•</span>
          <span>Grad-CAM Explainable AI</span>
          <span>•</span>
          <span>OASIS-1 Benchmark</span>
          <span>•</span>
          <span>PyTorch &amp; React</span>
        </div>
        <p className="footer__disclaimer">
          ⚠️ MedScan is an experimental AI decision-support research platform. It does not provide
          independent medical diagnosis. Always consult certified healthcare practitioners for
          neurological evaluations.
        </p>
      </div>
    </footer>
  );
}
