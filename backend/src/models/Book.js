import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
);

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    genre: { type: String, required: true },
    summary: { type: String, default: '' },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    coverImage: { type: String, default: '' },
    popularity: { type: Number, default: 0 },
    timesBorrowed: { type: Number, default: 0 },
    timesPurchased: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

bookSchema.methods.recalculateAverageRating = function recalc() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    return;
  }
  const total = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.averageRating = Number((total / this.reviews.length).toFixed(2));
};

const Book = mongoose.model('Book', bookSchema);

export default Book;
