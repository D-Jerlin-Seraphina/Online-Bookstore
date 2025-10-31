export type UserRole = 'user' | 'admin';

export interface UserPreferences {
  favoriteGenres: string[];
  wantsNewsletter: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferences: UserPreferences;
}

export interface BookReview {
  _id: string;
  user: { _id: string; name: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  genre: string;
  summary: string;
  price: number;
  stock: number;
  coverImage: string;
  popularity: number;
  timesBorrowed: number;
  timesPurchased: number;
  averageRating: number;
  reviews: BookReview[];
}

export interface CartItem {
  book: Book;
  quantity: number;
}

export interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  subtotal: number;
  confirmationCode: string;
  status: 'processing' | 'shipped' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface Lending {
  _id: string;
  book: Book;
  status: 'requested' | 'approved' | 'borrowed' | 'returned' | 'cancelled';
  dueDate: string;
  reminderSent: boolean;
  createdAt: string;
  returnedAt?: string;
}

export interface AnalyticsSummary {
  totalSales: number;
  totalOrders: number;
  totalBorrows: number;
  activeBorrows: number;
  topGenres: Array<{ genre: string; sales: number; borrows: number }>;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: string;
}
