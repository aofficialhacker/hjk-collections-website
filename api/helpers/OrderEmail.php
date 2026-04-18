<?php

class OrderEmail
{
    /**
     * Send order confirmation to customer and admin
     */
    public static function sendConfirmation($db, $orderId)
    {
        try {
            // Fetch order details
            $stmt = $db->prepare('SELECT o.*, u.first_name, u.last_name, u.email AS user_email, u.phone AS user_phone FROM hjk_orders o JOIN hjk_users u ON o.user_id = u.id WHERE o.id = ?');
            $stmt->execute([$orderId]);
            $order = $stmt->fetch();
            if (!$order) return false;

            // Fetch order items
            $itemsStmt = $db->prepare('SELECT * FROM hjk_order_items WHERE order_id = ?');
            $itemsStmt->execute([$orderId]);
            $items = $itemsStmt->fetchAll();

            // Fetch shipping address
            $addrStmt = $db->prepare('SELECT * FROM hjk_shipping_addresses WHERE order_id = ?');
            $addrStmt->execute([$orderId]);
            $address = $addrStmt->fetch();

            $customerName = trim($order['first_name'] . ' ' . $order['last_name']);
            $appUrl = Env::get('APP_URL', 'https://hjkcollections.com');

            // Send to customer
            $customerHtml = self::buildCustomerEmail($order, $items, $address, $customerName, $appUrl);
            $mailer = new Mailer();
            $mailer->send($order['user_email'], 'Order Confirmed - ' . $order['order_number'], $customerHtml);

            // Send to admin
            $adminEmail = Env::get('ADMIN_EMAIL');
            if ($adminEmail) {
                $adminHtml = self::buildAdminEmail($order, $items, $address, $customerName, $appUrl);
                $mailer->send($adminEmail, 'New Order Received - ' . $order['order_number'], $adminHtml);
            }

            return true;
        } catch (Exception $e) {
            error_log('OrderEmail: ' . $e->getMessage());
            return false;
        }
    }

    private static function formatPrice($amount)
    {
        return '₹' . number_format((float)$amount, 0);
    }

