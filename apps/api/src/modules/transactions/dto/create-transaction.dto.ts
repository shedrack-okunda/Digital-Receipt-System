// To keep things lightweight and avoid installing extra validation packages prematurely,
// we will define the structural TypeScript interfaces for our incoming POS hardware schema.

export interface CreateTransactionItemDto {
  name: string;
  quantity: number;
  unitPrice: number; // Stored as cents/integers (e.g., KES 150.00 is stored as 15000)
}

export interface CreateTransactionDto {
  reference: string; // Unique reference identifier from the physical POS machine
  subtotal: number; // Stored as integer cents
  tax: number; // Stored as integer cents
  total: number; // Stored as integer cents
  currency?: string; // Defaults to "KES"
  items: CreateTransactionItemDto[];
}
