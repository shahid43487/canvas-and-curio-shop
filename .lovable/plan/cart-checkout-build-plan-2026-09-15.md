# Cart + Checkout Build Plan

## Goal
Turn SMOL STUUF into a real, backend-backed shop where guests can add items to a cart, check out with cash-on-delivery or bKash, and place orders that decrement live stock.

## What will change

### 1. Database (Lovable Cloud)
- **products** table: move the 6 products from the static file into the DB with stock counts.
- **orders** table: guest orders with shipping details, payment method, payment status, and order status.
- **order_items** table: line items linked to orders and products.
- RLS + grants: products are publicly readable; orders/order_items are only readable via secure server functions (guests use order ID + phone for lookup).

### 2. Server functions
- `listProducts()` — public catalog fetch.
- `getProduct(id)` — public single product fetch.
- `createOrder(...)` — validates stock, atomically inserts order + items, decrements product stock.
- `getOrder(id, phone)` — secure order lookup for the confirmation page.

### 3. Cart state
- Client-side React context + localStorage.
- Persists across reloads; survives until the browser clears storage.
- Each item stores product id, name, price, and quantity.

### 4. UI
- **Cart sheet** (slide-out drawer) opened from the header cart button, showing items, quantities, remove controls, and a "Checkout" button.
- **ProductCard** — add a small "Add" button on hover / click that triggers the sticker burst and adds to cart.
- **Product page** — "Add to cart" becomes functional with a quantity stepper.
- **Checkout page** (`/checkout`) — order summary, shipping form, payment method selector (COD / bKash), bKash transaction-id field, submit button.
- **Order confirmation page** (`/order/$id`) — thank you message, order summary, shipping details, status.
- **Header** — cart button now shows live item count.

### 5. Styling
- New CSS sections for the cart sheet, checkout form, and confirmation page using existing SMOL tokens (paper, ink, red, rounded pill buttons, sticker animations).
- All interactive buttons keep the springy burst effect.

### 6. Stock behavior
- Adding to cart does **not** reserve stock.
- Placing an order checks current stock and fails clearly if an item sold out between add-to-cart and checkout.
- Successful order decrements stock in the same DB transaction.

## Out of scope for this pass
- Account creation / login.
- Admin dashboard for viewing orders (orders live in the database; a dashboard can be added later).
- Live payment gateway integration (bKash is recorded as a manual payment to be verified before shipping).

## Pages / routes added or updated
- `/shop`, `/`, `/product/$id` — updated to read products from the backend.
- `/checkout` — new.
- `/order/$id` — new.
