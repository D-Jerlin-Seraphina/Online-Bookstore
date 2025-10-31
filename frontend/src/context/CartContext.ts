import { createContext } from 'react';
import type { CartItem } from '../types.ts';

export interface CartContextValue {
  items: CartItem[];
  subtotal: number;
  addToCart: (book: CartItem['book'], quantity?: number) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);
