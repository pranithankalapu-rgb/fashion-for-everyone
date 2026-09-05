import crypto from 'crypto';

export type PaymentGatewayType = 'RAZORPAY' | 'GPAY' | 'PHONEPE' | 'PAYTM' | 'STRIPE' | 'PAYPAL' | 'MOCK';

export interface PaymentIntentResult {
  intentId: string;
  orderId: string;
  amount: number;
  currency: string;
  clientSecret?: string;
  paymentUrl?: string;
  gateway: PaymentGatewayType;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
}

export interface WebhookResult {
  orderId: string;
  paymentIntentId: string;
  status: 'PAID' | 'FAILED' | 'REFUNDED';
  gateway: PaymentGatewayType;
  rawPayload: any;
}

export interface PaymentProvider {
  createIntent(params: {
    orderId: string;
    amount: number;
    currency: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<PaymentIntentResult>;

  verifyPayment(params: {
    paymentIntentId: string;
    signature?: string;
    paymentId?: string;
  }): Promise<{ success: boolean; status: 'PAID' | 'FAILED' }>;

  verifyWebhookSignature(payload: string | Buffer, signature: string, secret?: string): boolean;

  processWebhook(payload: any): Promise<WebhookResult>;
}

// 1. Razorpay Provider
class RazorpayProvider implements PaymentProvider {
  async createIntent(params: { orderId: string; amount: number; currency: string }): Promise<PaymentIntentResult> {
    const intentId = `rzp_order_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return {
      intentId,
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency || 'INR',
      gateway: 'RAZORPAY',
      status: 'PENDING',
    };
  }

  async verifyPayment(params: { paymentIntentId: string; signature?: string; paymentId?: string }) {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'dev_rzp_secret';
    if (params.signature && params.paymentId) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${params.paymentIntentId}|${params.paymentId}`)
        .digest('hex');
      return { success: generatedSignature === params.signature, status: 'PAID' as const };
    }
    return { success: true, status: 'PAID' as const };
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string, secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dev_secret') {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return expected === signature;
  }

  async processWebhook(payload: any): Promise<WebhookResult> {
    const payment = payload.payload?.payment?.entity;
    return {
      orderId: payment?.notes?.orderId || payload.orderId || 'unknown',
      paymentIntentId: payment?.id || payload.paymentIntentId || 'rzp_id',
      status: payload.event === 'payment.captured' ? 'PAID' : 'FAILED',
      gateway: 'RAZORPAY',
      rawPayload: payload,
    };
  }
}

// 2. UPI / Google Pay / PhonePe / Paytm Provider
class UpiPaymentProvider implements PaymentProvider {
  constructor(private gateway: PaymentGatewayType = 'GPAY') {}

  async createIntent(params: { orderId: string; amount: number; currency: string }): Promise<PaymentIntentResult> {
    const intentId = `upi_${this.gateway.toLowerCase()}_${Date.now()}`;
    const vpa = process.env.UPI_MERCHANT_VPA || 'merchant@upi';
    const upiDeepLink = `upi://pay?pa=${vpa}&pn=FashionForEveryone&tr=${intentId}&am=${params.amount}&cu=${params.currency || 'INR'}&tn=Order-${params.orderId}`;

    return {
      intentId,
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency,
      paymentUrl: upiDeepLink,
      gateway: this.gateway,
      status: 'PENDING',
    };
  }

  async verifyPayment(params: { paymentIntentId: string }) {
    return { success: true, status: 'PAID' as const };
  }

  verifyWebhookSignature() {
    return true;
  }

  async processWebhook(payload: any): Promise<WebhookResult> {
    return {
      orderId: payload.orderId,
      paymentIntentId: payload.transactionId,
      status: payload.responseCode === 'SUCCESS' ? 'PAID' : 'FAILED',
      gateway: this.gateway,
      rawPayload: payload,
    };
  }
}

// 3. Dev / Mock Provider (Safe Local Testing)
class MockPaymentProvider implements PaymentProvider {
  async createIntent(params: { orderId: string; amount: number; currency: string }): Promise<PaymentIntentResult> {
    const intentId = `mock_intent_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      intentId,
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency,
      clientSecret: `mock_secret_${Date.now()}`,
      gateway: 'MOCK',
      status: 'PAID',
    };
  }

  async verifyPayment() {
    return { success: true, status: 'PAID' as const };
  }

  verifyWebhookSignature() {
    return true;
  }

  async processWebhook(payload: any): Promise<WebhookResult> {
    return {
      orderId: payload.orderId || 'ORD-000',
      paymentIntentId: payload.paymentIntentId || 'mock_intent',
      status: 'PAID',
      gateway: 'MOCK',
      rawPayload: payload,
    };
  }
}

export const paymentService = {
  getProvider(gateway: string = 'MOCK'): PaymentProvider {
    const upper = gateway.toUpperCase();
    switch (upper) {
      case 'RAZORPAY':
        return new RazorpayProvider();
      case 'GPAY':
      case 'GOOGLEPAY':
        return new UpiPaymentProvider('GPAY');
      case 'PHONEPE':
        return new UpiPaymentProvider('PHONEPE');
      case 'PAYTM':
        return new UpiPaymentProvider('PAYTM');
      case 'BHARATPAY':
        return new UpiPaymentProvider('GPAY');
      default:
        return new MockPaymentProvider();
    }
  },

  async createOrderPaymentIntent(params: {
    orderId: string;
    amount: number;
    currency?: string;
    gateway?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<PaymentIntentResult> {
    const provider = this.getProvider(params.gateway);
    return provider.createIntent({
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency || 'USD',
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
    });
  },

  async verifyAndConfirmPayment(params: {
    paymentIntentId: string;
    gateway?: string;
    signature?: string;
    paymentId?: string;
  }) {
    const provider = this.getProvider(params.gateway);
    return provider.verifyPayment(params);
  },
};
