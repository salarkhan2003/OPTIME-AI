import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import mammoth from 'mammoth';
import * as pdf from 'pdf-parse';
import multer from 'multer';
import Groq from 'groq-sdk';

import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/usage', async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId || !supabase) return res.json({ count: 0, plan: 'free' });

    const { data, error } = await supabase
      .from('profiles')
      .select('usage_count, plan')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Create profile if not exists
      if (error?.code === 'PGRST116') {
        await supabase.from('profiles').insert({ id: userId, usage_count: 0, plan: 'free' });
        return res.json({ count: 0, plan: 'free' });
      }
      return res.json({ count: 0, plan: 'free' });
    }

    res.json({ count: data.usage_count, plan: data.plan });
  });

  app.post('/api/track-usage', async (req, res) => {
    const { userId } = req.body;
    if (!userId || !supabase) return res.status(400).json({ success: false });

    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('usage_count, plan')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return res.status(500).json({ success: false });
    }

    const currentCount = profile?.usage_count || 0;
    const plan = profile?.plan || 'free';

    let canAnalyze = false;
    if (plan === 'pro') {
      canAnalyze = true;
    } else if (plan === 'one-time') {
      if (currentCount < 30) canAnalyze = true;
    } else {
      if (currentCount < 3) canAnalyze = true;
    }

    if (canAnalyze) {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ id: userId, usage_count: currentCount + 1 }, { onConflict: 'id' });

      if (updateError) return res.status(500).json({ success: false });
      return res.json({ success: true, count: currentCount + 1, plan });
    }

    res.status(403).json({ 
      success: false, 
      message: 'Limit reached for your current plan. Please upgrade to continue.',
      count: currentCount,
      plan
    });
  });

  app.post('/api/create-razorpay-order', async (req, res) => {
    if (!razorpay) {
      return res.status(500).json({ error: 'Razorpay is not configured' });
    }

    const { plan } = req.body;
    let amount = 0;
    if (plan === 'one-time') amount = 299 * 100;
    if (plan === 'pro') amount = 199 * 100;

    try {
      const options = {
        amount,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/verify-razorpay-payment', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
      if (supabase) {
        await supabase
          .from('profiles')
          .upsert({ id: userId, plan: plan }, { onConflict: 'id' });
      }
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  });

  app.post('/api/parse-resume', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      let text = '';
      if (req.file.mimetype === 'application/pdf') {
        const parsePdf = (pdf as any).default || pdf;
        const data = await parsePdf(req.file.buffer);
        text = data.text;
      } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = result.value;
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }
      res.json({ text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/save-analysis', async (req, res) => {
    const { userId, analysis, jobTitle } = req.body;
    if (!userId || !supabase) return res.status(400).json({ success: false });

    const { error } = await supabase
      .from('analyses')
      .insert({
        user_id: userId,
        job_title: jobTitle,
        result: analysis,
        created_at: new Date().toISOString()
      });

    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });

  app.get('/api/history', async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId || !supabase) return res.json([]);

    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post('/api/analyze', async (req, res) => {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'Missing resume or job description' });
    }

    try {
      const prompt = `
        You are an expert ATS (Applicant Tracking System) and Career Coach.
        Analyze the following resume against the job description.
        
        Resume:
        ${resumeText}
        
        Job Description:
        ${jobDescription}
        
        Return a JSON object with the following structure:
        {
          "atsScore": number (0-100),
          "formattingScore": number (0-100),
          "readabilityScore": number (0-100),
          "keywordMatch": number (0-100),
          "missingWeak": ["string"],
          "rewrittenBullets": [{"original": "string", "optimized": "string"}],
          "linkedinSummary": "string",
          "topSkills": ["string"],
          "coverLetter": "string",
          "interviewQA": [{"question": "string", "answer": "string"}]
        }
        
        Ensure the JSON is valid and the content is professional and impactful.
      `;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional resume optimizer. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });

      const content = chatCompletion.choices[0]?.message?.content;
      if (!content) throw new Error("Failed to get analysis from AI");

      res.json(JSON.parse(content));
    } catch (error: any) {
      console.error('AI Analysis Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
