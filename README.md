# CV Tailor — AI-Powered Resume Optimizer

A full-stack web application that analyses your CV and generates role-specific improvement suggestions using the Anthropic Claude API. Paste a job posting URL and get tailored, actionable feedback in seconds.

🔗 **Live:** [api.paymentsmadeeasy.de](https://api.paymentsmadeeasy.de)

---

## Features

- 📄 **PDF Upload** — drag & drop or click to upload your CV (up to 5MB)
- 🔗 **Job URL Scraping** — paste any job posting URL and the app extracts the description automatically
- 🤖 **AI-Powered Suggestions** — Claude analyses your CV against the job and returns specific, actionable changes
- 🔁 **Fallback Role Selection** — if the job URL can't be scraped (e.g. LinkedIn), a role dropdown appears as fallback
- 🎭 **Easter Eggs** — get your CV rewritten by Homer Simpson or Walter White
- 🔒 **Privacy First** — CVs are never stored, processed in memory and deleted immediately after analysis
- ⚡ **Rate Limited** — protected against abuse with per-IP request limiting

---

## Tech Stack

**Frontend**
- React
- Axios
- Hosted as a static build served via Nginx

**Backend**
- Node.js + Express (ESM)
- Anthropic Claude API (`claude-sonnet-4-20250514`)
- `pdf2json` + `pdfjs-dist` (dual PDF parser with fallback)
- `cheerio` + `axios` for job URL scraping
- `express-rate-limit` for rate limiting
- `multer` for file uploads

**Infrastructure**
- AWS EC2 (Ubuntu 24.04, eu-central-1)
- Nginx reverse proxy with SSL (Let's Encrypt)
- PM2 process manager
- DNS via AWS Lightsail

---

## Project Structure

```
CV-rewriter-mvp/
├── backend/
│   ├── server.js        # Express API server
│   ├── uploads/         # Temp upload folder (gitignored)
│   └── .env             # API keys (gitignored)
├── frontend/
│   ├── src/
│   │   └── App.js       # Main React component
│   ├── public/
│   └── build/           # Production build (gitignored)
└── nginx/
    └── cv-backend.conf  # Nginx config
```

---

## Local Development

**Prerequisites:** Node.js 20+

**1. Clone the repo**
```bash
git clone https://github.com/PP2904/CV-rewriter-mvp.git
cd CV-rewriter-mvp
```

**2. Set up the backend**
```bash
cd backend
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
node server.js
```

**3. Set up the frontend**
```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3001`, backend on `http://localhost:3000`. The React proxy forwards API calls automatically.

---

## Environment Variables

Create a `.env` file in the `backend/` folder:

```
ANTHROPIC_API_KEY=your-key-here
ALLOWED_ORIGIN=https://your-domain.com   # optional, defaults to * in dev
```

---

## Deployment

The app is deployed on AWS EC2 with Nginx serving both the React frontend and proxying API requests to the Node.js backend.

```bash
# Pull latest changes on EC2
cd ~/CV-rewriter-mvp
git pull origin main

# Rebuild frontend
cd frontend && npm run build
chmod -R 755 ~/CV-rewriter-mvp/frontend/build

# Restart backend
pm2 restart cv-backend
```

---

## Security

- File type validation (PDF only)
- 5MB file size limit
- Rate limiting (10 requests per 15 minutes per IP)
- CORS restricted to production domain
- Temp files deleted immediately after processing
- SSL via Let's Encrypt

---

## Author

Built by [PP2904](https://github.com/PP2904) as a hobby project to explore full-stack development and AI integration.
