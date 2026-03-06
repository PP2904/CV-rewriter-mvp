// server.js (ESM, Node 18+)
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { createRequire } from 'module';
import rateLimit from 'express-rate-limit';
import axiosLib from 'axios';
import * as cheerio from 'cheerio';
import { faker } from '@faker-js/faker';
import nlp from 'compromise';

dotenv.config();

const require = createRequire(import.meta.url);
const PDFParser = require('pdf2json');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});
app.use('/adjust-cv', limiter);

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }
});

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: Anthropic API key missing in .env');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  const uploadsDir = 'uploads/';
  if (fs.existsSync(uploadsDir)) {
    fs.readdirSync(uploadsDir).forEach(f => fs.unlinkSync(`${uploadsDir}${f}`));
  }
  process.exit(1);
});

app.get('/', (req, res) => res.json({ status: 'CV Writer API is running' }));

async function scrapeJobDescription(url) {
  try {
    const response = await axiosLib.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    $('script, style, nav, header, footer, iframe, img').remove();
    const selectors = [
      '.job-description', '.jobDescription', '#job-description',
      '[class*="job-detail"]', '[class*="jobDetail"]',
      '[class*="description"]', 'article', 'main'
    ];
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text.length > 200) return text.slice(0, 4000);
    }
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 4000);
    if (bodyText.length > 200) return bodyText;
    return null;
  } catch (err) {
    console.warn('Failed to scrape job URL:', err.message);
    return null;
  }
}

function collapseSpacedChars(text) {
  let result = text.replace(/  +/g, '§');
  result = result.replace(/\b([A-Za-z])(?: ([A-Za-z])){2,}\b/g, (match) => match.replace(/ /g, ''));
  result = result.replace(/§/g, ' ');
  return result;
}

function cleanAndAnonymise(text) {
  let cleaned = collapseSpacedChars(text);

  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/(%[0-9A-F]{2})+/gi, '')
    .trim();

  const removed = { name: 0, email: 0, phone: 0, url: 0, address: 0 };

  // Remove all emails
  cleaned = cleaned.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, () => {
    removed.email++;
    return '[EMAIL]';
  });

  // Remove phone numbers
  cleaned = cleaned.replace(/(\+?[\d\s\-().]{7,20}(?=\s|$))/g, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      removed.phone++;
      return '[PHONE]';
    }
    return match;
  });

  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, () => { removed.url++; return '[URL]'; });
  cleaned = cleaned.replace(/linkedin\.com\/in\/[^\s]+/gi, () => { removed.url++; return '[URL]'; });
  cleaned = cleaned.replace(/www\.[^\s]+/gi, () => { removed.url++; return '[URL]'; });

  // Remove street addresses
  cleaned = cleaned.replace(/\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Court|Ct|Boulevard|Blvd)[^\n,]*/gi, () => {
    removed.address++;
    return '[ADDRESS]';
  });

  const placeholderName = faker.person.firstName();
  const nonNameSections = ['SUMMARY', 'EXPERIENCE', 'EDUCATION', 'SKILLS', 'PROFILE', 'CAREER', 'ABOUT', 'CURRICULUM', 'RELEVANT', 'HOBBY'];

  // Step 7a — all-caps name at start e.g. "PETER PFROMMER"
  const allCapsMatch = cleaned.match(/^([A-Z]{2,}(?:\s[A-Z]{2,}){1,3})\b/);
  if (allCapsMatch) {
    const candidate = allCapsMatch[1];
    const parts = candidate.split(' ');
    if (parts.length <= 4 && !nonNameSections.some(w => candidate.includes(w))) {
      const fullNameRegex = new RegExp(candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      cleaned = cleaned.replace(fullNameRegex, placeholderName.toUpperCase());
      for (const part of parts) {
        if (part.length > 1) {
          const partRegex = new RegExp(`\\b${part}\\b`, 'g');
          cleaned = cleaned.replace(partRegex, placeholderName.toUpperCase());
        }
      }
      removed.name++;
    }
  }

  // Step 7b — compromise NLP for mixed-case names
  const doc = nlp(cleaned);
  const people = doc.people().out('array');
  const uniqueNames = [...new Set(people)].filter(n => n.trim().length > 1);
  if (uniqueNames.length > 0) {
    for (const name of uniqueNames) {
      const parts = name.trim().split(' ');
      const fullNameRegex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      cleaned = cleaned.replace(fullNameRegex, placeholderName);
      for (const part of parts) {
        if (part.length > 1 && !nonNameSections.some(w => part.toUpperCase() === w)) {
          const partRegex = new RegExp(`\\b${part}\\b`, 'gi');
          cleaned = cleaned.replace(partRegex, placeholderName);
        }
      }
    }
    removed.name += uniqueNames.length;
  }

  // Step 7c — fallback title case name at start
  if (removed.name === 0) {
    const firstChunk = cleaned.slice(0, 150);
    const nameMatch = firstChunk.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/);
    if (nameMatch && !nonNameSections.some(w => nameMatch[1].toUpperCase().includes(w))) {
      const parts = nameMatch[1].split(' ');
      const fullNameRegex = new RegExp(nameMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      cleaned = cleaned.replace(fullNameRegex, placeholderName);
      for (const part of parts) {
        if (part.length > 1) {
          const partRegex = new RegExp(`\\b${part}\\b`, 'gi');
          cleaned = cleaned.replace(partRegex, placeholderName);
        }
      }
      removed.name++;
    }
  }

  return { cleaned, removed };
}

