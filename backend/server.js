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
  // Replace double spaces (word boundaries) with a placeholder
  let result = text.replace(/  +/g, '§');
  // Collapse single-spaced individual characters within each word
  result = result.replace(/\b([A-Za-z])(?: ([A-Za-z])){2,}\b/g, (match) => match.replace(/ /g, ''));
  // Restore word boundaries
  result = result.replace(/§/g, ' ');
  return result;
}

function cleanAndAnonymise(text) {
  // Step 1 — collapse spaced-out individual characters FIRST
  let cleaned = collapseSpacedChars(text);

  // Step 2 — then normalise whitespace
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/(%[0-9A-F]{2})+/gi, '')
    .trim();

  const removed = { name: 0, email: 0, phone: 0, url: 0, address: 0 };

  // Step 2 — remove emails
  cleaned = cleaned.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, () => {
    removed.email++;
    return '[EMAIL]';
  });

  // Step 3 — remove phone numbers
  cleaned = cleaned.replace(/(\+?[\d\s\-().]{7,20}(?=\s|$))/g, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      removed.phone++;
      return '[PHONE]';
    }
    return match;
  });

  // Step 4 — remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, () => { removed.url++; return '[URL]'; });
  cleaned = cleaned.replace(/linkedin\.com\/in\/[^\s]+/gi, () => { removed.url++; return '[URL]'; });
  cleaned = cleaned.replace(/www\.[^\s]+/gi, () => { removed.url++; return '[URL]'; });

  // Step 5 — remove street addresses
  cleaned = cleaned.replace(/\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Court|Ct|Boulevard|Blvd)[^\n,]*/gi, () => {
    removed.address++;
    return '[ADDRESS]';
  });

  // Generate one placeholder name to use consistently throughout
  const placeholderName = faker.person.firstName();

  // Step 6a — handle all-caps names at start of CV (common PDF header format)
  // Matches "PETER PFROMMER" or "PETER J PFROMMER" at the very beginning
  const nonNameSections = ['SUMMARY', 'EXPERIENCE', 'EDUCATION', 'SKILLS', 'PROFILE', 'CAREER', 'ABOUT', 'CURRICULUM', 'RELEVANT', 'HOBBY'];
  const allCapsMatch = cleaned.match(/^([A-Z]{2,}(?:\s[A-Z]{2,}){1,3})\b/);
  if (allCapsMatch) {
    const candidate = allCapsMatch[1];
    const wordCount = candidate.split(' ').length;
    if (wordCount <= 4 && !nonNameSections.some(w => candidate.includes(w))) {
      const nameRegex = new RegExp(candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      cleaned = cleaned.replace(nameRegex, placeholderName.toUpperCase());
      removed.name++;
    }
  }

  // Step 6b — use compromise NLP to detect mixed-case person names throughout
  const doc = nlp(cleaned);
  const people = doc.people().out('array');
  const uniqueNames = [...new Set(people)].filter(n => n.trim().length > 1);

  if (uniqueNames.length > 0) {
    for (const name of uniqueNames) {
      const nameRegex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      cleaned = cleaned.replace(nameRegex, placeholderName);
    }
    removed.name += uniqueNames.length;
  }

  // Step 6c — fallback regex for Title Case names at start if nothing was caught
  if (removed.name === 0) {
    const firstChunk = cleaned.slice(0, 150);
    const nameMatch = firstChunk.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/);
    if (nameMatch && !nonNameSections.some(w => nameMatch[1].toUpperCase().includes(w))) {
      const nameRegex = new RegExp(nameMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      cleaned = cleaned.replace(nameRegex, placeholderName);
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

    // Clean and anonymise before sending to Claude
    const { cleaned: anonymisedText, removed: piiRemoved } = cleanAndAnonymise(resumeText);

    const jokeRoles = {
      'Homer Simpson': `You are a hilariously in-character CV rewriter. Rewrite CV suggestions as if Homer Simpson himself is reviewing it.
Homer works at the Springfield Nuclear Power Plant as a Safety Inspector (despite knowing nothing about safety).
His hobbies include eating donuts, watching TV, saying "D'oh!", drinking Duff beer, and napping on the job.

Rewrite each section of the CV with Homer's perspective. Examples:
- Project management experience → "Organized the annual donut run at Sector 7-G"
- Leadership skills → "Supervised Lenny and Carl (mostly told them to wake me up if Mr Burns comes)"
- Technical skills → "Expert at pressing the 'any' key. Also can sleep with eyes open during safety briefings"
- Achievements → "Employee of the Month (November 1994) - mostly because everyone else called in sick"

Be funny, reference Simpsons characters (Mr Burns, Lenny, Carl, Barney, Marge), quotes ("D'oh!", "Mmm... donuts", "Why you little--"), and Springfield locations (Moe's Tavern, Kwik-E-Mart, Krusty Burger).
CV to rewrite:`,

      'Walter White': `You are a darkly comedic CV rewriter channeling Walter White from Breaking Bad.
Walter is a chemistry genius turned methamphetamine manufacturer who "is the danger" and has "said his name".
He values precision, excellence, and reminds everyone he has a PhD from Caltech.

Rewrite CV suggestions with Walter's intensity and ego. Examples:
- Project management → "Oversaw a highly efficient, vertically integrated distribution operation in the Albuquerque metro area"
- Leadership → "Built and managed a high-performance team. Enforced strict quality standards. Zero tolerance for mediocrity."
- Technical skills → "Organic chemistry (99.1% purity). Methylamine procurement. Industrial scale synthesis."
- Achievements → "Grew revenue from $0 to $80M in under 2 years. Say my name."

Reference Breaking Bad characters (Jesse, Skyler, Saul, Gus), quotes ("I am the one who knocks", "Science, bitch!", "We're done when I say we're done"), and Albuquerque locations.
Be darkly funny, menacing, and brilliantly arrogant.
CV to rewrite:`
    };

    const isJokeRole = role && jokeRoles.hasOwnProperty(role);

    // Scrape job description if URL provided
    let jobDescription = null;
    let scrapeSuccess = false;
    if (jobUrl && !isJokeRole) {
      jobDescription = await scrapeJobDescription(jobUrl);
      scrapeSuccess = !!jobDescription;
    }

    let prompt;
    if (isJokeRole) {
      prompt = `${jokeRoles[role]}\n\n${anonymisedText}`;
    } else if (jobDescription) {
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