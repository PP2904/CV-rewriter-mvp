# CV Tailor — AI-Powered Resume Optimizer

An AI-powered web tool that parses your CV, scrapes a job posting, and returns specific actionable suggestions to tailor your resume for the role. A premium tier produces a fully rewritten, ATS-friendly CV as a downloadable Word document.

Personal data is anonymised before reaching the AI. Nothing is stored.

---

## Live deployments

| Version                   | URL                                                        | Branch             |
| ------------------------- | ---------------------------------------------------------- | ------------------ |
| Freemium (suggestions)    | [api.paymentsmadeeasy.de](https://api.paymentsmadeeasy.de) | `freemium-version` |
| Premium (rewrite + .docx) | [cv.paymentsmadeeasy.de](https://cv.paymentsmadeeasy.de)   | `premium`          |

---

## Features

### Freemium

- Upload your CV as a PDF (up to 5MB)
- Paste a job URL — the app scrapes the job description automatically
- Falls back to a manual text field if the URL can't be scraped
- Returns specific, actionable suggestions tailored to the role
- PII (name, email, phone, URLs, address) stripped before sending to AI

### Premium

- Everything in freemium, plus:
- Fully rewritten CV incorporating the suggestions
- Downloaded as a clean, ATS-friendly `.docx` file (Calibri, structured sections)
- Suggestions chained into the rewrite prompt for consistency
- Star rating + comment feedback collected via Resend

---

## Privacy

- CV is parsed in memory, temp file deleted immediately after
- PII anonymised using regex + NLP (compromise.js) before any AI call
- No database — nothing is stored between requests
- Anthropic does not train on API request data by default

---

## Tech stack

| Layer               | Technology                                                   |
| ------------------- | ------------------------------------------------------------ |
| Frontend            | React                                                        |
| Backend             | Node.js + Express                                            |
| AI                  | Anthropic Claude (Haiku for suggestions, Sonnet for rewrite) |
| PDF parsing         | pdf2json (primary), pdfjs-dist (fallback)                    |
| Job scraping        | axios + cheerio                                              |
| PII anonymisation   | compromise.js, @faker-js/faker                               |
| Document generation | docx                                                         |
| Feedback            | Resend                                                       |
| Hosting             | AWS EC2 (eu-central-1) + Nginx + PM2                         |
| SSL                 | Certbot / Let's Encrypt                                      |

---

## Branch strategy

```
main                  ← stable, production-ready baseline
├── freemium-version  ← deployed to api.paymentsmadeeasy.de
└── premium           ← deployed to cv.paymentsmadeeasy.de
    └── feature/xxx   ← short-lived feature branches, merged into premium
```

New work goes on a `feature/` branch. Once tested locally, open a PR into `premium` or `freemium-version` as appropriate.

---

## Local setup

### Prerequisites

- Node.js 18+
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
- A Resend API key from [resend.com](https://resend.com) (premium only, for feedback emails)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your keys in .env
node server.js
```

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend proxies API calls to `http://localhost:3000` via the `proxy` field in `package.json`.

### Environment variables

```
ANTHROPIC_API_KEY=        # required
ALLOWED_ORIGIN=           # e.g. http://localhost:3001 or your domain
PORT=                     # optional, defaults to 3000
RESEND_API_KEY=           # premium only
FEEDBACK_TO_EMAIL=        # premium only, email to receive feedback
DEBUG=                    # set to true to enable /debug-cv endpoint
```

---

## Deployment (EC2)

Both versions run on the same EC2 instance on different ports, served by Nginx under different subdomains.

| Instance | Directory               | Port | PM2 name     |
| -------- | ----------------------- | ---- | ------------ |
| Freemium | `~/CV-rewriter-mvp`     | 3000 | `cv-backend` |
| Premium  | `~/CV-rewriter-premium` | 3001 | `cv-premium` |

To deploy an update:

```bash
# On EC2
cd ~/CV-rewriter-premium   # or ~/CV-rewriter-mvp
git pull origin premium    # or freemium-version
cd backend && npm install
cd ../frontend && npm run build
chmod -R 755 frontend/build
pm2 restart cv-premium     # or cv-backend
sudo nginx -s reload
```

---

Built by [PP2904](https://github.com/PP2904)
