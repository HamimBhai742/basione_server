export type OrderConfirmedEmailData = {
  userName: string;
  email: string;

  orderId: string;
  orderDate: string;
  estimatedDelivery?: string | null;

  items: {
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }[];

  subtotal: number;
  deliveryFee: number;
  eyeletsFee?: number;
  priceExcludingVat: number;
  vatRate: number;
  vatAmount: number;
  total: number;

  shippingAddress: {
    name?: string | null;
    companyName?: string | null;
    phone?: string | null;
    email?: string | null;
    street?: string | null;
    houseNumber?: string | null;
    address?: string | null;
    zipCode?: string | null;
    city?: string | null;
  };

  paymentMethod: string;

  invoiceNumber?: string | null;
  invoiceUrl?: string | null;
  invoiceFilePath?: string | null;
};