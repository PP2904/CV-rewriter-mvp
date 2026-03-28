# CV Tailor — AI-Powered Resume Optimizer

A web tool that analyses your CV against a job description and returns
specific, actionable suggestions to help you tailor it for the role.

Personal data is anonymised before reaching the AI. Nothing is stored.

---

## What it does

- Upload your CV as a PDF
- Paste a job posting URL or describe the role
- Get tailored, actionable suggestions in seconds
- Download a fully rewritten CV as a Word document (premium)

---

## Privacy

- PII (name, email, phone, address) stripped before any AI call
- No database — nothing stored between requests
- Temp files deleted immediately after processing

---

## Built with

- React, Node.js, Express
- Anthropic Claude API
- AWS EC2 + Nginx

---

## Local setup

```bash
cd backend && npm install
cp .env.example .env   # add your Anthropic API key
node server.js

cd frontend && npm install && npm start
```

---

Built by [PP2904](https://github.com/PP2904)
