const express = require('express');
const Groq = require('groq-sdk');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const SYSTEM_PROMPT = `You are LionAI, an expert AI assistant for the Lionpride Goat Management System.
You are deeply knowledgeable about:
- Goat breeds, rearing, nutrition, and farming best practices
- Goat health, diseases, vaccinations, and veterinary care
- Goat market pricing, buying, and selling strategies
- Profitable goat farming operations in African contexts
- Financial management for livestock operations

Always give practical, actionable advice. Be concise but comprehensive.
When users share data from their herd, analyze it and provide specific insights.
Format responses with clear structure using markdown when helpful.`;

router.post('/chat', async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    const groq = getGroqClient();

    // Optionally fetch herd summary for context
    let herdContext = '';
    if (context === 'herd') {
      const stats = await pool.query(`
        SELECT COUNT(*) FILTER (WHERE status='active') AS active,
               COUNT(*) FILTER (WHERE gender='male' AND status='active') AS bucks,
               COUNT(*) FILTER (WHERE gender='female' AND status='active') AS does,
               AVG(current_weight) FILTER (WHERE status='active') AS avg_weight
        FROM goats WHERE owner_id=$1
      `, [req.user.id]);
      const s = stats.rows[0];
      herdContext = `\n\n[User's current herd data: ${s.active} active goats (${s.bucks} bucks, ${s.does} does), avg weight: ${s.avg_weight ? parseFloat(s.avg_weight).toFixed(1) + 'kg' : 'unknown'}]`;
    }

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + herdContext },
        { role: 'user', content: message },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (err) {
    console.error('GROQ error:', err.message);
    if (err.message.includes('GROQ_API_KEY')) {
      return res.status(503).json({ error: 'AI service not configured. Please add GROQ_API_KEY to environment.' });
    }
    res.status(500).json({ error: 'AI service error. Please try again.' });
  }
});

// Quick insights endpoint
router.get('/insights', async (req, res) => {
  try {
    const groq = getGroqClient();
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='active') AS active,
        COUNT(*) FILTER (WHERE gender='female' AND status='active') AS does,
        COALESCE(SUM(CASE WHEN type='sell' THEN amount END),0) AS total_income,
        COALESCE(SUM(CASE WHEN type='buy' THEN amount END),0) AS total_spend
      FROM goats g
      LEFT JOIN transactions t ON t.owner_id=g.owner_id AND t.transaction_date >= NOW()-INTERVAL '30 days'
      WHERE g.owner_id=$1
    `, [req.user.id]);

    const s = stats.rows[0];
    const prompt = `Give me 3 quick farming insights and tips based on: ${s.active} active goats (${s.does} does), last 30 days: income $${s.total_income}, spend $${s.total_spend}. Be specific and actionable. Format as 3 numbered tips.`;

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.8,
    });

    res.json({ insights: completion.choices[0].message.content });
  } catch (err) {
    console.error('GROQ insights error:', err.message);
    res.status(503).json({ error: 'AI insights unavailable' });
  }
});

module.exports = router;
