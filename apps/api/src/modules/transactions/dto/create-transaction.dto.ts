export interface CreateCustomerDetailsDto {
  phone: string; // e.g., "+254712345678"
  email?: string; // Optional email address
  name?: string; // Optional customer name
}

export interface CreateTransactionItemDto {
  name: string;
  quantity: number;
  unitPrice: number; // Client sends standard decimal (e.g., 600.00)
}

export interface CreateTransactionDto {
  reference: string;
  subtotal: number; // Client sends standard decimal (e.g., 1200.00)
  tax: number; // Client sends standard decimal (e.g., 192.00)
  total: number; // Client sends standard decimal (e.g., 1392.00)
  currency?: string; // Defaults to "KES"
  customer: CreateCustomerDetailsDto; // Customer details are now strictly required
  items: CreateTransactionItemDto[];
}
