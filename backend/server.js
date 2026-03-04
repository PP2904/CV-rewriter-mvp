// server.js

/* When you create a simple Node.js backend without any special config, Node defaults to CommonJS:

server.js has .js extension

No "type": "module" in package.json */
// server.js (ESM, Node 18+)
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { createRequire } from 'module';

dotenv.config();

const require = createRequire(import.meta.url);
const PDFParser = require('pdf2json');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: Anthropic API key missing in .env');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.get('/', (req, res) => res.json({ status: 'CV Writer API is running' }));

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

    const isJokeRole = jokeRoles.hasOwnProperty(role);

    const prompt = isJokeRole
      ? `${jokeRoles[role]}\n\n${resumeText}`
      : `You are a CV optimization assistant.
Given the following CV text, suggest improvements to target the role "${role}".
If the user provided a job link (${jobUrl || 'none'}), incorporate role-specific keywords and requirements from that link.
Do not fully rewrite; instead, return a list of suggested changes, highlighting skills, achievements, and areas to emphasize.

CV:
${resumeText}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const suggestions = message.content[0].text;
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