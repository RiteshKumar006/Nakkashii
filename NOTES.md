# Notes

What I built, the choices I made, and what I left out. I went for a correct and tested vertical slice rather than covering everything.

## Assumptions

- A product has 0-3 attributes (e.g. Colour, Size). A variant has exactly one value for each attribute. 0 attributes means a single variant product.
- Attribute names and values are compared case insensitively. "Red / M" and "red / m" are the same variant.
- SKUs are unique across the whole marketplace, not just inside one product.
- A variant can be bought only if `isAvailable` is true **and** `stock > 0`. The flag lets a seller pause a variant without losing its stock count.
- Prices are whole rupee amounts stored as numbers. There's no currency field.

## Data model

**Variants are embedded in the product document**, not a separate collection.

Why:
- The buyer page always needs the product with all its variants. Embedded means one read and no joins.
- Duplicate combination checks and ownership checks happen on one document.
- MongoDB updates on a single document are atomic, so the stock update can be one conditional `$inc` (see concurrency below).
- A product realistically has tens of variants, far below the 16 MB document limit.

Trade-offs:
- You can't easily query or page through variants on their own (e.g. "all variants low on stock across all products").
- Every variant change rewrites the product's `updatedAt`, and a save touches the whole product.
- If products ever had thousands of variants, I'd move variants to their own collection with a `productId` index.

**How a combination is stored**
- `options: [{ name, value }]` is the source of truth. It's an array, not a Map, so the order is kept for display and it's easy to validate with Zod.
- `combinationKey` (e.g. `colour:red|size:m`) is derived from `options`: lowercased and sorted by attribute name. It's built in a `pre("validate")` hook, so the client can never set it and it can't drift from `options`. That makes it easy to compare two variants for duplicates.

## Edge cases

| Edge case | How it's handled |
|---|---|
| Out of stock can't be bought | The purchase update only matches a variant with `isAvailable: true` and `stock >= quantity`, otherwise 409. In the UI, out of stock variants are crossed out, show a badge, and "Add to cart" is disabled. The seller list shows an "N out of stock" badge. |
| Invalid selection | Frontend: a combination with no variant shows "This combination isn't available" and can't be added. Backend: you can only buy by `variantId`, and an unknown id gives 404. |
| Duplicate variants | Same combination or same SKU inside one product → 409 from `checkVariants` (`utils/variantRules.js`). Same SKU in another product → 409 from a unique index on `variants.sku`. Both are case insensitive. |
| Seller authorization | The seller id always comes from the JWT (`req.user.sub`). A `sellerId` in the body is dropped by Zod. Every seller route loads the product and checks `product.sellerId` against the token, otherwise 403. Buyers get 403 on all seller routes. |
| Concurrent stock updates | See below. Tested with 25 parallel purchases on 10 items (exactly 10 succeed) and 20 parallel restocks (no lost update). |

I return **403** (not 404) when a seller opens another seller's product. That tells them the product exists, but the storefront already shows every product publicly, so nothing new leaks, and 403 is clearer while debugging.

## Concurrency

**Stock** is never read, changed in JS, and saved back. Purchases and stock adjustments are one atomic update with the condition built into the filter:

```js
Product.findOneAndUpdate(
  { _id, variants: { $elemMatch: { _id: variantId, isAvailable: true, stock: { $gte: quantity } } } },
  { $inc: { "variants.$.stock": -quantity } }
)
```

If two requests race for the last item, MongoDB applies them one after another. The second one no longer matches the filter, so it gets 409 instead of overselling. Restocks are `$inc` too, so parallel restocks add up and none are lost. If nothing matched, the service reloads the product only to choose the right error (404, 403 or 409).

**Stock can't be set through the normal variant edit.** `PATCH .../variants/:id` rejects a `stock` field (422). The only way to change stock is the `.../stock` endpoint, which takes a relative `change`, not an absolute value. An absolute "set stock to 5" would overwrite a purchase that happened at the same moment.

**Other edits** (name, price, SKU, adding or removing variants) use a normal document save with Mongoose `optimisticConcurrency`. If two saves on the same product race, the second fails with a version error, which is returned as 409 "reload and try again".

## Auth is stubbed

The brief allows it, so there's no password or real login.

- `POST /api/auth/dev-login { email }` returns a real signed JWT (HS256, 1 day) for a seeded user.
- The frontend has a "log in as" dropdown with the 3 demo users.
- Everything after login is real: `authMiddleware` verifies the token and pins the algorithm, `requireRole("seller")` checks the role, and the services check ownership.

**Where real auth plugs in:** only `devLogin()` in `server/src/services/auth.service.js` would change. It would check a password hash (bcrypt) or an OAuth provider, then call the same `signToken(user)`. Middleware, routes and ownership checks stay the same. `dev-login` must never be enabled in production.

## Images

Stored on local disk in `server/uploads/` with random file names and served by `express.static`. multer allows images only, 2 MB each, max 5 per request. If the request fails after the upload (e.g. not your product), the files are deleted again. Deleting an image, variant or product also deletes the files, as a best effort after the database change.

For production I'd use S3 or similar with signed upload URLs, so files don't go through the API server and survive redeploys.

## Cart and checkout

- The cart is kept in the browser (localStorage), one cart per user. Switching account switches cart.
- Checkout calls the purchase endpoint once per cart item. If one item has sold out in the meantime, that item fails with the server's message and stays in the cart, and the others go through.
- There is no orders collection. A purchase only lowers stock.

## What I cut, and known limitations

- **Orders, payment, order history.** "Purchase" only decrements stock.
- **Checkout isn't all-or-nothing.** Each item is a separate request, so a cart can partly succeed. A real version would create an order inside a MongoDB transaction, or reserve stock first.
- **Attributes can't change after a product is created.** Adding "Material" to an existing product would make every existing variant invalid. The UI and API block it, and a seller would create a new product.
- **The guest cart isn't merged** into the account cart when you log in.
- **No pagination, search or category filter** on the shop.
- **Sellers can buy products,** including their own. There's no rule against it.
- **No image reordering** and no "main image" per product. The card uses the first image found.
- **No React component tests.** Variant resolution logic is tested, but the UI was only checked manually and with a headless browser run.
- **Mongoose `ValidationError` returns 400** while Zod errors return 422. Both have the same response shape, but the status is inconsistent.

## What I'd do next

1. An orders collection with a transactional checkout (or stock reservation with a timeout) so a cart is all-or-nothing.
2. Real auth (password + refresh tokens, or OAuth) in place of `dev-login`.
3. Image storage on S3 with signed uploads, image reordering, and a main image per product.
4. Pagination, search and filters on the shop.
5. React Testing Library tests for `VariantPicker` and the product page, plus a Playwright end-to-end test of create → buy.
6. A low stock view for sellers and an audit log of stock changes.
