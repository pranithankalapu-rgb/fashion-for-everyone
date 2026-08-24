import React, { useState } from 'react';
import type { RetailProduct, CustomerOrder, UserProfile } from '../types/fashion';
import { api } from '../services/api';
import { X, CheckCircle2, ShoppingBag, Truck, CreditCard, ShieldCheck } from 'lucide-react';

interface OrderCheckoutModalProps {
  product: RetailProduct | null;
  userProfile: UserProfile;
  onClose: () => void;
  onOrderSuccess: (order: CustomerOrder) => void;
}

export const OrderCheckoutModal: React.FC<OrderCheckoutModalProps> = ({
  product,
  userProfile,
  onClose,
  onOrderSuccess,
}) => {
  const [size, setSize] = useState<string>(product?.sizes?.[0] || 'M');
  const [color, setColor] = useState<string>(product?.colors?.[0] || 'Default');
  const [quantity, setQuantity] = useState<number>(1);
  const [shippingAddress, setShippingAddress] = useState<string>(
    '742 Evergreen Terrace, Suite 4B, Seattle, WA 98103'
  );
  const [customerEmail, setCustomerEmail] = useState<string>(
    userProfile?.name ? userProfile.name.toLowerCase().replace(/\s+/g, '.') + '@example.com' : 'customer@example.com'
  );
  const [customerPhone, setCustomerPhone] = useState<string>('+1 (206) 555-0192');
  const [paymentMethod, setPaymentMethod] = useState<string>('Credit Card (Visa)');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CustomerOrder | null>(null);

  if (!product) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setError('Please provide a valid shipping address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.createOrder({
        customerName: userProfile.name,
        customerEmail,
        customerPhone,
        shippingAddress,
        paymentMethod,
        items: [
          {
            productId: product.id,
            title: product.title,
            brand: product.brand,
            imageUrl: product.imageUrl,
            price: product.price,
            quantity,
            size,
            color,
            sku: product.sku || `SKU-${product.id}`,
          },
        ],
      });

      setCompletedOrder(res.order);
      onOrderSuccess(res.order);
    } catch (err: any) {
      console.error('Order placement error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = product.price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-modal-theme border border-theme-main rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {completedOrder ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-theme-heading">Order Placed Successfully!</h2>
            <p className="text-sm text-theme-muted">
              Thank you, <span className="font-semibold text-theme-heading">{completedOrder.customerName}</span>. Your order reference is{' '}
              <span className="font-mono text-amber-400 font-bold">{completedOrder.orderNumber}</span>.
            </p>
            <div className="p-4 rounded-2xl bg-surface-theme border border-theme-main text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-theme-main pb-2">
                <span className="text-theme-muted">Item:</span>
                <span className="font-semibold text-theme-heading">{product.title} (Size {size})</span>
              </div>
              <div className="flex justify-between border-b border-theme-main pb-2">
                <span className="text-theme-muted">Total Paid:</span>
                <span className="font-bold text-amber-400">${totalPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Deliver To:</span>
                <span className="text-theme-body font-medium">{shippingAddress}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold py-3 rounded-xl text-sm shadow-lg shadow-amber-500/20"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-theme-heading">Complete Purchase</h2>
                <p className="text-xs text-theme-muted">Direct checkout connected to live inventory DB</p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Product Summary */}
            <div className="flex gap-4 p-3 rounded-2xl bg-surface-theme border border-theme-main items-center">
              <img src={product.imageUrl} alt={product.title} className="w-16 h-20 object-cover rounded-xl border border-theme-main" />
              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{product.brand}</span>
                <h4 className="font-bold text-sm text-theme-heading line-clamp-1">{product.title}</h4>
                <div className="text-sm font-bold text-amber-300">${product.price}</div>
              </div>
            </div>

            {/* Selection Options */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-theme-secondary mb-1">Size</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs font-medium focus:ring-1 focus:ring-amber-400"
                >
                  {(product.sizes || ['XS', 'S', 'M', 'L', 'XL']).map((sz) => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-secondary mb-1">Color</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs font-medium focus:ring-1 focus:ring-amber-400"
                >
                  {(product.colors?.length ? product.colors : ['Default', 'Midnight Navy', 'Warm Tan']).map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-secondary mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={product.stockQuantity || 10}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs font-medium focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Shipping & Customer Details */}
            <div className="space-y-3 pt-2 border-t border-theme-main">
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-heading flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                Shipping Details
              </h4>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Delivery Address</label>
                <input
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs focus:ring-1 focus:ring-amber-400"
                  placeholder="Street Address, City, State, ZIP"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-muted mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2 pt-2 border-t border-theme-main">
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-heading flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                Payment Method
              </h4>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-theme border border-theme-main text-xs focus:ring-1 focus:ring-amber-400"
              >
                <option value="Credit Card (Visa)">Credit Card (Visa)</option>
                <option value="Apple Pay">Apple Pay</option>
                <option value="PayPal">PayPal</option>
                <option value="Shop Pay">Shop Pay</option>
              </select>
            </div>

            {/* Total and Checkout Action */}
            <div className="pt-4 border-t border-theme-main flex items-center justify-between">
              <div>
                <span className="text-xs text-theme-muted block">Total Payment:</span>
                <span className="text-2xl font-bold text-amber-400">${totalPrice}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Processing Order...' : 'Confirm & Pay Now'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
