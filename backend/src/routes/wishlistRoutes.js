import { Router } from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  return res.json({ wishlist: user.wishlist });
});

router.post('/', auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ message: 'bookId is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user.wishlist.includes(bookId)) {
      user.wishlist.push(bookId);
      await user.save();
    }

    await user.populate('wishlist');
    return res.status(201).json({ wishlist: user.wishlist });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update wishlist', error: error.message });
  }
});

router.delete('/:bookId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== req.params.bookId.toString()
    );
    await user.save();
    await user.populate('wishlist');
    return res.json({ wishlist: user.wishlist });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update wishlist', error: error.message });
  }
});

export default router;
