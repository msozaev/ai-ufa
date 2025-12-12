const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS to allow requests from your domain
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from any origin for now, you can restrict this later
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'OpenAI proxy server is running' });
});

// Proxy endpoint for OpenAI chat completions
app.post('/api/openai/chat/completions', async (req, res) => {
  try {
    // Verify API key from header or use environment variable
    const apiKey = req.headers['x-api-key'] || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }

    // Forward request to OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    // Return OpenAI response
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);

    // Forward error response from OpenAI
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Proxy server error',
        message: error.message
      });
    }
  }
});

// Generic proxy endpoint for other OpenAI endpoints
app.post('/api/openai/*', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'] || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }

    // Extract the path after /api/openai/
    const openaiPath = req.params[0];

    const response = await axios.post(
      `https://api.openai.com/${openaiPath}`,
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Proxy server error',
        message: error.message
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`OpenAI proxy server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
});