async function parsePDF(pdfBuffer) {
  try {
    return await new Promise((resolve, reject) => {
      const parser = new PDFParser();
      parser.on('pdfParser_dataReady', (data) => {
        const text = data.Pages
          .flatMap(p => p.Texts)
          .map(t => { try { return decodeURIComponent(t.R[0].T); } catch { return t.R[0].T; } })
          .join(' ');
        if (text.trim().length > 50) resolve(text);
        else reject(new Error('Insufficient text extracted'));
      });
      parser.on('pdfParser_dataError', (err) => reject(err));
      parser.parseBuffer(pdfBuffer);
    });
  } catch (primaryError) {
    console.warn('pdf2json failed, trying pdfjs-dist:', primaryError.message);
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  }
}

// Debug endpoint — only active when DEBUG=true in .env
if (process.env.DEBUG === 'true') {
  app.post('/debug-cv', upload.single('pdf'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });
    try {
      const pdfBuffer = fs.readFileSync(req.file.path);
      const resumeText = await parsePDF(pdfBuffer);
      const { cleaned, removed } = cleanAndAnonymise(resumeText);
      res.json({ raw: resumeText, anonymised: cleaned, piiRemoved: removed });
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }
  });
  console.log('Debug mode enabled — /debug-cv endpoint active');
}

app.post('/adjust-cv', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });

  if (req.file.mimetype !== 'application/pdf') {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Only PDF files allowed' });
  }

  try {
    const { jobUrl, role } = req.body;
    const pdfBuffer = fs.readFileSync(req.file.path);

    let resumeText;
    try {
      resumeText = await parsePDF(pdfBuffer);
    } catch (err) {
      console.error('Both PDF parsers failed:', err.message);
      return res.status(500).json({ error: 'Failed to parse PDF — please try a different file or re-save your PDF.' });
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ error: 'PDF contains no text' });
    }

    const { cleaned: anonymisedText, removed: piiRemoved } = cleanAndAnonymise(resumeText);

    // Scrape job description if URL provided
    let jobDescription = null;
    let scrapeSuccess = false;
    if (jobUrl) {
      jobDescription = await scrapeJobDescription(jobUrl);
      scrapeSuccess = !!jobDescription;
    }

    let prompt;
    if (jobDescription) {
      prompt = `You are an expert CV optimization assistant.

Analyze the following job description and CV, then provide specific, actionable suggestions to tailor the CV for this role.

Focus on:
- Keywords and skills from the job description that are missing or underemphasized in the CV
- Experiences in the CV that should be reframed to match the job requirements
- Achievements that are most relevant and should be highlighted
- Any gaps or areas to address

Job Description:
${jobDescription}

CV:
${anonymisedText}`;
    } else if (role) {
      prompt = `You are a CV optimization assistant.
Given the following CV text, suggest improvements to target the role "${role}".
Do not fully rewrite; instead, return a list of suggested changes, highlighting skills, achievements, and areas to emphasize.

CV:
${anonymisedText}`;
    } else {
      prompt = `You are an expert CV optimization assistant.
Analyze the following CV and provide specific, actionable suggestions to improve it.
Focus on clarity, impact, and highlighting key achievements.

CV:
${anonymisedText}`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const suggestions = message.content[0].text;
    res.json({ suggestions, scrapeSuccess, jobUrlProvided: !!jobUrl, piiRemoved });

  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));