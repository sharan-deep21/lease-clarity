import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  MessageSquareQuote,
  ClipboardList,
  GitCompare,
  CheckCircle2,
  FileSearch,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { LegalBanner } from './components/LegalDisclaimer';
import { FileUpload } from './components/FileUpload';
import { SummaryView } from './components/SummaryView';
import { RiskFlagsView } from './components/RiskFlagsView';
import { GroundedQAView } from './components/GroundedQAView';
import { LawyerChecklistView } from './components/LawyerChecklistView';
import { ComparisonView } from './components/ComparisonView';
import { AccessibleLoader } from './components/AccessibleLoader';
import { AccessibleAlert } from './components/AccessibleAlert';
import {
  uploadDocumentFile,
  submitDirectText,
  fetchFullAnalysis,
  fetchLawyerChecklist,
  checkHealth,
} from './api/client';
import './App.css';

export default function App() {
  const [docState, setDocState] = useState(null); // { filename, extracted_text, char_count, estimated_clauses }
  const [analysisState, setAnalysisState] = useState(null); // { summary, risk_analysis }
  const [checklistState, setChecklistState] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'risks' | 'qa' | 'lawyer' | 'compare'
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [isChecklistLoading, setIsChecklistLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Check system health on mount
  useEffect(() => {
    checkHealth().catch(() => {
      // Backend not yet reachable or starting up
    });
  }, []);

  const handleDocumentReady = async (docData) => {
    setDocState(docData);
    setLoadingMessage('Extracting clauses and conducting plain-language AI analysis...');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Run complete analysis
      const analysisData = await fetchFullAnalysis(docData.extracted_text, docData.filename);
      setAnalysisState(analysisData);
      setActiveTab('summary');
    } catch (err) {
      setErrorMessage(
        err.message || 'Analysis could not be completed. Please check your document and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setLoadingMessage(`Reading and sanitizing ${file.name} in memory...`);
    setErrorMessage(null);

    try {
      const docData = await uploadDocumentFile(file);
      await handleDocumentReady(docData);
    } catch (err) {
      setErrorMessage(err.message || 'Upload failed. Ensure the file is under 5MB and in PDF or TXT format.');
      setIsLoading(false);
    }
  };

  const handleTextSubmit = async (text, filename) => {
    setIsLoading(true);
    setLoadingMessage('Processing pasted agreement text...');
    setErrorMessage(null);

    try {
      const docData = await submitDirectText(text, filename);
      await handleDocumentReady(docData);
    } catch (err) {
      setErrorMessage(err.message || 'Text processing failed.');
      setIsLoading(false);
    }
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
  };

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <Navbar onResetSession={handleResetSession} hasDocument={!!docState} />

      {/* Mandatory Prominent Legal Assistance Banner */}
      <LegalBanner />

      <main className="main-content" id="main-content">
        {/* Error notification banner */}
        <AccessibleAlert message={errorMessage} onDismiss={() => setErrorMessage(null)} />

        {/* Global Loading Spinner */}
        {isLoading && <AccessibleLoader message={loadingMessage} />}

        {/* Initial State: File Upload & Input */}
        {!docState && !isLoading && (
          <FileUpload
            onFileUpload={handleFileUpload}
            onTextSubmit={handleTextSubmit}
            isProcessing={isLoading}
          />
        )}

        {/* Document Loaded State */}
        {docState && !isLoading && (
          <div className="document-workspace">
            {/* Document Metadata Bar */}
            <div className="doc-meta-strip" role="region" aria-label="Loaded document details">
              <div className="meta-left">
                <FileSearch size={20} className="meta-icon" aria-hidden="true" />
                <span className="doc-name">{docState.filename}</span>
                <span className="doc-badge">{docState.file_type.toUpperCase()}</span>
                <span className="doc-stat">{docState.estimated_clauses} clauses identified</span>
                <span className="doc-stat">{docState.char_count.toLocaleString()} characters</span>
              </div>
              <button
                type="button"
                className="btn btn-text btn-sm"
                onClick={handleResetSession}
                aria-label="Upload a different lease file"
              >
                Change Document
              </button>
            </div>

            {/* Analysis Navigation Tabs */}
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
                <FileText size={18} aria-hidden="true" />
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
                <AlertTriangle size={18} aria-hidden="true" />
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
                <MessageSquareQuote size={18} aria-hidden="true" />
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
                <ClipboardList size={18} aria-hidden="true" />
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
                <GitCompare size={18} aria-hidden="true" />
                <span>Compare Drafts</span>
              </button>
            </nav>

            {/* Tab View Panels */}
            <div className="tab-view-content">
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
                  <GroundedQAView documentText={docState.extracted_text} />
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
            </div>
          </div>
        )}
      </main>

      {/* Accessible Footer */}
      <footer className="site-footer">
        <div className="footer-container">
          <p>
            <strong>LeaseClarity</strong> — AI for Legal Assistance & Access. Built for the Legal Hackathon.
          </p>
          <p className="footer-sub">
            All documents are analyzed strictly in volatile memory. No text is logged or stored to disk.
          </p>
        </div>
      </footer>
    </div>
  );
}
