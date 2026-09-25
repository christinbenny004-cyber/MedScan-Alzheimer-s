import { useState } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import PipelineSection from './components/PipelineSection';
import UploadSection from './components/UploadSection';
import ResultsSection from './components/ResultsSection';
import Footer from './components/Footer';
import { predictImage } from './api';

/**
 * App — Main MedScan Landing & Diagnostic Application.
 *
 * Provides a landing page with hero metrics and pipeline overview,
 * smooth scrolling down to the Upload Studio, and an explainability-rich
 * Results Section with Grad-CAM heatmap visualization.
 */
export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'loading' | 'results'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const scrollToStudio = () => {
    if (view === 'results') {
      setView('landing');
      setTimeout(() => {
        document.getElementById('upload-studio')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('upload-studio')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToWorks = () => {
    if (view === 'results') {
      setView('landing');
      setTimeout(() => {
        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAnalyse = async (file) => {
    setView('loading');
    setError(null);

    try {
      const data = await predictImage(file);
      setResult(data);
      setView('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'An unexpected inference error occurred.');
      setView('landing');
    }
  };

  const handleReset = () => {
    setView('landing');
    setResult(null);
    setError(null);
    setTimeout(() => {
      document.getElementById('upload-studio')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <>
      <Header
        onLaunchStudio={scrollToStudio}
        onNavigateWorks={scrollToWorks}
      />

      <main className="main-content">
        {/* Error Notification */}
        {error && (
          <div className="content-container" style={{ marginTop: 'var(--space-xl)' }}>
            <div className="disclaimer" style={{ background: '#fff1f2', borderColor: '#fecdd3' }}>
              <span className="disclaimer__icon">❌</span>
              <p className="disclaimer__text" style={{ color: '#9f1239' }}>
                <strong>Diagnostic Server Error:</strong> {error}
                <br />
                <span style={{ fontSize: '0.8rem', color: '#be123c' }}>
                  Please ensure the Python Flask backend is running on http://localhost:5000.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Loading View */}
        {view === 'loading' && (
          <div className="loading-section">
            <div className="spinner" />
            <p className="loading-section__text">Analysing Brain MRI Scan...</p>
            <p className="loading-section__subtext">
              Extracting Layer-4 deep convolutional features and computing gradient-weighted
              class activations (Grad-CAM).
            </p>
          </div>
        )}

        {/* Results View */}
        {view === 'results' && result && (
          <div className="content-container">
            <ResultsSection result={result} onReset={handleReset} />
          </div>
        )}

        {/* Landing Page Flow (Hero, Pipeline, Upload Studio) */}
        {view === 'landing' && (
          <>
            <HeroSection
              onLaunchStudio={scrollToStudio}
              onExploreExplainability={scrollToWorks}
            />

            <PipelineSection />

            <UploadSection
              onAnalyse={handleAnalyse}
              isLoading={false}
            />
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
