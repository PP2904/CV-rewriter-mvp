// server.js (ESM, Node 18+)
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createRequire } from 'module';

dotenv.config();

const require = createRequire(import.meta.url);
const PDFParser = require('pdf2json');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OpenAI API key missing in .env');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/adjust-cv', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });

  try {
    const { role, jobUrl } = req.body;
    const pdfBuffer = fs.readFileSync(req.file.path);

    // Parse the PDF using pdf2json
    let resumeText;
    try {
      resumeText = await new Promise((resolve, reject) => {
        const parser = new PDFParser();
        parser.on('pdfParser_dataReady', (data) => {
          const text = data.Pages
            .flatMap(p => p.Texts)
            .map(t => decodeURIComponent(t.R[0].T))
            .join(' ');
          resolve(text);
        });
        parser.on('pdfParser_dataError', (err) => reject(err));
        parser.parseBuffer(pdfBuffer);
      });
    } catch (pdfError) {
      console.error('PDF parse error:', pdfError.message);
      return res.status(500).json({ error: 'Failed to parse PDF' });
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ error: 'PDF contains no text' });
    }

    const prompt = `
You are a CV optimization assistant.
Given the following CV text, suggest improvements to target the role "${role}".
If the user provided a job link (${jobUrl || 'none'}), incorporate role-specific keywords and requirements from that link.
Do not fully rewrite; instead, return a list of suggested changes, highlighting skills, achievements, and areas to emphasize.

CV:
${resumeText}
`;

    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [{ role: 'user', content: prompt }],
      });
    } catch (gptError) {
      console.warn('GPT-4.1 failed, falling back to gpt-3.5-turbo:', gptError.message);
      response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });
    }

    const suggestions = response.choices[0].message.content;
    res.json({ suggestions });

  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));