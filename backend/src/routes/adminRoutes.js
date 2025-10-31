import { Router } from 'express';
import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/admin.js';
import Order from '../models/Order.js';
import Lending from '../models/Lending.js';
import Book from '../models/Book.js';
import User from '../models/User.js';

const router = Router();
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

router.get('/analytics', auth, adminOnly, async (req, res) => {
  try {
    const [orders, lendings, books] = await Promise.all([
      Order.find(),
      Lending.find(),
      Book.find(),
    ]);

    const totalSales = orders.reduce((sum, order) => sum + order.subtotal, 0);
    const totalOrders = orders.length;
    const totalBorrows = lendings.length;
    const activeBorrows = lendings.filter((l) => ['requested', 'borrowed'].includes(l.status))
      .length;

    const genreMap = new Map();
    books.forEach((book) => {
      const current = genreMap.get(book.genre) || { sales: 0, borrows: 0 };
      current.sales += book.timesPurchased;
      current.borrows += book.timesBorrowed;
      genreMap.set(book.genre, current);
    });

    const topGenres = Array.from(genreMap.entries())
      .map(([genre, stats]) => ({ genre, ...stats }))
      .sort((a, b) => b.sales + b.borrows - (a.sales + a.borrows))
      .slice(0, 5);

    return res.json({
      totalSales,
      totalOrders,
      totalBorrows,
      activeBorrows,
      topGenres,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load analytics', error: error.message });
  }
});

router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load users', error: error.message });
  }
});

router.get('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load user', error: error.message });
  }
});

router.patch('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.name === 'string') {
      const trimmedName = req.body.name.trim();
      if (!trimmedName) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      updates.name = trimmedName;
    }
    if (typeof req.body.role === 'string') {
      if (!['user', 'admin'].includes(req.body.role)) {
        return res.status(400).json({ message: 'Invalid role value' });
      }
      updates.role = req.body.role;
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

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (req.user._id.toString() === req.params.id.toString()) {
      return res.status(400).json({ message: 'Admins cannot delete their own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    return res.json({ message: 'User deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

export default router;
