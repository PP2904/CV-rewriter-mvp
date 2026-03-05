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
    font-family: 'DM Mono', monospace;
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

  h1 span {
    color: #c8a870;
    font-style: italic;
  }

  .subtitle {
    font-size: 13px;
    color: #7a7060;
    letter-spacing: 0.05em;
    line-height: 1.6;
  }

  .disclaimer {
    margin-top: 14px;
    font-size: 11px;
    color: #4a4038;
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

  .field {
    margin-bottom: 28px;
  }

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

  .drop-icon {
    font-size: 28px;
    margin-bottom: 10px;
    opacity: 0.5;
  }

  .drop-text {
    font-size: 12px;
    color: #6a6050;
    line-height: 1.6;
  }

  .drop-text strong {
    color: #c8a870;
    font-weight: 500;
  }

  .file-name {
    font-size: 12px;
    color: #c8a870;
    margin-top: 8px;
    font-style: italic;
  }

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

  input[type="url"]:focus {
    border-color: #c8a870;
  }

  input[type="url"]:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .url-hint {
    font-size: 11px;
    color: #4a4038;
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

  select {
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
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a08060' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    padding-right: 40px;
    margin-top: 10px;
  }

  select:focus { border-color: #c8a870; }
  select option { background: #161616; }

  .fallback-label {
    font-size: 11px;
    color: #c8a030;
    margin-top: 12px;
    display: block;
  }

  .joke-section {
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid #2a2520;
  }

  .joke-label {
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #4a4038;
    margin-bottom: 12px;
  }

  .joke-buttons {
    display: flex;
    gap: 10px;
  }

  .joke-btn {
    flex: 1;
    background: #111;
    border: 1px solid #2a2520;
    border-radius: 2px;
    color: #6a6050;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    padding: 10px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    text-align: center;
  }

  .joke-btn:hover { border-color: #c8a870; color: #c8a870; }
  .joke-btn.selected { border-color: #c8a870; color: #c8a870; background: #1a1610; }

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

  .loading-status {
    font-size: 11px;
    color: #6a6050;
    margin-top: 10px;
    text-align: center;
    letter-spacing: 0.05em;
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

  .scrape-notice {
    font-size: 11px;
    color: #6a8050;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .results {
    width: 100%;
    max-width: 640px;
    margin-top: 32px;
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

  .results-line {
    flex: 1;
    height: 1px;
    background: #2a2520;
  }

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

  .divider {
    width: 1px;
    height: 40px;
    background: #2a2520;
    margin: 0 auto 40px;
  }

  .fade-in {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ROLES = [
  'Product Manager',
  'Engineering Manager',
  'Business Analyst',
  'Implementation Manager',
  'Solution Architect',
];

export default function App() {
  const [file, setFile] = useState(null);
  const [jobUrl, setJobUrl] = useState('');
  const [jokeRole, setJokeRole] = useState(null);
  const [fallbackRole, setFallbackRole] = useState(ROLES[0]);
  const [showFallback, setShowFallback] = useState(false);
  const [scrapeFailed, setScrapeFailed] = useState(false);
  const [scrapeSucceeded, setScrapeSucceeded] = useState(false);
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleJokeRole = (role) => {
    setJokeRole(jokeRole === role ? null : role);
    if (jokeRole !== role) {
      setJobUrl('');
      setShowFallback(false);
      setScrapeFailed(false);
    }
  };

  const handleJobUrl = (e) => {
    setJobUrl(e.target.value);
    if (e.target.value) {
      setJokeRole(null);
      setScrapeFailed(false);
      setShowFallback(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    setSuggestions('');
    setScrapeFailed(false);
    setScrapeSucceeded(false);

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('jobUrl', jobUrl);

      if (jokeRole) {
        formData.append('role', jokeRole);
        setLoadingStatus('Channeling your character...');
      } else if (showFallback) {
        formData.append('role', fallbackRole);
        setLoadingStatus('Analysing your CV...');
      } else if (jobUrl) {
        setLoadingStatus('Fetching job description...');
        // Small delay so user sees the fetching message
        await new Promise(r => setTimeout(r, 500));
        setLoadingStatus('Analysing your CV against the job...');
      } else {
        setLoadingStatus('Analysing your CV...');
      }

      const response = await axios.post('/adjust-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { suggestions, scrapeSuccess, jobUrlProvided } = response.data;

      if (jobUrlProvided && !scrapeSuccess && !jokeRole && !showFallback) {
        setScrapeFailed(true);
        setShowFallback(true);
        setLoading(false);
        setLoadingStatus('');
        return;
      }

      if (jobUrlProvided && scrapeSuccess) setScrapeSucceeded(true);
      setSuggestions(suggestions);

    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="header">
          <p className="eyebrow">AI-Powered</p>
          <h1>Tailor your CV<br />for any <span>role</span></h1>
          <p className="subtitle">Upload your resume · Paste a job URL · Get precise suggestions</p>
          <p className="disclaimer">
            <span style={{ color: '#6a5a40' }}>🔒</span>
            Your CV is never stored — processed in memory and deleted immediately after analysis.
          </p>
        </div>

        <div className="divider" />

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
                disabled={!!jokeRole}
              />
              <p className="url-hint">
                Paste a link to the job posting — we'll extract the description and tailor your CV to it.
              </p>

              {scrapeFailed && (
                <div className="scrape-warning fade-in">
                  ⚠ Couldn't fetch that job page — the site may block automated access (common on LinkedIn & Indeed).
                  <span className="fallback-label">Select a role below and we'll tailor your CV to it instead:</span>
                  <select value={fallbackRole} onChange={e => setFallbackRole(e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="joke-section">
              <p className="joke-label">🎭 Just for fun</p>
              <div className="joke-buttons">
                <button
                  type="button"
                  className={`joke-btn ${jokeRole === 'Homer Simpson' ? 'selected' : ''}`}
                  onClick={() => handleJokeRole('Homer Simpson')}
                >
                  🍩 Homer Simpson
                </button>
                <button
                  type="button"
                  className={`joke-btn ${jokeRole === 'Walter White' ? 'selected' : ''}`}
                  onClick={() => handleJokeRole('Walter White')}
                >
                  🧪 Walter White
                </button>
              </div>
            </div>

            <button className="btn" type="submit" disabled={loading || !file}>
              {loading ? loadingStatus || 'Analysing your CV...' : 'Generate Suggestions →'}
            </button>

            {loading && (
              <div className="loading-bar">
                <div className="loading-bar-inner" />
              </div>
            )}

            {error && <div className="error">⚠ {error}</div>}
          </form>
        </div>

        {scrapeSucceeded && !loading && suggestions && (
          <p className="scrape-notice fade-in">✓ Job description fetched and used in analysis</p>
        )}

        {suggestions && (
          <div className="results fade-in">
            <div className="results-header">
              <span className="results-label">AI Suggestions</span>
              <div className="results-line" />
            </div>
            <div className="results-box">
              <pre>{suggestions}</pre>
            </div>
          </div>
        )}
      </div>
    </>
  );
}