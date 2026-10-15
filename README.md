# Nakkashii - Product Variant Management

A marketplace slice where sellers sell one product in many variants (e.g. a tee in 3 colours x 3 sizes), each variant with its own SKU, price, stock, availability and images. Buyers pick options on the product page and the matching variant is resolved live.

- `server/` - Express 5 + MongoDB (Mongoose) + Zod
- `web/` - React 19 + Vite + React Router

Design decisions, trade-offs and what was cut are in [NOTES.md](NOTES.md).

## Setup

**Needs:** Node 20.19+ (or 22.12+) and a MongoDB (local `mongod` or a free Atlas cluster).

```bash
git clone <repo-url>
cd nakkashii

# backend
cd server
npm install
cp .env.example .env     # then edit MONGODB_URI and JWT_SECRET
npm run seed             # creates demo users + products
npm run dev              # http://localhost:5000

# frontend (new terminal)
cd web
npm install
npm run dev              # http://localhost:5173
```

Open http://localhost:5173 and use the dropdown at the top right to log in as a demo user.

### Environment variables (`server/.env`)

| Name | Example | Notes |
|---|---|---|
| `PORT` | `5000` | API port. The Vite proxy expects 5000. |
| `MONGODB_URI` | `mongodb://localhost:27017/nakkashii` | Any MongoDB connection string. |
| `JWT_SECRET` | random 64 char hex | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin. Not needed in dev since Vite proxies `/api`. |

### Demo data

`npm run seed` creates 3 users and 5 products. **It deletes and recreates all products of the two demo sellers on every run.**

| User | Email |
|---|---|
| Buyer | `buyer@nakkashii.test` |
| Seller 1 | `seller1@nakkashii.test` |
| Seller 2 | `seller2@nakkashii.test` |

| Product | Seller | Shows |
|---|---|---|
| Classic Cotton Tee | 1 | Colour x Size. Navy / L doesn't exist, Black / S is out of stock |
| Slim Fit Jeans | 1 | Fit x Waist, different price per fit, one variant marked unavailable |
| Graphic Print T-shirt | 2 | Single attribute (Size), XL out of stock |
| Leather Biker Jacket | 2 | Single variant product, no picker |
| Denim Jacket | 2 | Every variant sold out |

### Images

Stored on local disk in `server/uploads/` (gitignored) and served at `/uploads/<file>`. Max 5 files per upload, 2 MB each, images only. Seeded products have no images, upload some from the seller edit page.

## Tests

```bash
cd server && npm test    # 26 tests
cd web && npm test       # 9 tests
```

Both use Node's built in test runner. Server tests use `mongodb-memory-server`, so no database is needed (first run downloads a MongoDB binary, about 100 MB).

**Covered**
- Variant rules: combination key, duplicate combination / SKU (case insensitive), missing or extra attribute
- Stock: purchase, out of stock, more than stock, unavailable flag, stock never below 0
- Concurrency: 25 parallel buyers on 10 items -> exactly 10 succeed; 20 parallel restocks -> no lost update
- Authorization: JWT checks (missing, wrong secret, `alg: none`), role check, another seller blocked on read / update / stock / delete
- Integration (`tests/api.test.js`): full flow through real routes with supertest, plus the error response shape
- Frontend variant resolution: matching, missing / partial selection, crossed out options, default selection

**Not covered:** image upload / delete, React components, cart checkout UI.

## API

Base URL `http://localhost:5000/api`. All bodies are JSON (except image upload).

### Auth (stubbed)

