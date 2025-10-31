import { Router } from 'express';
import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';
import Order from '../models/Order.js';
import Book from '../models/Book.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/admin.js';

const router = Router();

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const restoreInventoryFromOrder = async (order) => {
  for (const item of order.items) {
    const bookId = item.book?._id ?? item.book;
    if (!bookId) continue;
    const book = await Book.findById(bookId);
    if (!book) continue;
    book.stock += item.quantity;
    book.timesPurchased = Math.max(0, book.timesPurchased - item.quantity);
    book.popularity = Math.max(0, book.popularity - item.quantity);
    await book.save();
  }
};

router.post('/', auth, async (req, res) => {
  try {
    const { items = [] } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart items are required' });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const { bookId, quantity } = item;
      if (!isValidObjectId(bookId)) {
        return res.status(400).json({ message: `Invalid bookId: ${bookId}` });
      }
      if (typeof quantity !== 'number' || Number.isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be a positive number' });
      }
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ message: `Book ${bookId} not found` });
      }
      if (book.stock < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${book.title}` });
      }

      subtotal += book.price * quantity;
      book.stock -= quantity;
      book.timesPurchased += quantity;
      book.popularity += quantity;
      await book.save();

      orderItems.push({
        book: book._id,
        title: book.title,
        quantity,
        price: book.price,
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      subtotal,
      paymentStatus: 'paid',
      status: 'processing',
      confirmationCode: uuid().split('-')[0].toUpperCase(),
    });

    return res.status(201).json({ order });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

router.get('/admin/all', auth, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }
    const order = await Order.findById(req.params.id).populate('items.book', 'title author');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
});

router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order already cancelled' });
    }

    if (['completed', 'shipped'].includes(order.status)) {
      return res.status(400).json({ message: 'Completed orders cannot be cancelled' });
    }

    await restoreInventoryFromOrder(order);
    order.status = 'cancelled';
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }
    await order.save();

    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
});

router.patch('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body || {};
    if (!status && !paymentStatus) {
      return res.status(400).json({ message: 'status or paymentStatus is required' });
    }
    if (status && typeof status !== 'string') {
      return res.status(400).json({ message: 'status must be a string' });
    }
    if (paymentStatus && typeof paymentStatus !== 'string') {
      return res.status(400).json({ message: 'paymentStatus must be a string' });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const validStatuses = ['processing', 'shipped', 'completed', 'cancelled'];
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status value' });
    }

    const previousStatus = order.status;
    if (previousStatus === 'cancelled' && status && status !== 'cancelled') {
      return res.status(400).json({ message: 'Cancelled orders cannot be reopened' });
    }

    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      if (previousStatus === 'completed') {
        return res.status(400).json({ message: 'Completed orders cannot be cancelled' });
      }
      await restoreInventoryFromOrder(order);
    }

    if (status) {
      order.status = status;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    await order.save();

    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['processing', 'shipped'].includes(order.status)) {
      await restoreInventoryFromOrder(order);
    }

    await order.deleteOne();
    return res.json({ message: 'Order deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
});

export default router;
