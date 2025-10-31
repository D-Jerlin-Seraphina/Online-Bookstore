import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api.ts';
import type { Order } from '../types.ts';
import { useCart } from '../hooks/useCart.ts';
import { useAuth } from '../hooks/useAuth.ts';

export const CheckoutPage = () => {
  const { items, subtotal, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (!token) {
      setMessage('Please login to complete your purchase.');
      navigate('/login');
      return;
    }
    setIsSubmitting(true);
    try {
      const { order } = await apiRequest<{ order: Order }>('/orders', {
        method: 'POST',
        token,
        body: {
          items: items.map((item) => ({
            bookId: item.book._id,
            quantity: item.quantity,
          })),
        },
      });
      clearCart();
      setMessage(`Order confirmed! Confirmation code: ${order.confirmationCode}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Checkout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return <p className="text-center text-slate-500">Your cart is empty.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Checkout</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.book._id} className="flex items-center justify-between text-sm text-slate-600">
              <p>
                {item.quantity} × {item.book.title}
              </p>
              <p>${(item.book.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-semibold text-slate-900">
          <span>Total</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isSubmitting}
          className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Processing...' : 'Place order'}
        </button>
        {message && <p className="mt-3 text-sm text-blue-600">{message}</p>}
      </div>
    </div>
  );
};
