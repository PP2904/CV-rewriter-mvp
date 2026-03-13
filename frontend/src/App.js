import { useState, useRef } from 'react';
import axios from 'axios';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0e0e0e;
    color: #f0ede6;
    font-family: 'DM Mono', monospace;
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 60px 24px 80px;
    background:
      radial-gradient(ellipse at 20% 0%, rgba(210,180,140,0.07) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 100%, rgba(160,130,100,0.05) 0%, transparent 60%),
      #0e0e0e;
  }

  .header {
    text-align: center;
    margin-bottom: 56px;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #a08060;
    margin-bottom: 16px;
  }

  h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(36px, 6vw, 64px);
    font-weight: 700;
    line-height: 1.1;
    color: #f0ede6;
    margin-bottom: 16px;
  }

  h1 span { color: #c8a870; font-style: italic; }

  .subtitle {
    font-size: 13px;
    color: #7a7060;
    letter-spacing: 0.05em;
    line-height: 1.6;
  }

  .disclaimer {
    margin-top: 14px;
    font-size: 11px;
    color: #c8a870;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .card {
    width: 100%;
    max-width: 640px;
    background: #161616;
    border: 1px solid #2a2520;
    border-radius: 2px;
    padding: 40px;
  }

  .field { margin-bottom: 28px; }

  label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #a08060;
    margin-bottom: 10px;
  }

  .drop-zone {
    border: 1px dashed #3a3028;
    border-radius: 2px;
    padding: 32px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    background: #111;
    position: relative;
  }

  .drop-zone:hover, .drop-zone.active {
    border-color: #c8a870;
    background: #1a1610;
  }

  .drop-icon { font-size: 28px; margin-bottom: 10px; opacity: 0.5; }

  .drop-text { font-size: 12px; color: #6a6050; line-height: 1.6; }
  .drop-text strong { color: #c8a870; font-weight: 500; }

  .file-name { font-size: 12px; color: #c8a870; margin-top: 8px; font-style: italic; }

  input[type="url"] {
    width: 100%;
    background: #111;
    border: 1px solid #2a2520;
    border-radius: 2px;
    color: #f0ede6;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    padding: 12px 16px;
    outline: none;
    transition: border-color 0.2s;
  }

  input[type="url"]:focus { border-color: #c8a870; }
  input[type="url"]:disabled { opacity: 0.4; cursor: not-allowed; }

  .url-hint {
    font-size: 11px;
    color: #6a5a40;
    margin-top: 8px;
    line-height: 1.5;
  }

  .scrape-warning {
    background: #1a1508;
    border: 1px solid #4a3a10;
    border-radius: 2px;
    padding: 12px 16px;
    font-size: 12px;
    color: #c8a030;
    margin-top: 12px;
    line-height: 1.6;
  }

  .fallback-label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #a08060;
    margin-top: 16px;
    margin-bottom: 10px;
  }

  textarea {
    width: 100%;
    background: #111;
    border: 1px solid #2a2520;
    border-radius: 2px;
    color: #f0ede6;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    padding: 12px 16px;
    outline: none;
    transition: border-color 0.2s;
    resize: vertical;
    min-height: 120px;
    line-height: 1.6;
  }

  textarea:focus { border-color: #c8a870; }
  textarea:disabled { opacity: 0.4; cursor: not-allowed; }
  textarea::placeholder { color: #4a4038; }

  .char-count {
    font-size: 10px;
    color: #4a4038;
    text-align: right;
    margin-top: 6px;
  }
  .char-count.warning { color: #c8a030; }
  .char-count.over { color: #d08080; }

  .btn {
    width: 100%;
    background: #c8a870;
    color: #0e0e0e;
    border: none;
    border-radius: 2px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    padding: 16px;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    margin-top: 24px;
  }

  .btn:hover:not(:disabled) { background: #d4b880; }
  .btn:active:not(:disabled) { transform: translateY(1px); }
  .btn:disabled { background: #3a3028; color: #6a6050; cursor: not-allowed; }

  .loading-steps {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .loading-step {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: #4a4038;
    transition: color 0.3s;
  }

  .loading-step.active { color: #c8a870; }
  .loading-step.done { color: #6a8050; }

  .step-icon { width: 16px; text-align: center; }

  .spinner {
    width: 12px;
    height: 12px;
    border: 1.5px solid #4a4038;
    border-top-color: #c8a870;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
    display: inline-block;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .loading-bar {
    width: 100%;
    height: 2px;
    background: #2a2520;
    margin-top: 16px;
    overflow: hidden;
    border-radius: 1px;
  }

  .loading-bar-inner {
    height: 100%;
    background: #c8a870;
    animation: loading 1.8s ease-in-out infinite;
    width: 40%;
  }

  @keyframes loading {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
  }

  .error {
    background: #1a0e0e;
    border: 1px solid #4a2020;
    border-radius: 2px;
    padding: 14px 16px;
    font-size: 12px;
    color: #d08080;
    margin-top: 20px;
    line-height: 1.6;
  }

  .privacy-report {
    width: 100%;
    max-width: 640px;
    margin-top: 16px;
    background: #0e140e;
    border: 1px solid #1a2a1a;
    border-radius: 2px;
    padding: 14px 20px;
    font-size: 11px;
    color: #6a8050;
    display: flex;
    align-items: center;
    gap: 8px;
    line-height: 1.6;
  }

  .results {
    width: 100%;
    max-width: 640px;
    margin-top: 16px;
  }

  .results-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .results-label {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #a08060;
  }

  .results-line { flex: 1; height: 1px; background: #2a2520; }

  .results-box {
    background: #161616;
    border: 1px solid #2a2520;
    border-radius: 2px;
    padding: 32px;
  }

  .results-box pre {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: #c8bca8;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.8;
  }

  .fade-in {
    animation: fadeIn 0.4s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const MAX_JOB_DESC_LENGTH = 3000;

const STEPS = [
  { id: 'parse', label: 'Parsing your CV...' },
  { id: 'anonymise', label: 'Anonymising your data...' },
  { id: 'analyse', label: 'Analysing against job description...' },
];

function buildPrivacyReport(piiRemoved) {
  if (!piiRemoved) return null;
  const items = [];
  if (piiRemoved.name > 0) items.push(`${piiRemoved.name} name`);
  if (piiRemoved.email > 0) items.push(`${piiRemoved.email} email`);
  if (piiRemoved.phone > 0) items.push(`${piiRemoved.phone} phone number`);
  if (piiRemoved.url > 0) items.push(`${piiRemoved.url} URL`);
  if (piiRemoved.address > 0) items.push(`${piiRemoved.address} address`);
  if (items.length === 0) return 'No PII detected in your CV.';
  return `Removed before sending to AI: ${items.join(', ')}.`;
}

export default function App() {
  const [file, setFile] = useState(null);
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const [scrapeFailed, setScrapeFailed] = useState(false);
  const [suggestions, setSuggestions] = useState('');
  const [piiRemoved, setPiiRemoved] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleJobUrl = (e) => {
    setJobUrl(e.target.value);
    if (e.target.value) {
      setScrapeFailed(false);
      setShowFallback(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    if (jobDescription.length > MAX_JOB_DESC_LENGTH) return;

    setLoading(true);
    setError('');
    setSuggestions('');
    setPiiRemoved(null);
    setScrapeFailed(false);

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('jobUrl', jobUrl);
      if (showFallback && jobDescription) {
        formData.append('jobDescription', jobDescription);
      }

      setCurrentStep('parse');
      await new Promise(r => setTimeout(r, 600));

      setCurrentStep('anonymise');
      await new Promise(r => setTimeout(r, 700));

      setCurrentStep('analyse');

      const response = await axios.post('/adjust-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { suggestions, scrapeSuccess, jobUrlProvided, piiRemoved } = response.data;

      if (jobUrlProvided && !scrapeSuccess && !showFallback) {
        setScrapeFailed(true);
        setShowFallback(true);
        setLoading(false);
        setCurrentStep(null);
        return;
      }

      setSuggestions(suggestions);
      setPiiRemoved(piiRemoved);

    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setCurrentStep(null);
    }
  };

  const privacyReport = buildPrivacyReport(piiRemoved);
  const descLength = jobDescription.length;
  const descOver = descLength > MAX_JOB_DESC_LENGTH;
  const descWarning = descLength > MAX_JOB_DESC_LENGTH * 0.85;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="top-banner">
          🚧 PDF &amp; Word download coming soon — suggestions are currently text only
        </div>
        <div className="header">
          <h1>Tailor your CV<br />for any <span>role</span></h1>
          <p className="subtitle">Upload your resume · Paste a job URL · Get precise suggestions</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>

            <div className="field">
              <label>Your CV</label>
              <div
                className={`drop-zone ${dragging ? 'active' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f?.type === 'application/pdf') setFile(f);
                }}
                onClick={() => inputRef.current.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={e => setFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />
                <div className="drop-icon">📄</div>
                <div className="drop-text">
                  <strong>Click to upload</strong> or drag & drop<br />PDF files only <strong>(up to 5MB)</strong>
                </div>
                {file && <div className="file-name">✓ {file.name}</div>}
              </div>
            </div>

            <div className="field">
              <label>Job URL <span style={{ color: '#4a4038' }}>(optional)</span></label>
              <input
                type="url"
                placeholder="https://linkedin.com/jobs/..."
                value={jobUrl}
                onChange={handleJobUrl}
                disabled={loading}
              />
              <div className="url-hint">
                We'll attempt to fetch the job description automatically.
              </div>

              {scrapeFailed && (
                <div className="scrape-warning fade-in">
                  ⚠ Couldn't fetch that job page — the site may block automated access (common on LinkedIn &amp; Indeed).
                </div>
              )}
            </div>

            {/* Fallback textarea — only shown after scrape failure or if no URL entered */}
            {(showFallback || (!jobUrl && !loading)) && ( 
              <div className="field fade-in">
                <span className="fallback-label">
                  {scrapeFailed ? 'URL could not be fetched — paste the job description instead' : 'Role or job description'}
                </span>
                <textarea
                  placeholder={"e.g. Senior Product Manager — Payments\n\nor paste the full job description here..."}
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  disabled={loading}
                  rows={5}
                />
                <div className={`char-count ${descOver ? 'over' : descWarning ? 'warning' : ''}`}>
                  {descLength} / {MAX_JOB_DESC_LENGTH}
                  {descOver && ' — too long, please trim'}
                </div>
              </div>
            )}

            <button
              className="btn"
              type="submit"
              disabled={loading || !file || descOver}
            >
              {loading ? 'Processing...' : 'Generate Suggestions →'}
            </button>

            {loading && (
              <>
                <div className="loading-bar">
                  <div className="loading-bar-inner" />
                </div>
                <div className="loading-steps">
                  {STEPS.map((step) => {
                    const stepIds = STEPS.map(s => s.id);
                    const currentIdx = stepIds.indexOf(currentStep);
                    const stepIdx = stepIds.indexOf(step.id);
                    const isDone = stepIdx < currentIdx;
                    const isActive = step.id === currentStep;
                    return (
                      <div key={step.id} className={`loading-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                        <span className="step-icon">
                          {isDone ? '✓' : isActive ? <span className="spinner" /> : '○'}
                        </span>
                        {step.label}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {error && <div className="error">⚠ {error}</div>}
          </form>
        </div>

        {privacyReport && suggestions && (
          <div className="privacy-report fade-in">
            🔒 {privacyReport}
          </div>
        )}

        {suggestions && (
          <div className="results fade-in">
            <div className="results-header">
              <span className="results-label">Suggestions</span>
              <div className="results-line" />
            </div>
            <div className="results-box">
              <pre>{suggestions}</pre>
            </div>
          </div>
        )}
        <p className="disclaimer">
          <span>🔒</span>
          Your CV is anonymised before reaching AI — personal data never leaves your control.
        </p>
      </div>
    </>
  );
}