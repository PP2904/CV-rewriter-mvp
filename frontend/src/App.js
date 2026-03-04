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

  .drop-zone input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
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

  select, input[type="url"] {
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
  }

  select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a08060' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    padding-right: 40px;
  }

  select:focus, input[type="url"]:focus {
    border-color: #c8a870;
  }

  select option {
    background: #161616;
  }

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
    margin-top: 8px;
  }

  .btn:hover:not(:disabled) {
    background: #d4b880;
  }

  .btn:active:not(:disabled) {
    transform: translateY(1px);
  }

  .btn:disabled {
    background: #3a3028;
    color: #6a6050;
    cursor: not-allowed;
  }

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
`;

export default function App() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('Product Manager');
  const [jobUrl, setJobUrl] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    setSuggestions('');
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('role', role);
      formData.append('jobUrl', jobUrl);
      const response = await axios.post('https://api.paymentsmadeeasy.de/adjust-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuggestions(response.data.suggestions);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="header">
          <p className="eyebrow">AI-Powered</p>
          <h1>Tailor your CV<br />for any <span>role</span></h1>
          <p className="subtitle">Upload your resume · Choose a target role · Get precise suggestions</p>
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
                  <strong>Click to upload</strong> or drag & drop<br />PDF files only
                </div>
                {file && <div className="file-name">✓ {file.name}</div>}
              </div>
            </div>

            <div className="field">
              <label>Target Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="Product Manager">Product Manager</option>
                <option value="Engineering Manager">Engineering Manager</option>
                <option value="Business Analyst">Business Analyst</option>
                <option value="Implementation Manager">Implementation Manager</option>
                <option value="Solution Architect">Solution Architect</option>
                <option disabled>──────────</option>
                <option value="Homer Simpson">🍩 Homer Simpson</option>
                <option value="Walter White">🧪 Walter White</option>
              </select>
            </div>

            <div className="field">
              <label>Job URL <span style={{color:'#4a4038'}}>(optional)</span></label>
              <input
                type="url"
                placeholder="https://linkedin.com/jobs/..."
                value={jobUrl}
                onChange={e => setJobUrl(e.target.value)}
              />
            </div>

            <button className="btn" type="submit" disabled={loading || !file}>
              {loading ? 'Analysing your CV...' : 'Generate Suggestions →'}
            </button>

            {loading && (
              <div className="loading-bar">
                <div className="loading-bar-inner" />
              </div>
            )}

            {error && <div className="error">⚠ {error}</div>}
          </form>
        </div>

        {suggestions && (
          <div className="results">
            <div className="results-header">
              <span className="results-label">AI Suggestions</span>
              <div className="results-line" />
            </div>
            <div className="results-box">
              <pre>{suggestions}</pre>
            </div>
          </div>
        )}
        <p style={{marginTop: '14px', fontSize: '11px', color: '#c8bca8', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}><span style={{color: '#6a5a40'}}>🔒</span> Your CV is never stored — processed in memory and deleted immediately after analysis.</p>
      </div>
    </>
  );
}