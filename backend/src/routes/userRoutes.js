import { Router } from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();

router.get('/profile', auth, async (req, res) => {
  return res.json({ user: req.user });
});

router.patch('/profile', auth, async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.name === 'string') {
      const trimmedName = req.body.name.trim();
      if (!trimmedName) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      updates.name = trimmedName;
    }
    if (req.body.preferences) {
      const { favoriteGenres, wantsNewsletter } = req.body.preferences;
      if (
        (favoriteGenres && !Array.isArray(favoriteGenres)) ||
        (typeof wantsNewsletter !== 'undefined' && typeof wantsNewsletter !== 'boolean')
      ) {
        return res.status(400).json({ message: 'Invalid preferences payload' });
      }
      updates.preferences = req.body.preferences;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

export default router;
