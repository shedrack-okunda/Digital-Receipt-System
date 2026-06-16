# Digital Receipt Infrastructure API

A multi-tenant, event-driven backend system that replaces traditional POS paper receipts with real-time digital receipt delivery via SMS and WhatsApp. Built for scalability, reliability, and seamless POS integration.

---

## Overview

This system acts as an infrastructure layer between **Point-of-Sale (POS) systems** and **customer communication channels**, enabling:

- Real-time transaction ingestion
- Asynchronous receipt generation
- SMS/WhatsApp delivery
- Merchant analytics dashboard
- Digital receipt webview access

It is designed to be **POS-agnostic**, requiring no modification to existing retail systems.

---

## Architecture

### Core Stack

- **Backend API:** NestJS (Node.js)
- **Database:** PostgreSQL (Prisma ORM)
- **Queue System:** Redis + BullMQ
- **Workers:** Node.js background services
- **Messaging Gateway:** Africa’s Talking (SMS/WhatsApp)
- **Frontend:** Next.js (Merchant Dashboard + Receipt Webview)

---

## High-Level System Flow

```
POS Terminal
    ↓
API Gateway (NestJS)
    ↓
Authentication Layer (API Keys)
    ↓
PostgreSQL (Transaction Storage)
    ↓
Redis Queue (BullMQ Job)
    ↓
Background Worker
    ↓
Africa’s Talking (SMS/WhatsApp)
    ↓
Customer Receipt Webview (Next.js)
```

---

## Key Features

### 1. Transaction Ingestion

- Accepts POS transaction payloads via REST API
- Validates store authentication using API keys
- Ensures idempotency using `(store_id + reference)` constraint

### 2. Asynchronous Processing

- Transactions are processed without blocking checkout
- Receipt generation handled via background workers
- Queue-based architecture ensures scalability

### 3. Digital Receipt Delivery

- SMS & WhatsApp delivery via Africa’s Talking
- Generates secure, unique receipt URLs
- Tracks delivery lifecycle (queued → sent → delivered → failed)

### 4. Merchant Dashboard

- Transaction analytics
- Store-level reporting
- Delivery monitoring and diagnostics

---

## API Overview

### Authentication

All requests require an API key:

```http
x-api-key: sk_live_xxxxxxxxxxxxx
```

### Create Transaction

```http
POST /api/v1/transactions
```

### Payload

```json
{
	"reference": "POS-001-99281",
	"customer": {
		"phone": "254700112233"
	},
	"items": [
		{
			"name": "Product Name",
			"quantity": 1,
			"unitPrice": 10000
		}
	],
	"subtotal": 10000,
	"tax": 0,
	"total": 10000,
	"currency": "KES",
	"payment": {
		"method": "mpesa",
		"providerRef": "ABC123"
	}
}
```

### Response

```json
{
	"transactionId": "txn_123",
	"receiptId": "rcpt_456",
	"status": "processing",
	"receiptUrl": "https://api.receipts.com/r/rcpt_456"
}
```

### Get Transaction

```http
GET /api/v1/transactions/:id
```

Returns full transaction history, items, and receipt status.

### Resend Receipt

```http
POST /api/v1/receipts/:id/resend
```

### Payload

```json
{
	"channel": "sms"
}
```

## Data Model Highlights

- Multi-tenant architecture using store_id
- All monetary values stored in integer cents
- Strong relational structure:
- Stores → Transactions → Items → Receipts → Delivery Events
- Idempotency enforced via unique constraints

## Reliability & Scalability

- Stateless API layer (horizontally scalable)
- Redis-backed queue system (BullMQ)
- Worker separation from request lifecycle
- Retry + dead-letter queue handling
- Rate limiting via token bucket algorithm

## Failure Handling

- Automatic retry for failed deliveries
- Offline POS fallback storage support
- Queue-based recovery system
- Idempotent transaction processing

## Security Model

- API key authentication per store
- TLS 1.3 encrypted transport
- AES-256 encrypted data at rest
- SHA-256 hashed API keys
- Sensitive data anonymization in logs

## UI Modules

### Merchant Dashboard (Next.js)

- Transaction monitoring
- Delivery diagnostics
- Analytics overview

### Customer Receipt View

- Mobile-first receipt page
- Transaction breakdown
- Verification QR code
- Delivery metadata

## System Philosophy

“A Stripe-like ingestion engine for POS systems with real-time digital receipt delivery.”

## Use Cases

- Supermarkets
- Retail chains
- Pharmacies
- POS software vendors
- Financial transaction logging systems

## License

Proprietary / Internal Use (replace as needed)

## Author

Built as a production-grade distributed receipt infrastructure system.

```

```