    private static function buildCustomerEmail($order, $items, $address, $customerName, $appUrl)
    {
        $itemsHtml = '';
        foreach ($items as $item) {
            $itemsHtml .= '
            <tr>
                <td style="padding:12px;border-bottom:1px solid #eee;">
                    <strong>' . htmlspecialchars($item['product_name']) . '</strong><br>
                    <span style="color:#888;font-size:13px;">' . htmlspecialchars($item['color']) . ' | ' . htmlspecialchars($item['size']) . ' x ' . $item['quantity'] . '</span>
                </td>
                <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">' . self::formatPrice($item['total_price']) . '</td>
            </tr>';
        }

        $shippingText = $order['shipping_cost'] > 0 ? self::formatPrice($order['shipping_cost']) : '<span style="color:#28a745;">FREE</span>';
        $discountRow = $order['discount'] > 0 ? '
            <tr><td style="padding:8px 12px;color:#28a745;">Discount' . ($order['coupon_code'] ? ' (' . htmlspecialchars($order['coupon_code']) . ')' : '') . '</td><td style="padding:8px 12px;text-align:right;color:#28a745;">-' . self::formatPrice($order['discount']) . '</td></tr>' : '';

        $addressHtml = $address ? htmlspecialchars($address['full_name']) . '<br>' . htmlspecialchars($address['address_line1']) . ($address['address_line2'] ? ', ' . htmlspecialchars($address['address_line2']) : '') . '<br>' . htmlspecialchars($address['city']) . ', ' . htmlspecialchars($address['state']) . ' - ' . htmlspecialchars($address['pincode']) . '<br>Phone: ' . htmlspecialchars($address['phone']) : '';

        $estimatedDelivery = $order['estimated_delivery'] ? date('d M Y', strtotime($order['estimated_delivery'])) : '';

        return self::wrapInLayout('
            <h2 style="color:#1A1A2E;margin:0 0 5px;">Thank You for Your Order!</h2>
            <p style="color:#666;margin:0 0 25px;">Hi ' . htmlspecialchars($customerName) . ', your order has been placed successfully.</p>

            <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:20px;">
                <table width="100%" style="margin-bottom:10px;"><tr>
                    <td><span style="color:#888;font-size:13px;">Order Number</span><br><strong style="font-size:16px;">' . htmlspecialchars($order['order_number']) . '</strong></td>
                    <td style="text-align:right;"><span style="color:#888;font-size:13px;">Date</span><br><strong>' . date('d M Y', strtotime($order['created_at'])) . '</strong></td>
                </tr></table>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <thead><tr style="background:#1A1A2E;color:#fff;"><th style="padding:10px 12px;text-align:left;border-radius:6px 0 0 0;">Item</th><th style="padding:10px 12px;text-align:right;border-radius:0 6px 0 0;">Amount</th></tr></thead>
                <tbody>' . $itemsHtml . '</tbody>
                <tfoot>
                    <tr><td style="padding:8px 12px;">Subtotal</td><td style="padding:8px 12px;text-align:right;">' . self::formatPrice($order['subtotal']) . '</td></tr>
                    ' . $discountRow . '
                    <tr><td style="padding:8px 12px;">Shipping</td><td style="padding:8px 12px;text-align:right;">' . $shippingText . '</td></tr>
                    <tr style="border-top:2px solid #1A1A2E;"><td style="padding:12px;font-weight:700;font-size:16px;">Total Paid</td><td style="padding:12px;text-align:right;font-weight:700;font-size:16px;">' . self::formatPrice($order['total_amount']) . '</td></tr>
                </tfoot>
            </table>

            <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:20px;">
                <h3 style="margin:0 0 10px;color:#1A1A2E;font-size:15px;">Shipping Address</h3>
                <p style="margin:0;color:#555;line-height:1.6;">' . $addressHtml . '</p>
                ' . ($estimatedDelivery ? '<p style="margin:10px 0 0;color:#C9A96E;font-size:13px;">Estimated delivery by <strong>' . $estimatedDelivery . '</strong></p>' : '') . '
            </div>

            <div style="text-align:center;margin:25px 0;">
                <a href="' . $appUrl . '/profile/orders.html" style="display:inline-block;background:#1A1A2E;color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:600;">View My Orders</a>
            </div>
        ');
    }

    private static function buildAdminEmail($order, $items, $address, $customerName, $appUrl)
    {
        $itemsHtml = '';
        foreach ($items as $item) {
            $itemsHtml .= '
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;">' . htmlspecialchars($item['product_name']) . '</td>
                <td style="padding:10px;border-bottom:1px solid #eee;">' . htmlspecialchars($item['color']) . ' / ' . htmlspecialchars($item['size']) . '</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">' . $item['quantity'] . '</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">' . self::formatPrice($item['total_price']) . '</td>
            </tr>';
        }

        $addressHtml = $address ? htmlspecialchars($address['full_name']) . '<br>' . htmlspecialchars($address['address_line1']) . ($address['address_line2'] ? ', ' . htmlspecialchars($address['address_line2']) : '') . '<br>' . htmlspecialchars($address['city']) . ', ' . htmlspecialchars($address['state']) . ' - ' . htmlspecialchars($address['pincode']) . '<br>Phone: ' . htmlspecialchars($address['phone']) : '';

        return self::wrapInLayout('
            <h2 style="color:#1A1A2E;margin:0 0 5px;">New Order Received!</h2>
            <p style="color:#666;margin:0 0 25px;">A new order has been placed by <strong>' . htmlspecialchars($customerName) . '</strong></p>

            <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:20px;">
                <table width="100%"><tr>
                    <td><span style="color:#888;font-size:13px;">Order Number</span><br><strong style="font-size:16px;">' . htmlspecialchars($order['order_number']) . '</strong></td>
                    <td style="text-align:center;"><span style="color:#888;font-size:13px;">Payment</span><br><strong style="color:#28a745;">PAID</strong></td>
                    <td style="text-align:right;"><span style="color:#888;font-size:13px;">Amount</span><br><strong style="font-size:16px;">' . self::formatPrice($order['total_amount']) . '</strong></td>
                </tr></table>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <thead><tr style="background:#1A1A2E;color:#fff;">
                    <th style="padding:10px;text-align:left;border-radius:6px 0 0 0;">Product</th>
                    <th style="padding:10px;text-align:left;">Variant</th>
                    <th style="padding:10px;text-align:center;">Qty</th>
                    <th style="padding:10px;text-align:right;border-radius:0 6px 0 0;">Amount</th>
                </tr></thead>
                <tbody>' . $itemsHtml . '</tbody>
                <tfoot>
                    <tr><td colspan="3" style="padding:8px 10px;">Subtotal</td><td style="padding:8px 10px;text-align:right;">' . self::formatPrice($order['subtotal']) . '</td></tr>
                    ' . ($order['discount'] > 0 ? '<tr><td colspan="3" style="padding:8px 10px;color:#28a745;">Discount (' . htmlspecialchars($order['coupon_code']) . ')</td><td style="padding:8px 10px;text-align:right;color:#28a745;">-' . self::formatPrice($order['discount']) . '</td></tr>' : '') . '
                    <tr><td colspan="3" style="padding:8px 10px;">Shipping</td><td style="padding:8px 10px;text-align:right;">' . ($order['shipping_cost'] > 0 ? self::formatPrice($order['shipping_cost']) : 'FREE') . '</td></tr>
                    <tr style="border-top:2px solid #1A1A2E;"><td colspan="3" style="padding:12px 10px;font-weight:700;font-size:16px;">Total</td><td style="padding:12px 10px;text-align:right;font-weight:700;font-size:16px;">' . self::formatPrice($order['total_amount']) . '</td></tr>
                </tfoot>
            </table>

            <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:20px;">
                <h3 style="margin:0 0 10px;color:#1A1A2E;font-size:15px;">Customer Details</h3>
                <p style="margin:0;color:#555;line-height:1.6;">
                    <strong>' . htmlspecialchars($customerName) . '</strong><br>
                    Email: ' . htmlspecialchars($order['user_email']) . '<br>
                    Phone: ' . htmlspecialchars($order['user_phone']) . '
                </p>
            </div>

            <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:20px;">
                <h3 style="margin:0 0 10px;color:#1A1A2E;font-size:15px;">Shipping Address</h3>
                <p style="margin:0;color:#555;line-height:1.6;">' . $addressHtml . '</p>
            </div>

            <div style="text-align:center;margin:25px 0;">
                <a href="' . $appUrl . '/admin/orders/index.html" style="display:inline-block;background:#C9A96E;color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:600;">View in Admin Panel</a>
            </div>
        ');
    }

    private static function wrapInLayout($content)
    {
        $appUrl = rtrim(Env::get('APP_URL', ''), '/');
        $logoUrl = $appUrl . '/assets/logo/hjklogo.webp';
        return '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr><td style="background:#1A1A2E;padding:20px;text-align:center;">
                    <img src="' . $logoUrl . '" alt="HJK Collections" style="height:60px;width:auto;display:inline-block;background:#fff;padding:6px 10px;border-radius:8px;">
                </td></tr>
                <!-- Body -->
                <tr><td style="padding:30px;">' . $content . '</td></tr>
                <!-- Footer -->
                <tr><td style="background:#f8f8f8;padding:20px;text-align:center;border-top:1px solid #eee;">
                    <p style="margin:0 0 5px;color:#888;font-size:12px;">HJK Collections - Premium Bags</p>
                    <p style="margin:0;color:#aaa;font-size:11px;">C 102/104, Tirtham Society, Behind Rustom Baug, Irani road, Dahanu Road West, Palghar, Maharashtra, India - 401602</p>
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>';
    }
}
