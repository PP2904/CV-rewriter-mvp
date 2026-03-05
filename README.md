# CV Tailor — AI-Powered Resume Optimizer

A web app that analyses your CV and generates role-specific improvement suggestions using AI. Paste a job posting URL and get tailored, actionable feedback in seconds.

🔗 **Live:** [api.paymentsmadeeasy.de](https://api.paymentsmadeeasy.de)

---

## What it does

- Upload your CV as a PDF
- Paste a job posting URL — the app reads the job description automatically
- Get specific, actionable suggestions to tailor your CV for that role
- If the job URL can't be scraped, pick a role from a dropdown as fallback
- For fun: get your CV rewritten by Homer Simpson or Walter White 🍩🧪

Your CV is never stored — it's processed in memory and deleted immediately after analysis.

---

## Built with

- **React** — frontend
- **Node.js + Express** — backend API
- **Anthropic Claude** — AI suggestions
- **AWS EC2 + Nginx** — hosting & deployment

---

## Local setup

```bash
# Backend
cd backend && npm install
echo "ANTHROPIC_API_KEY=your-key" > .env
node server.js

# Frontend
cd frontend && npm install && npm start
```

Get an API key at [console.anthropic.com](https://console.anthropic.com).

---

Built by [PP2904](https://github.com/PP2904)
