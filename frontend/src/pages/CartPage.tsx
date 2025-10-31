import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart.ts';

export const CartPage = () => {
  const { items, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-500">Find something new to read in our catalog.</p>
        <Link
          to="/catalog"
          className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Browse catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Shopping cart</h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-sm font-medium text-red-500 hover:text-red-600"
        >
          Clear cart
        </button>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.book._id} className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{item.book.title}</h2>
              <p className="text-sm text-slate-500">{item.book.author}</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm text-slate-500">
                Qty
                <input
                  type="number"
                  min={1}
                  max={item.book.stock}
                  value={item.quantity}
                  onChange={(event) => updateQuantity(item.book._id, Number(event.target.value))}
                  className="ml-2 w-20 rounded-md border border-slate-200 px-2 py-1 text-sm"
                />
              </label>
              <p className="font-semibold text-slate-900">${(item.book.price * item.quantity).toFixed(2)}</p>
              <button
                type="button"
                onClick={() => removeFromCart(item.book._id)}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-end gap-3 rounded-xl bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-900">Subtotal: ${subtotal.toFixed(2)}</p>
        <Link
          to="/checkout"
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
};
