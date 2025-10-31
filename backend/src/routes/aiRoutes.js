import { Router } from 'express';
import { generateBookInsights } from '../services/aiService.js';
import { runChatAgent } from '../services/agentService.js';
import optionalAuth from '../middleware/optionalAuth.js';

const router = Router();

router.post('/book-insights', async (req, res) => {
  try {
    const { title, author, genre, summary } = req.body || {};
    if (!title || !author || !genre || !summary) {
      return res.status(400).json({ message: 'title, author, genre, and summary are required' });
    }

    const insight = await generateBookInsights({ title, author, genre, summary });
    return res.json({ insight });
  } catch (error) {
    console.error('Gemini request failed:', error.message);
    return res.status(500).json({ message: 'Failed to generate AI insight', error: error.message });
  }
});

router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ message: 'message is required' });
    }

    const response = await runChatAgent({ message, user: req.user });
    return res.json(response);
  } catch (error) {
    console.error('Chat agent failed:', error.message);
    return res.status(500).json({ message: 'Failed to process chat request', error: error.message });
  }
});

export default router;
