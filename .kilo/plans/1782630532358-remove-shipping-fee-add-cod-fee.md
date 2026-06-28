# Remove Shipping Fee from Checkout Total; Add Configurable Cash Shipping Fee

## Goal
- Remove the automatic ₱100 shipping fee from checkout total computation.
- Add a configurable `shippingFee` field per order that the admin sets.
- Admin notifies customer of cash shipping fee via order tracking/tracking info.
- Customer sees shipping fee on their order card when status is confirmed or later.

## Changes

### 1. checkout.js
- Remove the line that hardcodes `shippingFee: 100` and adds it to the total.
- Set `shippingFee: 0` in the order data.
- Set `total` equal to `subtotal` only.

### 2. admin_orders.html
- Add a new row in the order details modal after the tracking-info textarea:
  - Label: "Shipping Fee (Cash on Delivery):"
  - Number input with `id="shippingFeeInput"`, type `number`, min `0`, step `1`, default value `0`.
- Import `updateDoc`, `doc`, `serverTimestamp` inline in the script (alongside existing save-tracking logic).
- Wire the existing save flow (or add a small Save block) to also persist:
  - `shippingFee: Number(shippingFeeInput.value)` on the order document.

### 3. order_tracking.js
- In `renderOrderCard()`, after Payment Method, add:
  - If `order.shippingFee > 0`, render: `<p><strong>Shipping Fee (Cash on Delivery):</strong> ₱${order.shippingFee.toLocaleString()}</p>`
- This should display for all statuses (not just confirmed), since the fee is simply informational.

### 4. CSS (order_tracking_style.css)
- No new CSS required unless styling is desired; existing `.order-content p strong` styles already cover it.

## Validation
1. Place a new order → confirm `shippingFee` is 0 and `total` equals `subtotal`.
2. Open existing order in admin modal → update `shippingFee` to e.g. 150, save, refresh, confirm Firestore value updated.
3. Open customer order tracking → confirm "Shipping Fee (Cash on Delivery)" row appears with correct amount.
4. Set `shippingFee` back to 0 → confirm row disappears on customer page.
