/* ============================================
   HJKCollections - Customer Orders Logic
   ============================================ */

const HJKOrders = {
    currentFilter: 'all',

    initOrdersPage() {
        this.render();
    },

    render() {
        const user = HJKApp.getCurrentUser();
        const allOrders = (HJKUtils.store.get('hjk_orders') || []).filter(o => o.userId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const content = document.getElementById('profileContent');

        let orders = allOrders;
        if (this.currentFilter === 'active') orders = orders.filter(o => ['placed','confirmed','processing','shipped','out_for_delivery'].includes(o.orderStatus));
        else if (this.currentFilter === 'delivered') orders = orders.filter(o => o.orderStatus === 'delivered');
        else if (this.currentFilter === 'cancelled') orders = orders.filter(o => o.orderStatus === 'cancelled');
        else if (this.currentFilter === 'returned') orders = orders.filter(o => ['return_requested','return_approved','returned','refunded'].includes(o.orderStatus));

        const tabs = [
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'cancelled', label: 'Cancelled' },
            { key: 'returned', label: 'Returned' }
        ];

        content.innerHTML = `
            <div class="content-card">
                <div class="content-header"><h4>My Orders</h4></div>
                <div class="tabs-custom mb-4">
                    ${tabs.map(t => `<button class="tab-btn ${this.currentFilter === t.key ? 'active' : ''}" onclick="HJKOrders.filterOrders('${t.key}')">${t.label}</button>`).join('')}
                </div>
                ${orders.length === 0 ? HJKComponents.renderEmptyState('fa-box', 'No Orders', 'You don\'t have any orders in this category.', 'Start Shopping', '../products.html') :
                orders.map(order => `
                    <div class="order-card">
                        <div class="order-card-header">
                            <div>
                                <span class="order-id">${order.orderNumber}</span>
                                <span class="order-date ms-3">${HJKUtils.formatDate(order.createdAt)}</span>
                            </div>
                            <div>${HJKUtils.getStatusBadge(order.orderStatus)}</div>
                        </div>
                        <div class="order-card-body">
                            <div class="order-card-items">
                                ${order.items.map(item => `
                                    <div class="d-flex gap-3 align-items-center">
                                        <img src="${item.image}" alt="${item.productName}" class="order-item-thumb">
                                        <div>
                                            <div style="font-weight:600;font-size:0.88rem">${item.productName}</div>
                                            <div style="font-size:0.78rem;color:var(--text-muted)">${item.color} | ${item.size} x ${item.quantity}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="order-card-footer">
                            <div class="order-total">Total: ${HJKUtils.formatPrice(order.totalAmount)}</div>
                            <a href="order-detail.html?orderId=${order.id}" class="btn-outline-custom btn-sm">View Details</a>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    },

    filterOrders(filter) {
        this.currentFilter = filter;
        this.render();
    },

    initOrderDetailPage() {
        const orderId = HJKUtils.getUrlParam('orderId');
        const orders = HJKUtils.store.get('hjk_orders') || [];
        const order = orders.find(o => o.id === orderId);
        const content = document.getElementById('profileContent');

        if (!order) {
            content.innerHTML = HJKComponents.renderEmptyState('fa-box', 'Order Not Found', '', 'Go to Orders', 'orders.html');
            return;
        }

        const allStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
        const currentIdx = allStatuses.indexOf(order.orderStatus);
        const isCancelled = order.orderStatus === 'cancelled';
        const isReturned = ['return_requested','return_approved','returned','refunded'].includes(order.orderStatus);

        content.innerHTML = `
            <div class="content-card">
                <div class="content-header">
                    <h4>Order ${order.orderNumber}</h4>
                    ${HJKUtils.getStatusBadge(order.orderStatus)}
                </div>

                ${!isCancelled && !isReturned ? `
                <div class="status-timeline mb-4">
                    ${allStatuses.map((s, i) => {
                        let cls = i < currentIdx ? 'completed' : i === currentIdx ? 'active' : '';
                        const icons = { placed:'fa-receipt', confirmed:'fa-check', processing:'fa-gear', shipped:'fa-truck', out_for_delivery:'fa-truck-fast', delivered:'fa-circle-check' };
                        return `<div class="timeline-step ${cls}">
                            <div class="timeline-icon"><i class="fa-solid ${icons[s]}"></i></div>
                            <span class="timeline-label">${s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                        </div>`;
                    }).join('')}
                </div>` : ''}

                <!-- Items -->
                <h6 class="font-heading mb-3">Order Items</h6>
                ${order.items.map(item => `
                    <div class="d-flex gap-3 mb-3 pb-3" style="border-bottom:1px solid var(--border)">
                        <img src="${item.image}" style="width:70px;height:70px;object-fit:cover;border-radius:var(--radius-sm)">
                        <div class="flex-grow-1">
                            <div style="font-weight:600">${item.productName}</div>
                            <div style="font-size:0.82rem;color:var(--text-muted)">${item.color} | ${item.size}</div>
                            <div style="font-size:0.85rem">Qty: ${item.quantity} x ${HJKUtils.formatPrice(item.unitPrice)}</div>
                        </div>
                        <div style="font-weight:600">${HJKUtils.formatPrice(item.totalPrice)}</div>
                    </div>
                `).join('')}

                <!-- Price Breakdown -->
                <div style="max-width:300px;margin-left:auto">
                    <div class="d-flex justify-content-between mb-1"><span>Subtotal</span><span>${HJKUtils.formatPrice(order.subtotal)}</span></div>
                    ${order.discount > 0 ? `<div class="d-flex justify-content-between mb-1" style="color:var(--success)"><span>Discount</span><span>-${HJKUtils.formatPrice(order.discount)}</span></div>` : ''}
                    <div class="d-flex justify-content-between mb-1"><span>Shipping</span><span>${order.shippingCost === 0 ? 'FREE' : HJKUtils.formatPrice(order.shippingCost)}</span></div>
                    <div class="d-flex justify-content-between fw-700 pt-2 mt-2" style="border-top:2px solid var(--border)"><span>Total</span><span>${HJKUtils.formatPrice(order.totalAmount)}</span></div>
                </div>

                <div class="divider"></div>

                <!-- Address & Payment -->
                <div class="row g-4">
                    <div class="col-md-6">
                        <h6 class="font-heading mb-2">Shipping Address</h6>
                        <p class="mb-1 fw-600">${order.shippingAddress.fullName}</p>
                        <p class="text-muted mb-0" style="font-size:0.88rem">${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}<br>${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>Phone: ${order.shippingAddress.phone}</p>
                    </div>
                    <div class="col-md-6">
                        <h6 class="font-heading mb-2">Payment Info</h6>
                        <p class="mb-1" style="font-size:0.88rem">Method: Razorpay</p>
                        <p class="mb-1" style="font-size:0.88rem">Status: ${HJKUtils.getStatusBadge(order.paymentStatus)}</p>
                        <p class="mb-0" style="font-size:0.88rem">ID: ${order.paymentId}</p>
                        ${order.trackingId ? `<p class="mt-2 mb-0" style="font-size:0.88rem"><strong>Tracking:</strong> ${order.trackingId} (${order.deliveryMethodName})</p>` : ''}
                    </div>
                </div>

                <!-- Actions -->
                <div class="mt-4 d-flex gap-3">
                    ${['placed','confirmed'].includes(order.orderStatus) ? `<button class="btn-outline-custom btn-sm" style="border-color:var(--danger);color:var(--danger)" onclick="HJKOrders.cancelOrder('${order.id}')"><i class="fa-solid fa-xmark"></i> Cancel Order</button>` : ''}
                    ${order.orderStatus === 'delivered' ? `<a href="return-request.html?orderId=${order.id}" class="btn-outline-custom btn-sm"><i class="fa-solid fa-rotate-left"></i> Request Return</a>` : ''}
                    <button class="btn-outline-custom btn-sm" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Invoice</button>
                </div>
            </div>`;
    },

    cancelOrder(orderId) {
        HJKComponents.showConfirm('Cancel Order', 'Are you sure you want to cancel this order? This action cannot be undone.', () => {
            const orders = HJKUtils.store.get('hjk_orders') || [];
            const order = orders.find(o => o.id === orderId);
            if (order) {
                order.orderStatus = 'cancelled';
                order.paymentStatus = 'refunded';
                order.statusHistory.push({ status: 'cancelled', timestamp: new Date().toISOString(), note: 'Cancelled by customer' });
                order.updatedAt = new Date().toISOString();
                HJKUtils.store.set('hjk_orders', orders);
                HJKComponents.showToast('Order cancelled. Refund will be processed.', 'success');
                this.initOrderDetailPage();
            }
        });
    },

    initReturnRequestPage() {
        const orderId = HJKUtils.getUrlParam('orderId');
        const orders = HJKUtils.store.get('hjk_orders') || [];
        const order = orders.find(o => o.id === orderId);
        const content = document.getElementById('profileContent');

        if (!order || order.orderStatus !== 'delivered') {
            content.innerHTML = HJKComponents.renderEmptyState('fa-rotate-left', 'Cannot Process Return', 'This order is not eligible for return.', 'Go to Orders', 'orders.html');
            return;
        }

        content.innerHTML = `
            <div class="content-card">
                <div class="content-header"><h4>Return Request - ${order.orderNumber}</h4></div>

                <div class="alert" style="background:var(--warning-light);border:1px solid var(--warning);border-radius:var(--radius-md);padding:14px;margin-bottom:20px">
                    <p class="mb-0" style="font-size:0.88rem;color:var(--warning)"><i class="fa-solid fa-triangle-exclamation me-2"></i><strong>Important:</strong> Returns are only accepted for damaged products. You must upload an unboxing video as proof.</p>
                </div>

                <form onsubmit="HJKOrders.submitReturn(event, '${order.id}')">
                    <div class="mb-3">
                        <label class="form-label-custom">Reason for Return</label>
                        <select class="form-control-custom" id="returnReason" required>
                            <option value="">Select reason</option>
                            <option value="damaged">Damaged Product</option>
                            <option value="wrong_item">Wrong Item Received</option>
                            <option value="defective">Defective Product</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label-custom">Description</label>
                        <textarea class="form-control-custom" id="returnDesc" rows="4" required placeholder="Describe the issue in detail"></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label-custom">Upload Unboxing Video (Required)</label>
                        <input type="file" class="form-control-custom" id="returnVideo" accept="video/*" required>
                        <p class="form-text">Max file size: 50MB. Accepted formats: MP4, MOV, AVI</p>
                    </div>
                    <button type="submit" class="btn-primary-custom">Submit Return Request</button>
                </form>
            </div>`;
    },

    submitReturn(e, orderId) {
        e.preventDefault();
        const reason = document.getElementById('returnReason').value;
        const desc = document.getElementById('returnDesc').value.trim();
        const video = document.getElementById('returnVideo').files[0];

        if (!reason || !desc || !video) { HJKComponents.showToast('Please fill all fields and upload video', 'error'); return; }

        const orders = HJKUtils.store.get('hjk_orders') || [];
        const order = orders.find(o => o.id === orderId);
        const user = HJKApp.getCurrentUser();
        const returns = HJKUtils.store.get('hjk_returns') || [];

        returns.push({
            id: HJKUtils.generateId('ret'), orderId, orderNumber: order?.orderNumber || '',
            userId: user.id,
            items: order ? order.items.map(i => ({ productId: i.productId, variantId: i.variantId, size: i.size, quantity: i.quantity, reason })) : [],
            reason, description: desc, videoUrl: video.name,
            status: 'pending', adminNote: '',
            createdAt: new Date().toISOString()
        });
        HJKUtils.store.set('hjk_returns', returns);

        if (order) {
            order.orderStatus = 'return_requested';
            order.statusHistory.push({ status: 'return_requested', timestamp: new Date().toISOString(), note: 'Return requested by customer' });
            order.updatedAt = new Date().toISOString();
            HJKUtils.store.set('hjk_orders', orders);
        }

        HJKComponents.showToast('Return request submitted! We will review it shortly.', 'success');
        setTimeout(() => { window.location.href = 'orders.html'; }, 1500);
    }
};
