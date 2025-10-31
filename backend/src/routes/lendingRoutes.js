import { Router } from 'express';
import mongoose from 'mongoose';
import Lending from '../models/Lending.js';
import Book from '../models/Book.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/admin.js';

const router = Router();
const DEFAULT_LENDING_DAYS = 14;
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

router.post('/', auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ message: 'bookId is required' });
    }
    if (!isValidObjectId(bookId)) {
      return res.status(400).json({ message: 'Invalid bookId' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    if (book.stock <= 0) {
      return res.status(400).json({ message: 'Book is currently unavailable for lending' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + DEFAULT_LENDING_DAYS);

    const lending = await Lending.create({
      user: req.user._id,
      book: book._id,
      dueDate,
    });

    return res.status(201).json({ lending });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to request lending', error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const lendings = await Lending.find({ user: req.user._id })
      .populate('book', 'title author coverImage')
      .sort({ createdAt: -1 });
    return res.json({ lendings });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch lending history', error: error.message });
  }
});

router.get('/admin/all', auth, adminOnly, async (req, res) => {
  try {
    const lendings = await Lending.find()
      .populate('book', 'title author')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    return res.json({ lendings });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch lending requests', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lending id' });
    }
    const lending = await Lending.findById(req.params.id)
      .populate('book', 'title author coverImage')
      .populate('user', 'name email');
    if (!lending) {
      return res.status(404).json({ message: 'Lending record not found' });
    }

    const lendingUserId = lending.user?._id ?? lending.user;
    const isOwner = lendingUserId
      ? lendingUserId.toString() === req.user._id.toString()
      : false;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this lending' });
    }

    return res.json({ lending });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch lending', error: error.message });
  }
});

router.patch('/:id/approve', auth, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lending id' });
    }
    const lending = await Lending.findById(req.params.id).populate('book');
    if (!lending) {
      return res.status(404).json({ message: 'Lending request not found' });
    }
    if (lending.status !== 'requested') {
      return res.status(400).json({ message: 'Lending already processed' });
    }

    const book = lending.book;
    if (book.stock <= 0) {
      return res.status(400).json({ message: 'Book out of stock' });
    }

    book.stock -= 1;
    book.timesBorrowed += 1;
    book.popularity += 1;
    await book.save();

    lending.status = 'borrowed';
    lending.approvedBy = req.user._id;
    await lending.save();

    return res.json({ lending });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to approve lending', error: error.message });
  }
});

router.patch('/:id/return', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lending id' });
    }
    const lending = await Lending.findById(req.params.id).populate('book');
    if (!lending) {
      return res.status(404).json({ message: 'Lending record not found' });
    }

    if (!['borrowed', 'approved'].includes(lending.status)) {
      return res.status(400).json({ message: 'Lending not currently active' });
    }

    const isOwner = lending.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not permitted to close this lending' });
    }

    lending.status = 'returned';
    lending.returnedAt = new Date();
    lending.reminderSent = false;
    await lending.save();

    const book = lending.book;
    book.stock += 1;
    await book.save();

    return res.json({ lending });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to return book', error: error.message });
  }
});

router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lending id' });
    }

    const lending = await Lending.findById(req.params.id).populate('book');
    if (!lending) {
      return res.status(404).json({ message: 'Lending record not found' });
    }

    if (lending.status !== 'requested') {
      return res.status(400).json({ message: 'Only requested lendings can be cancelled' });
    }

    const isOwner = lending.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not permitted to cancel this lending' });
    }

    lending.status = 'cancelled';
    lending.returnedAt = undefined;
    lending.reminderSent = false;
    await lending.save();

    return res.json({ lending });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to cancel lending', error: error.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lending id' });
    }
    const lending = await Lending.findById(req.params.id).populate('book');
    if (!lending) {
      return res.status(404).json({ message: 'Lending record not found' });
    }

    if (['borrowed', 'approved'].includes(lending.status) && lending.book) {
      lending.book.stock += 1;
      await lending.book.save();
    }

    await lending.deleteOne();
    return res.json({ message: 'Lending record removed' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete lending', error: error.message });
  }
});

export default router;
