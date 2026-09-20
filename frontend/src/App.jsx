import React, { useState, useEffect, useRef, Suspense } from 'react';
import {
  FileText,
  AlertTriangle,
  MessageSquareQuote,
  ClipboardList,
  GitCompare,
  FileSearch,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { LegalBanner } from './components/LegalDisclaimer';
import { InteractiveLogo3D } from './components/InteractiveLogo3D';
import { LeaseInputBar, SAMPLE_LEASE_TEXT } from './components/LeaseInputBar';
import { ThinkingProgressPanel } from './components/ThinkingProgressPanel';
import { SummaryView } from './components/SummaryView';
import { RiskFlagsView } from './components/RiskFlagsView';
import { AccessibleAlert } from './components/AccessibleAlert';

// Dynamically split secondary views for bundle optimization
const GroundedQAView = React.lazy(() =>
  import('./components/GroundedQAView').then((m) => ({ default: m.GroundedQAView }))
);
const LawyerChecklistView = React.lazy(() =>
  import('./components/LawyerChecklistView').then((m) => ({ default: m.LawyerChecklistView }))
);
const ComparisonView = React.lazy(() =>
  import('./components/ComparisonView').then((m) => ({ default: m.ComparisonView }))
);
const CosmicBackground = React.lazy(() =>
  import('./components/CosmicBackground').then((m) => ({ default: m.CosmicBackground }))
);
import {
  uploadDocumentFile,
  submitDirectText,
  fetchFullAnalysis,
  fetchLawyerChecklist,
  checkHealth,
} from './api/client';
import './App.css';

export default function App() {
  const [docState, setDocState] = useState(null); // { filename, extracted_text, char_count, estimated_clauses, file_type }
  const [analysisState, setAnalysisState] = useState(null); // { summary, risk_analysis }
  const [checklistState, setChecklistState] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'risks' | 'qa' | 'lawyer' | 'compare'
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0); // 0 to 4
  const [isChecklistLoading, setIsChecklistLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [initialQuestion, setInitialQuestion] = useState(null);

  const resultsRef = useRef(null);
  const thinkingRef = useRef(null);

  // Lock theme permanently to dark mode (ChatGPT / iOS Dark Glass aesthetic)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    localStorage.setItem('leaseclarity-theme', 'dark');
  }, []);

  // Check system health on mount
  useEffect(() => {
    checkHealth().catch(() => {});
  }, []);

  const handleDocumentReady = async (docData) => {
    setDocState(docData);
    setLoadingStage(2); // Auditing 7 predatory traps

    // Progress simulation while LLM processes
    const timer1 = setTimeout(() => setLoadingStage(3), 1100);
    const timer2 = setTimeout(() => setLoadingStage(4), 2200);

    try {
      const analysisData = await fetchFullAnalysis(docData.extracted_text, docData.filename);
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoadingStage(4);
      setAnalysisState(analysisData);
      setActiveTab('summary');

      // Smooth scroll down to the results section below the file bar
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setErrorMessage(
        err.message || 'Analysis could not be completed. Please check your document and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setLoadingStage(0); // Sanitizing in memory
    setErrorMessage(null);
    setAnalysisState(null);

    // Scroll down slightly so the thinking panel is immediately front and center
    setTimeout(() => {
      thinkingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);

    try {
      const docData = await uploadDocumentFile(file);
      setLoadingStage(1); // Structural parsing & clause extraction
      await handleDocumentReady(docData);
    } catch (err) {
      setErrorMessage(err.message || 'Upload failed. Ensure the file is under 5MB and in PDF or TXT format.');
      setIsLoading(false);
    }
  };

  const handleTextSubmit = async (text, filename) => {
    setIsLoading(true);
    setLoadingStage(0); // Sanitizing in memory
    setErrorMessage(null);
    setAnalysisState(null);

    setTimeout(() => {
      thinkingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);

    try {
      const docData = await submitDirectText(text, filename);
      setLoadingStage(1); // Structural parsing & clause extraction
      await handleDocumentReady(docData);
    } catch (err) {
      setErrorMessage(err.message || 'Text processing failed.');
      setIsLoading(false);
    }
  };

  const handleDirectQuestion = (question) => {
    setActiveTab('qa');
    setInitialQuestion(question);
    // Smooth scroll directly to the Q&A panel
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleGenerateChecklist = async () => {
    if (!docState) return;
    setIsChecklistLoading(true);
    setErrorMessage(null);
    try {
      const checklist = await fetchLawyerChecklist(docState.extracted_text, docState.filename);
      setChecklistState(checklist);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate attorney checklist.');
    } finally {
      setIsChecklistLoading(false);
    }
  };

  const handleResetSession = () => {
    setDocState(null);
    setAnalysisState(null);
    setChecklistState(null);
    setActiveTab('summary');
    setErrorMessage(null);
    setInitialQuestion(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-shell" data-theme="dark">
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      {/* Kinesis Cosmic 3D Particle Background with Dynamic Thinking States */}
      <Suspense fallback={null}>
        <CosmicBackground
          isLoading={isLoading}
          loadingStage={loadingStage}
          hasResults={!!analysisState}
          theme="dark"
        />
      </Suspense>

      {/* Top Navigation */}
      <Navbar
        onResetSession={handleResetSession}
        hasDocument={!!docState}
        onTrySample={() => handleTextSubmit(SAMPLE_LEASE_TEXT, 'sample_springfield_lease.txt')}
      />

      {/* Mandatory Prominent Legal Assistance Disclaimer Banner */}
      <LegalBanner />

      <main className="main-content" id="main-content">
        {/* Error notification banner */}
        <AccessibleAlert message={errorMessage} onDismiss={() => setErrorMessage(null)} />

        {/* Hero Experience: 3D Interactive Logo + Claude-Style File Bar (ALWAYS MOUNTED) */}
        <div className={`hero-experience ${docState || isLoading ? 'has-results' : ''}`}>
          <InteractiveLogo3D isCompact={!!docState || isLoading} />
          <LeaseInputBar
            onFileUpload={handleFileUpload}
            onTextSubmit={handleTextSubmit}
            onQuestionSubmit={handleDirectQuestion}
            currentDoc={docState}
            isProcessing={isLoading}
            onResetDocument={handleResetSession}
          />
        </div>

          {/* Live Thinking & Process Panel (Appears smoothly below the file bar) */}
          {(isLoading || docState) && (
            <div ref={thinkingRef} className="thinking-panel-wrapper">
              <ThinkingProgressPanel
                isLoading={isLoading}
                currentStage={loadingStage}
                filename={docState?.filename || 'rental agreement'}
                clauseCount={docState?.estimated_clauses}
                flagCount={analysisState?.risk_analysis?.flag_count ?? null}
              />
            </div>
          )}

          {/* Document Loaded Workspace: Seamlessly displays directly beneath the file bar */}
          {docState && analysisState && (
            <div ref={resultsRef} className="document-workspace">
              {/* Document Metadata Strip */}
              <div className="doc-meta-strip" role="region" aria-label="Loaded document details">
                <div className="meta-left">
                  <FileSearch size={18} className="meta-icon" aria-hidden="true" />
                  <span className="doc-name">{docState.filename}</span>
                  <span className="doc-badge">{(docState.file_type || 'TXT').toUpperCase()}</span>
                  <span className="doc-stat">{docState.estimated_clauses} clauses identified</span>
                  <span className="doc-stat">{docState.char_count?.toLocaleString()} characters</span>
                </div>
                <button
                  type="button"
                  className="btn-link-action"
                  onClick={handleResetSession}
                  aria-label="Upload a different lease file"
                >
                  Change Document
                </button>
              </div>

              {/* Analysis Navigation Tabs (Claude Pill Style) */}
              <nav className="analysis-tabs" role="tablist" aria-label="Analysis sections">
                <button
                  type="button"
                  role="tab"
                  id="tab-sum"
                  aria-selected={activeTab === 'summary'}
                  aria-controls="panel-sum"
                  className={`analysis-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                  onClick={() => setActiveTab('summary')}
                >
                  <FileText size={16} aria-hidden="true" />
                  <span>Plain Summary</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="tab-risk"
                  aria-selected={activeTab === 'risks'}
                  aria-controls="panel-risk"
                  className={`analysis-tab-btn ${activeTab === 'risks' ? 'active' : ''}`}
                  onClick={() => setActiveTab('risks')}
                >
                  <AlertTriangle size={16} aria-hidden="true" />
                  <span>Red Flags ({analysisState?.risk_analysis?.flag_count ?? 0})</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="tab-qa"
                  aria-selected={activeTab === 'qa'}
                  aria-controls="panel-qa"
                  className={`analysis-tab-btn ${activeTab === 'qa' ? 'active' : ''}`}
                  onClick={() => setActiveTab('qa')}
                >
                  <MessageSquareQuote size={16} aria-hidden="true" />
                  <span>Grounded Q&A</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="tab-lawyer"
                  aria-selected={activeTab === 'lawyer'}
                  aria-controls="panel-lawyer"
                  className={`analysis-tab-btn ${activeTab === 'lawyer' ? 'active' : ''}`}
                  onClick={() => setActiveTab('lawyer')}
                >
                  <ClipboardList size={16} aria-hidden="true" />
                  <span>Lawyer Checklist</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="tab-compare"
                  aria-selected={activeTab === 'compare'}
                  aria-controls="panel-compare"
                  className={`analysis-tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
                  onClick={() => setActiveTab('compare')}
                >
                  <GitCompare size={16} aria-hidden="true" />
                  <span>Compare Drafts</span>
                </button>
              </nav>

              {/* Tab View Panels */}
              <div className="tab-view-content">
                <Suspense fallback={<div className="p-8 text-center text-muted">Loading analysis view...</div>}>
                  {activeTab === 'summary' && analysisState && (
                    <div id="panel-sum" role="tabpanel" aria-labelledby="tab-sum">
                      <SummaryView summary={analysisState.summary} />
                    </div>
                  )}

                  {activeTab === 'risks' && analysisState && (
                    <div id="panel-risk" role="tabpanel" aria-labelledby="tab-risk">
                      <RiskFlagsView riskData={analysisState.risk_analysis} />
                    </div>
                  )}

                  {activeTab === 'qa' && (
                    <div id="panel-qa" role="tabpanel" aria-labelledby="tab-qa">
                      <GroundedQAView
                        documentText={docState.extracted_text}
                        initialQuestion={initialQuestion}
                      />
                    </div>
                  )}

                  {activeTab === 'lawyer' && (
                    <div id="panel-lawyer" role="tabpanel" aria-labelledby="tab-lawyer">
                      <LawyerChecklistView
                        checklistData={checklistState}
                        onGenerateChecklist={handleGenerateChecklist}
                        isLoading={isChecklistLoading}
                      />
                    </div>
                  )}

                  {activeTab === 'compare' && (
                    <div id="panel-compare" role="tabpanel" aria-labelledby="tab-compare">
                      <ComparisonView
                        originalText={docState.extracted_text}
                        originalFilename={docState.filename}
                      />
                    </div>
                  )}
                </Suspense>
              </div>
            </div>
          )}
        </main>

      {/* Accessible Footer */}
      <footer className="site-footer">
        <div className="footer-container">
          <p>
            <strong>LeaseClarity</strong> — AI for Legal Assistance & Access.
          </p>
          <p className="footer-sub">
            All documents are analyzed strictly in volatile memory. No text is saved to disk.
          </p>
        </div>
      </footer>
    </div>
  );
}
