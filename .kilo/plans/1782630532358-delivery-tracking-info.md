# Delivery Tracking Info Feature

## Goal
Allow admins to add freeform tracking/delivery information to orders, and show that info to customers on their order tracking page.

## Approach
**Option A (chosen):** Single `trackingInfo` text field on the order document. Admin pastes whatever they want — links, tracking numbers, courier name, notes. Customer sees it as a plain text block.

## Changes

### 1. Admin — Order Details Modal (`admin_orders.html`)
Add a tracking info section inside the order details modal, after the proof-of-payment section and before the items table:
- Label: "Delivery Tracking Info"
- Textarea with placeholder: "Paste tracking links, courier info, Lalamove/J&T order ID, or delivery notes here..."
- "Save Tracking Info" button
- Styling: matches existing modal table layout (bg `#f5f0e8` label, white value area)

### 2. Admin — Save Logic (`admin_orders.js`)
Add a button listener for the new "Save Tracking Info" button:
- Reads textarea value
- Updates the order document: `doc(db, "orders", orderId)` with `{ trackingInfo: value, updatedAt: serverTimestamp() }`
- Shows success/error alert
- Re-fetches order data to refresh the modal display

### 3. Customer — Order Card Display (`order_tracking.js`)
In `renderOrderCard()`, add a tracking info section after payment details:
```
${order.trackingInfo ? `
    <div class="tracking-info-section">
        <strong>Delivery Tracking:</strong>
        <p class="tracking-info-text">${escapeHtml(order.trackingInfo)}</p>
    </div>
` : ''}
```
- Use a simple text escape function to prevent HTML injection while still rendering URLs
- Render newlines as `<br>`
- Do NOT auto-link URLs (admin controls formatting, customer just reads)

### 4. CSS (`order_tracking_style.css`)
Add styles for the new tracking section:
```css
.tracking-info-section {
    margin-top: 10px;
    margin-bottom: 10px;
    padding: 12px;
    background: #fffef8;
    border: 1px solid #dad6c2;
    border-radius: 5px;
}
.tracking-info-section strong {
    color: #5c491f;
    display: block;
    margin-bottom: 6px;
}
.tracking-info-text {
    color: #3a382f;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 14px;
}
```

### 5. No database migration needed
Firestore is schemaless. New orders simply won't have `trackingInfo` until the admin adds it. Existing orders remain unaffected.

## Edge Cases
- **Empty tracking info:** Field is `null` or empty string → customer sees nothing
- **Long text:** `white-space: pre-wrap; word-break: break-word` handles it
- **URLs in text:** Rendered as plain text (not clickable links) to avoid confusion if admin includes non-link context. Admin can use full URLs; customer can copy-paste.
- **Cancelled orders:** Tracking info still visible if set
- **Security:** `escapeHtml()` prevents XSS from stored tracking info

## Files Modified
- `wanderlust_main/html/admin_orders.html`
- `wanderlust_main/js/admin_orders.js`
- `wanderlust_main/js/order_tracking.js`
- `wanderlust_main/css/order_tracking_style.css`
