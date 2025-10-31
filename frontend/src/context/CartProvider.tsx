import { useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Book } from '../types.ts';
import { CartContext } from './CartContext.ts';

interface CartItemState {
  book: Book;
  quantity: number;
}

interface CartState {
  items: CartItemState[];
}

type CartAction =
  | { type: 'ADD'; book: Book; quantity: number }
  | { type: 'REMOVE'; bookId: string }
  | { type: 'UPDATE'; bookId: string; quantity: number }
  | { type: 'CLEAR' };

const STORAGE_KEY = 'online-bookstore:cart';

const loadInitialState = (): CartState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return { items: [] };
  try {
    const parsed = JSON.parse(stored) as CartState;
    return parsed;
  } catch (error) {
    console.error('Failed to parse stored cart', error);
    return { items: [] };
  }
};

const reducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((item) => item.book._id === action.book._id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.book._id === action.book._id
              ? { ...item, quantity: Math.min(item.quantity + action.quantity, action.book.stock) }
              : item
          ),
        };
      }
      return {
        items: [...state.items, { book: action.book, quantity: Math.min(action.quantity, action.book.stock) }],
      };
    }
    case 'REMOVE':
      return { items: state.items.filter((item) => item.book._id !== action.bookId) };
    case 'UPDATE':
      return {
        items: state.items.map((item) =>
          item.book._id === action.bookId
            ? { ...item, quantity: Math.max(1, Math.min(action.quantity, item.book.stock)) }
            : item
        ),
      };
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addToCart = (book: Book, quantity = 1) => {
    if (quantity <= 0) return;
    dispatch({ type: 'ADD', book, quantity });
  };

  const removeFromCart = (bookId: string) => {
    dispatch({ type: 'REMOVE', bookId });
  };

  const updateQuantity = (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE', bookId });
      return;
    }
    dispatch({ type: 'UPDATE', bookId, quantity });
  };

  const clearCart = () => dispatch({ type: 'CLEAR' });

  const subtotal = state.items.reduce((sum, item) => sum + item.book.price * item.quantity, 0);

  const value = useMemo(
    () => ({ items: state.items, subtotal, addToCart, removeFromCart, updateQuantity, clearCart }),
    [state.items, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
