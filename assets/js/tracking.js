/* ============================================
   HJKCollections - Order Tracking Logic
   ============================================ */

const HJKTracking = {
    init() {
        this.render();
    },

    render() {
        const container = document.getElementById('trackingContent');
        if (!container) return;

        container.innerHTML = `
            <div class="content-card" style="max-width:700px;margin:0 auto">
                <div class="text-center mb-4">
                    <div style="width:70px;height:70px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
                        <i class="fa-solid fa-truck-fast" style="font-size:28px;color:var(--primary)"></i>
                    </div>
                    <h4 class="font-heading">Track Your Order</h4>
                    <p class="text-muted" style="font-size:0.9rem">Enter your order number to check the delivery status</p>
                </div>

                <form onsubmit="HJKTracking.trackOrder(event)" class="mb-4">
                    <div class="d-flex gap-3">
                        <input type="text" class="form-control-custom flex-grow-1" id="trackingInput" placeholder="Enter Order Number (e.g., HJK-20260115-001)" required>
                        <button type="submit" class="btn-primary-custom" style="white-space:nowrap"><i class="fa-solid fa-magnifying-glass"></i> Track</button>
                    </div>
                </form>

                <div id="trackingResult"></div>
            </div>`;
    },

    trackOrder(e) {
        e.preventDefault();
        const orderNumber = document.getElementById('trackingInput').value.trim().toUpperCase();
        const resultDiv = document.getElementById('trackingResult');

        if (!orderNumber) {
            HJKComponents.showToast('Please enter an order number', 'error');
            return;
        }

        const orders = HJKUtils.store.get('hjk_orders') || [];
        const order = orders.find(o => o.orderNumber.toUpperCase() === orderNumber);

        if (!order) {
            resultDiv.innerHTML = `
                <div class="text-center py-4">
                    <i class="fa-solid fa-circle-exclamation" style="font-size:48px;color:var(--danger);margin-bottom:16px"></i>
                    <h5>Order Not Found</h5>
                    <p class="text-muted" style="font-size:0.9rem">No order found with number <strong>${HJKUtils.escapeHtml ? HJKUtils.escapeHtml(orderNumber) : orderNumber}</strong>. Please check and try again.</p>
                </div>`;
            return;
        }

        const allStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
        const isCancelled = order.orderStatus === 'cancelled';
        const isReturned = ['return_requested', 'return_approved', 'returned', 'refunded'].includes(order.orderStatus);
        const currentIdx = allStatuses.indexOf(order.orderStatus);

        resultDiv.innerHTML = `
            <div class="divider"></div>

            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h5 class="mb-1">Order ${order.orderNumber}</h5>
                    <span class="text-muted" style="font-size:0.85rem">Placed on ${HJKUtils.formatDate(order.createdAt)}</span>
                </div>
                <div>${HJKUtils.getStatusBadge(order.orderStatus)}</div>
            </div>

            ${!isCancelled && !isReturned ? `
            <div class="status-timeline mb-4">
                ${allStatuses.map((s, i) => {
                    let cls = i < currentIdx ? 'completed' : i === currentIdx ? 'active' : '';
                    const icons = {
                        placed: 'fa-receipt',
                        confirmed: 'fa-check',
                        processing: 'fa-gear',
                        shipped: 'fa-truck',
                        out_for_delivery: 'fa-truck-fast',
                        delivered: 'fa-circle-check'
                    };
                    return `<div class="timeline-step ${cls}">
                        <div class="timeline-icon"><i class="fa-solid ${icons[s]}"></i></div>
                        <span class="timeline-label">${s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                    </div>`;
                }).join('')}
            </div>` : ''}

            ${isCancelled ? `
            <div class="alert" style="background:#fff5f5;border:1px solid var(--danger);border-radius:var(--radius-md);padding:14px;margin-bottom:20px">
                <p class="mb-0" style="font-size:0.88rem;color:var(--danger)"><i class="fa-solid fa-circle-xmark me-2"></i>This order has been cancelled. Refund will be processed within 5-7 business days.</p>
            </div>` : ''}

            ${isReturned ? `
            <div class="alert" style="background:var(--warning-light);border:1px solid var(--warning);border-radius:var(--radius-md);padding:14px;margin-bottom:20px">
                <p class="mb-0" style="font-size:0.88rem;color:var(--warning)"><i class="fa-solid fa-rotate-left me-2"></i>Return Status: ${order.orderStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
            </div>` : ''}

            <!-- Status History -->
            <h6 class="font-heading mb-3">Status History</h6>
            <div class="mb-4">
                ${(order.statusHistory || []).slice().reverse().map(h => `
                    <div class="d-flex gap-3 mb-2 pb-2" style="border-bottom:1px solid var(--border)">
                        <div style="min-width:140px;font-size:0.82rem;color:var(--text-muted)">${HJKUtils.formatDateTime(h.timestamp)}</div>
                        <div>
                            <span style="font-weight:600;font-size:0.88rem">${h.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                            ${h.note ? `<div style="font-size:0.82rem;color:var(--text-muted)">${h.note}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Order Items -->
            <h6 class="font-heading mb-3">Order Items</h6>
            ${order.items.map(item => `
                <div class="d-flex gap-3 mb-3 align-items-center">
                    <img src="${item.image}" style="width:50px;height:50px;object-fit:cover;border-radius:var(--radius-sm)">
                    <div class="flex-grow-1">
                        <div style="font-weight:600;font-size:0.88rem">${item.productName}</div>
                        <div style="font-size:0.78rem;color:var(--text-muted)">${item.color} | ${item.size} x ${item.quantity}</div>
                    </div>
                    <div style="font-weight:600">${HJKUtils.formatPrice(item.totalPrice)}</div>
                </div>
            `).join('')}

            <div class="divider"></div>

            <!-- Delivery Info -->
            <div class="row g-4">
                <div class="col-md-6">
                    <h6 class="font-heading mb-2">Delivery Address</h6>
                    <p class="mb-1 fw-600">${order.shippingAddress.fullName}</p>
                    <p class="text-muted mb-0" style="font-size:0.85rem">
                        ${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}<br>
                        ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
                        Phone: ${order.shippingAddress.phone}
                    </p>
                </div>
                <div class="col-md-6">
                    <h6 class="font-heading mb-2">Shipping Details</h6>
                    <p class="mb-1" style="font-size:0.85rem">Total: <strong>${HJKUtils.formatPrice(order.totalAmount)}</strong></p>
                    <p class="mb-1" style="font-size:0.85rem">Payment: ${HJKUtils.getStatusBadge(order.paymentStatus)}</p>
                    ${order.trackingId ? `<p class="mb-0" style="font-size:0.85rem"><strong>Tracking ID:</strong> ${order.trackingId}</p>` : ''}
                    ${order.deliveryMethodName ? `<p class="mb-0" style="font-size:0.85rem"><strong>Via:</strong> ${order.deliveryMethodName}</p>` : ''}
                </div>
            </div>

            <div class="mt-4 text-center">
                ${HJKApp.isLoggedIn() ? `<a href="profile/order-detail.html?orderId=${order.id}" class="btn-primary-custom btn-sm">View Full Details</a>` : ''}
            </div>`;
    }
};
