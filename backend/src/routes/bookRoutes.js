import { Router } from 'express';
import Book from '../models/Book.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/admin.js';

const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12MB safety limit within MongoDB document size

const validateCoverImage = (coverImage) => {
  if (typeof coverImage === 'undefined' || coverImage === null) {
    return { ok: true };
  }

  if (typeof coverImage !== 'string') {
    return { ok: false, message: 'coverImage must be a base64 encoded string' };
  }

  const trimmed = coverImage.trim();
  if (!trimmed) {
    return { ok: true, value: '' };
  }

  const [maybePrefix, base64Segment] = trimmed.split(',', 2);
  const base64Data = base64Segment ? base64Segment : maybePrefix;

  if (!/^[A-Za-z0-9+/=\s]+$/.test(base64Data)) {
    return { ok: false, message: 'coverImage must be a valid base64 string' };
  }

  const byteLength = Buffer.byteLength(base64Data.replace(/\s+/g, ''), 'base64');
  if (byteLength > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      message: `coverImage exceeds ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))}MB limit`,
    };
  }

  return { ok: true, value: trimmed };
};

const applyCoverImageValidation = (payload = {}) => {
  const candidate = { ...payload };
  const validation = validateCoverImage(candidate.coverImage);
  if (!validation.ok) {
    return { error: validation.message };
  }
  if (Object.prototype.hasOwnProperty.call(validation, 'value')) {
    candidate.coverImage = validation.value;
  }
  return { payload: candidate };
};

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { search, genre, sort } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { author: new RegExp(search, 'i') },
      ];
    }

    if (genre) {
      query.genre = genre;
    }

    let booksQuery = Book.find(query);

    if (sort === 'price') booksQuery = booksQuery.sort({ price: 1 });
    if (sort === 'popularity') booksQuery = booksQuery.sort({ popularity: -1 });

    const books = await booksQuery.exec();
    const genres = await Book.distinct('genre');

    return res.json({ books, genres });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch books', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('reviews.user', 'name');
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    return res.json({ book });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch book', error: error.message });
  }
});

router.get('/:id/recommendations', async (req, res) => {
  try {
    const current = await Book.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ message: 'Book not found' });
    }
    const recommendations = await Book.find({
      _id: { $ne: current._id },
      genre: current.genre,
    })
      .sort({ popularity: -1 })
      .limit(6);
    return res.json({ recommendations });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch recommendations', error: error.message });
  }
});

router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const existing = book.reviews.find((r) => r.user.toString() === req.user._id.toString());
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this book' });
    }

    book.reviews.push({ user: req.user._id, rating, comment });
    book.recalculateAverageRating();
    await book.save();

    return res.status(201).json({ book });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add review', error: error.message });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { payload, error } = applyCoverImageValidation(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const book = await Book.create(payload);
    return res.status(201).json({ book });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create book', error: error.message });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { payload, error } = applyCoverImageValidation(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const book = await Book.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    return res.json({ book });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update book', error: error.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    return res.json({ message: 'Book deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete book', error: error.message });
  }
});

export default router;
