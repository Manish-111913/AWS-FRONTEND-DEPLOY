# Table Color Debugging Notes

The OwnerDashboard now sources table colors from `/api/orders/by-table`.

Server logic (authoritative):
- ash: no active session (table not scanned / session ended)
- yellow: active session with either unpaid orders OR zero orders (and session not marked paid)
- green: all orders for the session are paid OR session itself is marked paid (covers pay-first + zero-order edge)

Client safety net:
If backend returns `yellow` but `orders_count > 0` and `unpaid_count == 0`, the dashboard coerces the color to `green`.

To inspect raw data quickly in the browser console:
```js
fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/orders/by-table?businessId=1&debug=1`).then(r=>r.json()).then(j=>console.table(j.tables.map(t=>({table:t.table_number,color:t.color,reason:t.colorReason,orders:t.orders_count,unpaid:t.unpaid_count,session:t.session_id}))))
```

If a table expected to be green is yellow:
1. Confirm the correct `businessId` is being used (compare to QR scans / order creation).
2. Check that the table's `current_session_id` matches the session id of the paid orders.
3. Verify no order has `payment_status` other than `paid` (look for stray whitespace).
4. Confirm the session row's `payment_status` is 'paid' if using pay-first model with zero orders.
5. Use `/api/orders/debug-latest?businessId=1` to correlate `dining_session_id` with table numbers.

Add `&debug=1` to the by-table endpoint for `order_statuses` array when diagnosing mixed states.
