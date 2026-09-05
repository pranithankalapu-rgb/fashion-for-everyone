import React, { useState } from 'react';
import type { RetailProduct, CustomerOrder, UserProfile } from '../types/fashion';
import { api } from '../services/api';
import { X, CheckCircle2, ShoppingBag, Truck, CreditCard, Lock, Smartphone } from 'lucide-react';

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
  const [paymentGateway, setPaymentGateway] = useState<string>('GPAY');
  const [paymentMethod, setPaymentMethod] = useState<string>('Google Pay / UPI');

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
        paymentGateway,
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
          className="absolute top-4 right-4 p-2 rounded-xl bg-surface-theme hover:bg-surface-subtle-theme text-theme-muted hover:text-theme-heading transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {completedOrder ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-theme-heading">Order Placed & Verified!</h2>
            <p className="text-sm text-theme-muted">
              Thank you, <span className="font-semibold text-theme-heading">{completedOrder.customerName}</span>. Your order reference is{' '}
              <span className="font-mono text-amber-400 font-bold">{completedOrder.orderNumber}</span>.
            </p>

            <div className="bg-surface-theme p-4 rounded-2xl border border-theme-main text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-theme-muted">Payment Gateway:</span>
                <span className="font-semibold text-theme-heading uppercase">{completedOrder.paymentMethod || paymentGateway}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Transaction Status:</span>
                <span className="font-bold text-emerald-400">Atomic Stock Locked & Confirmed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Shipping To:</span>
                <span className="font-semibold text-theme-heading truncate max-w-[200px]">{completedOrder.shippingAddress}</span>
              </div>
              <div className="flex justify-between border-t border-theme-main pt-2">
                <span className="text-theme-muted">Total Paid:</span>
                <span className="font-bold text-base text-amber-400">${completedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs shadow-lg shadow-rose-500/20 cursor-pointer"
            >
              Continue Exploring Collections
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Express Direct Checkout</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-theme-heading">Complete Your Order</h2>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Product Summary */}
            <div className="bg-surface-theme p-4 rounded-2xl border border-theme-main flex gap-4 items-center">
              <img src={product.imageUrl} alt={product.title} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-theme-heading truncate">{product.title}</h4>
                <p className="text-xs text-theme-muted">{product.brand}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-amber-400">${product.price}</span>
                  <span className="text-xs text-emerald-400 font-medium">In Stock</span>
                </div>
              </div>
            </div>

            {/* Size & Quantity Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Select Size</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2 text-xs text-theme-heading focus:border-rose-400 outline-none"
                >
                  {(product.sizes || ['XS', 'S', 'M', 'L', 'XL']).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">Quantity</label>
                <div className="flex items-center bg-surface-theme border border-theme-main rounded-xl">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-theme-muted hover:text-theme-heading font-bold"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-xs font-bold text-theme-heading">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-theme-muted hover:text-theme-heading font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-theme-muted flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" /> Shipping Destination
              </label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter complete shipping address"
                className="w-full bg-surface-theme border border-theme-main rounded-xl px-3 py-2.5 text-xs text-theme-heading focus:border-rose-400 outline-none"
                required
              />
            </div>

            {/* Payment Gateway Provider Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-theme-muted flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-rose-400" /> Select Payment Provider
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'GPAY', name: 'Google Pay', label: 'GPay / UPI' },
                  { id: 'RAZORPAY', name: 'Razorpay', label: 'Razorpay' },
                  { id: 'PHONEPE', name: 'PhonePe', label: 'PhonePe' },
                  { id: 'PAYTM', name: 'Paytm', label: 'Paytm' },
                  { id: 'STRIPE', name: 'Credit Card', label: 'Stripe / Card' },
                  { id: 'MOCK', name: 'Instant Test', label: 'Express Sim' },
                ].map((gw) => (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => {
                      setPaymentGateway(gw.id);
                      setPaymentMethod(gw.name);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentGateway === gw.id
                        ? 'bg-rose-500/10 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-surface-theme border-theme-main text-theme-muted hover:border-slate-600'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{gw.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Total & Submit */}
            <div className="pt-4 border-t border-theme-main flex items-center justify-between">
              <div>
                <span className="text-[11px] text-theme-muted">Order Total</span>
                <p className="text-xl font-bold text-amber-400">${totalPrice.toFixed(2)}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-heading cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-rose-500/20 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{loading ? 'Securing Transaction...' : `Pay $${totalPrice.toFixed(2)}`}</span>
                </button>
              </div>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
