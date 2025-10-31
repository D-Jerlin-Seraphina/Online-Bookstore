import { getGenerativeModel } from './aiService.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import Lending from '../models/Lending.js';

const LENDING_DAYS = 14;

const stripCodeFences = (text = '') =>
  text.replace(/```json/gi, '').replace(/```/g, '').trim();

const safeParseJson = (text) => {
  try {
    return JSON.parse(stripCodeFences(text));
  } catch (error) {
    return null;
  }
};

const summarizeBook = (book) => ({
  id: String(book._id),
  title: book.title,
  author: book.author,
  price: book.price,
  genre: book.genre,
  averageRating: book.averageRating,
  stock: book.stock,
  popularity: book.popularity ?? 0,
  timesBorrowed: book.timesBorrowed ?? 0,
  timesPurchased: book.timesPurchased ?? 0,
  summary: book.summary ? `${book.summary.slice(0, 220)}${book.summary.length > 220 ? '…' : ''}` : '',
});

const findBookByTitle = async (title) => {
  if (!title) return null;
  return Book.findOne({ title: new RegExp(title, 'i') }).lean();
};

const buildCatalogSnapshot = async () => {
  const [popularBooks, recentArrivals, lowStockBooks, topGenres] = await Promise.all([
    Book.find().sort({ popularity: -1 }).limit(5).lean(),
    Book.find().sort({ createdAt: -1 }).limit(5).lean(),
    Book.find({ stock: { $gt: 0, $lt: 5 } })
      .sort({ stock: 1 })
      .limit(5)
      .lean(),
    Book.aggregate([
      {
        $group: {
          _id: '$genre',
          count: { $sum: 1 },
          avgRating: { $avg: '$averageRating' },
          avgPrice: { $avg: '$price' },
          totalBorrowed: { $sum: '$timesBorrowed' },
          totalPurchased: { $sum: '$timesPurchased' },
        },
      },
      {
        $sort: { totalPurchased: -1, totalBorrowed: -1, count: -1 },
      },
      { $limit: 5 },
    ]),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    popularBooks: popularBooks.map(summarizeBook),
    recentArrivals: recentArrivals.map(summarizeBook),
    lowStockHighlights: lowStockBooks.map((book) => ({
      id: String(book._id),
      title: book.title,
      stock: book.stock,
    })),
    topGenres: topGenres.map((genre) => ({
      genre: genre._id,
      books: genre.count,
      averageRating: Number(genre.avgRating?.toFixed?.(2) ?? 0),
      averagePrice: Number(genre.avgPrice?.toFixed?.(2) ?? 0),
      totalBorrowed: genre.totalBorrowed ?? 0,
      totalPurchased: genre.totalPurchased ?? 0,
    })),
  };
};

const actionHandlers = {
  async none(plan, context) {
    return { reply: plan.reply ?? '', action: 'none' };
  },
  async search_books(plan) {
    const query = plan.params?.query?.trim();
    let books = [];

    if (!query) {
      books = await Book.find()
        .sort({ popularity: -1, timesPurchased: -1 })
        .limit(8)
        .lean();
    } else {
      const regex = new RegExp(query, 'i');
      books = await Book.find({
        $or: [{ title: regex }, { author: regex }],
      })
        .sort({ popularity: -1, timesPurchased: -1 })
        .limit(8)
        .lean();
    }

    return {
      action: 'search_books',
      reply:
        plan.reply ||
        (!query
          ? books.length
            ? 'Here are some of the most popular books in the store right now:'
            : 'The catalog looks empty at the moment.'
          : books.length
          ? `Here are some matches for "${query}":`
          : `I could not find any books that match "${query}".`),
      data: { books: books.map(summarizeBook) },
    };
  },
  async recommend_books(plan) {
    const genre = plan.params?.genre?.trim();
    const filter = genre ? { genre: new RegExp(`^${genre}$`, 'i') } : {};
    const books = await Book.find(filter).sort({ popularity: -1 }).limit(5).lean();

    return {
      action: 'recommend_books',
      reply:
        plan.reply ||
        (books.length
          ? `Here are a few ${genre ? genre : 'popular'} picks you might enjoy:`
          : 'I could not find any recommendations right now.'),
      data: { books: books.map(summarizeBook) },
    };
  },
  async add_to_wishlist(plan, context) {
    if (!context.user) {
      return {
        action: 'add_to_wishlist',
        reply: 'Please sign in so I can update your wishlist.',
        requiresAuth: true,
      };
    }

    const title = plan.params?.title?.trim();
    const bookId = plan.params?.bookId?.trim();
    let book = null;
    if (bookId) {
      book = await Book.findById(bookId).lean();
    }
    if (!book && title) {
      book = await findBookByTitle(title);
    }
    if (!book) {
      return {
        action: 'add_to_wishlist',
        reply: "I couldn't locate that book. Could you share the exact title?",
      };
    }

    const user = await User.findById(context.user._id);
    if (!user) {
      return {
        action: 'add_to_wishlist',
        reply: 'Your account could not be found. Please sign in again.',
        requiresAuth: true,
      };
    }

    const exists = user.wishlist.some((id) => id.toString() === book._id.toString());
    if (!exists) {
      user.wishlist.push(book._id);
      await user.save();
    }

    return {
      action: 'add_to_wishlist',
      reply: plan.reply || `${book.title} is on your wishlist now!`,
      data: { book: summarizeBook(book), alreadyListed: exists },
    };
  },
  async request_lending(plan, context) {
    if (!context.user) {
      return {
        action: 'request_lending',
        reply: 'Please sign in so I can request that lending for you.',
        requiresAuth: true,
      };
    }

    const title = plan.params?.title?.trim();
    const bookId = plan.params?.bookId?.trim();
    let book = null;
    if (bookId) {
      book = await Book.findById(bookId);
    }
    if (!book && title) {
      book = await findBookByTitle(title);
    }
    if (!book) {
      return {
        action: 'request_lending',
        reply: "I couldn't find that book in the catalog to request a lending.",
      };
    }
    if (book.stock <= 0) {
      return {
        action: 'request_lending',
        reply: `${book.title} is currently unavailable for lending.`,
      };
    }

    const existing = await Lending.findOne({
      user: context.user._id,
      book: book._id,
      status: { $in: ['requested', 'approved', 'borrowed'] },
    });
    if (existing) {
      return {
        action: 'request_lending',
        reply: plan.reply || 'You already have an active request for this title.',
        data: { lending: existing },
      };
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LENDING_DAYS);

    const lending = await Lending.create({
      user: context.user._id,
      book: book._id,
      dueDate,
    });

    return {
      action: 'request_lending',
      reply: plan.reply || `All set! I requested a lending for ${book.title}.`,
      data: { lendingId: lending._id, dueDate },
    };
  },
};

const buildPrompt = (message, context) => {
  const catalogSection = context.catalog
    ? `Catalog snapshot (JSON):\n${JSON.stringify(context.catalog, null, 2)}`
    : 'Catalog snapshot is currently unavailable.';

  const userSection = context.user
    ? `Signed-in user context: ${JSON.stringify({
        id: String(context.user._id ?? context.user.id ?? ''),
        name: context.user.name,
        email: context.user.email,
        role: context.user.role,
      })}`
    : 'The user is browsing anonymously.';

  return `You are "Chapter & Chill Companion", a proactive assistant for an online bookstore.
You can talk casually, but when you want to take an action you must choose one of the allowed actions.
You have access to real catalog data. Prefer citing the provided data or take an action to fetch more when unsure.
Always respond with JSON matching this TypeScript type exactly:
{
  "action": "none" | "search_books" | "recommend_books" | "add_to_wishlist" | "request_lending",
  "params": Record<string, string>,
  "reply": string
}

Catalog context:
${catalogSection}

User context:
${userSection}

Guidelines:
- Use action "none" when a conversational reply is enough.
- Use "search_books" when the user wants titles by keyword. Include a "query" param.
- Use "recommend_books" for genre or mood suggestions. Optionally send a "genre" param.
- Use "add_to_wishlist" only when the user clearly wants a book saved; include "title".
- Use "request_lending" only when the user wants to borrow a book; include "title".
- Never guess book titles; ask for clarification if unsure.
- Whenever you reference books, ground your answer in the catalog snapshot or data returned by actions.
- The "reply" should sound natural and reference what you plan to do.

User message:
"""${message}"""`;
};

export const runChatAgent = async ({ message, user }) => {
  const model = getGenerativeModel();
  let catalogSnapshot = null;

  try {
    catalogSnapshot = await buildCatalogSnapshot();
  } catch (error) {
    console.error('Failed to build catalog snapshot for agent prompt:', error);
  }

  const prompt = buildPrompt(message, { user, catalog: catalogSnapshot });
  const result = await model.generateContent(prompt);
  const rawText = result.response?.text?.() ?? result.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const plan = safeParseJson(rawText) || { action: 'none', reply: rawText?.trim?.() ?? '' };
  const handler = actionHandlers[plan.action] || actionHandlers.none;

  try {
    const outcome = await handler(plan, { user });
    return {
      reply: outcome.reply,
      action: outcome.action,
      data: outcome.data,
      requiresAuth: outcome.requiresAuth ?? false,
    };
  } catch (error) {
    console.error('Agent action failed:', error);
    return {
      reply: 'Something went wrong while completing that request. Please try again in a moment.',
      action: plan.action || 'none',
      data: { error: error.message },
    };
  }
};
