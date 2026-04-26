# Jewel Fleet Management API

A RESTful API for a travel company fleet management system. Admins manage vehicles, destinations, and journeys. Users browse and book tickets. Drivers submit journey reports.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [Running Tests](#running-tests)
- [API Overview](#api-overview)
- [Roles & Permissions](#roles--permissions)
- [Error Handling](#error-handling)

---

## Tech Stack

- **Runtime:** Node.js (ESM)
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (JSON Web Tokens)
- **Validation:** Joi
- **PDF Generation:** PDFKit
- **Logging:** Winston + Morgan
- **Testing:** Jest + Supertest

---

## Features

- JWT authentication with three roles: `admin`, `driver`, `user`
- Full CRUD for vehicles, destinations, and journeys
- Ticket booking with mock payment gateway and auto seat assignment
- Ticket cancellation with automatic refund transaction
- PDF passenger manifest generation per journey
- Journey reports (admins and drivers)
- Financial reports with date-range filtering (revenue, expenses, net profit)
- Request validation on all endpoints via Joi schemas
- Rate limiting, CORS, and security headers via Helmet

---

## Project Structure

```
src/
├── app/
│   ├── controllers/       # Route handlers
│   ├── middlewares/       # Auth, validation, error handling
│   ├── models/            # Mongoose schemas
│   └── services/          # Auth, payment, PDF logic
├── bootstrap/
│   └── app.js             # Express app setup
├── config/                # DB, JWT, app config
├── lib/                   # Logger, custom error, utils
├── routes/                # Route definitions
└── tests/
    ├── globalSetup.js
    ├── globalTeardown.js
    ├── dbSetup.js
    ├── integration/
    │   └── auth.test.js
    └── unit/
        ├── fleetController.test.js
        ├── ticketController.test.js
        └── financialController.test.js
```

---

## Local Setup

### Prerequisites

- Node.js v18 or higher
- MongoDB (local install or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/chidinmaosonwa-paul/jewel-fleet-management-api.git
cd jewel-fleet-management-api

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Open .env and fill in your values (see Environment Variables below)

# 4. Start the server
npm run dev
```

The API will be available at `http://localhost:3000`.

You can confirm it is running by visiting the health check endpoint:

```
GET http://localhost:3000/health
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Port the server listens on | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/fleet_management` |
| `JWT_SECRET` | Secret key for signing JWTs | `a_long_random_string` |
| `JWT_EXPIRES_IN` | JWT expiry duration | `1d` |
| `BCRYPT_SALT_ROUNDS` | Password hashing cost factor | `10` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window per IP | `100` |

---

## Running the Server

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

---

## Running Tests

Tests use Jest with `jest.unstable_mockModule` for pure in-memory mocking — no live database or network connection required.

```bash
npm test
```

Expected output:
```
PASS src/tests/unit/fleetController.test.js
PASS src/tests/unit/ticketController.test.js
PASS src/tests/unit/financialController.test.js
PASS src/tests/integration/auth.test.js

Test Suites: 4 passed, 4 total
Tests:       34 passed, 34 total
```

---

## API Overview

All endpoints (except `/health`) require a `Bearer` token in the `Authorization` header.

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a new user |
| POST | `/login` | Public | Log in and receive a JWT |

### Fleet — `/api/fleet`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Admin | Create a vehicle |
| GET | `/` | All | List all vehicles |
| PUT | `/:id` | Admin | Update vehicle fields |
| DELETE | `/:id` | Admin | Delete a vehicle |

### Destinations — `/api/destinations`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Admin | Create a destination |
| GET | `/` | All | List all destinations |
| PUT | `/:id` | Admin | Update a destination |
| DELETE | `/:id` | Admin | Delete a destination |

### Journeys — `/api/journeys`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Admin | Schedule a journey |
| GET | `/` | All | List all journeys |
| PUT | `/:id` | Admin | Update journey fields (vehicle, destination, departure time) |
| PUT | `/:id/status` | Admin | Update journey status only |
| DELETE | `/:id` | Admin | Delete a journey (blocked if tickets exist) |

### Tickets — `/api/tickets`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/book` | User | Book a ticket |
| PUT | `/:id/cancel` | User/Admin | Cancel a ticket |
| GET | `/` | User/Admin | List tickets (users see only their own) |

### Reports — `/api/reports`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Admin/Driver | Submit a journey report |
| GET | `/` | Admin/Driver | List reports (drivers see only their own) |
| GET | `/manifest/:journeyId` | Admin | Download PDF passenger manifest |

### Financial — `/api/financial`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/transactions` | Admin | List all transactions |
| GET | `/report?startDate=&endDate=` | Admin | Financial report for a date range |

---

## Roles & Permissions

| Role | Capabilities |
|---|---|
| `admin` | Full access to all endpoints |
| `driver` | Submit and view their own journey reports |
| `user` | Browse journeys, book and cancel their own tickets |

---

## Error Handling

All errors follow a consistent JSON format:

```json
{
  "message": "Human-readable error description"
}
```

Validation errors return an array of messages:

```json
{
  "error": ["\"email\" is required", "\"password\" must be at least 6 characters"]
}
```

| Status Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request / validation error |
| `401` | Unauthenticated (missing or invalid token) |
| `403` | Forbidden (insufficient role) |
| `404` | Resource not found |
| `500` | Internal server error |