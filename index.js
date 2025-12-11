// server.js - Minimal LLM Proxy Server 

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for your frontend
app.use(cors({
  origin: '*', // In production, replace with your frontend URL
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'LLM Proxy Server is running',
    endpoints: ['/api/openai', '/api/anthropic', '/api/gemini']
  });
});

// OpenAI Proxy
app.post('/api/openai', async (req, res) => {
  try {
    const { apiKey, prompt } = req.body;

    if (!apiKey || !prompt) {
      return res.status(400).json({ error: 'Missing apiKey or prompt' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Anthropic (Claude) Proxy
app.post('/api/anthropic', async (req, res) => {
  try {
    const { apiKey, prompt } = req.body;

    if (!apiKey || !prompt) {
      return res.status(400).json({ error: 'Missing apiKey or prompt' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Anthropic Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google Gemini Proxy
app.post('/api/gemini', async (req, res) => {
  try {
    const { apiKey, prompt } = req.body;

    if (!apiKey || !prompt) {
      return res.status(400).json({ error: 'Missing apiKey or prompt' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`LLM Proxy Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
});