Login is a stub, see [NOTES.md](NOTES.md#auth-is-stubbed). Protected routes need `Authorization: Bearer <token>`. The seller is always taken from the token, never from the request body.

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/auth/dev-login` | - | `{ "email": "seller1@nakkashii.test" }` | `200 { token, user: { id, name, email, role } }` |
| GET | `/auth/me` | any | - | `200 { sub, role, iat, exp }` |

### Storefront (public)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/products` | - | - | `200 [Product]` |
| GET | `/products/:id` | - | - | `200 Product` |
| POST | `/products/:id/variants/:variantId/purchase` | any | `{ "quantity": 2 }` (1-20, default 1) | `200 Product` with updated stock, `409` if not enough stock or unavailable |

### Seller (role `seller`, own products only)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/seller/products` | - | `200 [Product]` (only yours) |
| POST | `/seller/products` | create body below | `201 Product` |
| GET | `/seller/products/:id` | - | `200 Product` |
| PATCH | `/seller/products/:id` | `{ name?, description?, category? }` | `200 Product` |
| DELETE | `/seller/products/:id` | - | `204` |
| POST | `/seller/products/:id/variants` | variant body below | `201 Product` |
| PATCH | `/seller/products/:id/variants/:variantId` | `{ sku?, options?, price?, isAvailable? }` | `200 Product` |
| DELETE | `/seller/products/:id/variants/:variantId` | - | `200 Product` (can't delete the last variant) |
| PATCH | `/seller/products/:id/variants/:variantId/stock` | `{ "change": -3 }` (non zero integer) | `200 Product`, `409` if stock would go below 0 |
| POST | `/seller/products/:id/variants/:variantId/images` | `multipart/form-data`, field `images` (1-5 files) | `201 Product` |
| DELETE | `/seller/products/:id/variants/:variantId/images/:imageId` | - | `200 Product` |

Another seller's product returns `403` on every seller route.

**Create product body**

```json
{
  "name": "Classic Cotton Tee",
  "description": "Everyday crew neck tee",
  "category": "T-shirts",
  "attributes": ["Colour", "Size"],
  "variants": [
    {
      "sku": "TEE-WHT-M",
      "options": [{ "name": "Colour", "value": "White" }, { "name": "Size", "value": "M" }],
      "price": 499,
      "stock": 20,
      "isAvailable": true
    }
  ]
}
```

- `attributes`: 0-3 unique names. Empty means a single variant product.
- Every variant needs exactly one option per attribute. `stock` and `isAvailable` are optional (default `0` / `true`).
- Unknown fields like `sellerId` are dropped.
- Attributes can't be changed after create (see NOTES).

**Product response**

```json
{
  "_id": "...",
  "sellerId": "...",
  "name": "Classic Cotton Tee",
  "description": "...",
  "category": "T-shirts",
  "attributes": ["Colour", "Size"],
  "variants": [
    {
      "_id": "...",
      "sku": "TEE-WHT-M",
      "options": [{ "name": "Colour", "value": "White" }, { "name": "Size", "value": "M" }],
      "combinationKey": "colour:white|size:m",
      "price": 499,
      "stock": 20,
      "isAvailable": true,
      "imageUrls": [{ "_id": "...", "url": "/uploads/1700000000-ab12cd34.jpg", "filename": "1700000000-ab12cd34.jpg" }]
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

Success responses are wrapped as `{ "success": true, "data": ... }`.

### Errors

Every error has the same shape:

```json
{
  "success": false,
  "message": "Duplicate variant: colour:red|size:m",
  "code": "CONFLICT",
  "details": null
}
```

| Status | `code` | When |
|---|---|---|
| 400 | `INVALID_ID_FORMAT` | `:id` is not a valid ObjectId |
| 400 | `BAD_REQUEST` | Malformed JSON body |
| 400 | `UPLOAD_ERROR` | File too big / too many files |
| 400 | `VALIDATION_ERROR` | Rejected by the Mongoose schema |
| 401 | `UNAUTHORIZED` | Missing, invalid or expired token |
| 403 | `FORBIDDEN` | Wrong role, or not your product |
| 404 | `NOT_FOUND` | Product, variant, image, user or route not found |
| 409 | `CONFLICT` | Duplicate combination / SKU in a product, not enough stock, concurrent edit |
| 409 | `DUPLICATE_KEY_ERROR` | SKU already used by another product |
| 422 | `VALIDATION_ERROR` | Request body failed validation. `details` is `[{ field, message }]` |
| 500 | `INTERNAL_SERVER_ERROR` | Anything unexpected (logged on the server, no internals sent) |

## Project structure

```
server/src
  app.js               express app (routes, middleware)
  server.js            connects to mongo and starts listening
  routes/              url -> middleware -> controller
  controllers/         read req, call service, send res
  services/            business logic, ownership checks, stock updates
  models/              mongoose schemas
  validators/          zod request schemas
  middleware/          auth, requireRole, validate, errorHandler
  utils/               error classes, combination key, variant rules
  seed.js
server/tests           node:test + supertest

web/src
  pages/               Shop, Product, Cart, seller pages
  components/          VariantPicker, VariantFields, VariantEditor, ...
  context/             auth (demo login) and cart
  utils/variants.js    variant resolution (tested)
  api.js               fetch wrapper
```
