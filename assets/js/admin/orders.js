/* ============================================
   HJKCollections - Admin Orders Management
   ============================================ */

const AdminOrders = {
    currentPage: 1,
    perPage: 10,
    filterStatus: '',
    searchQuery: '',

    init() {
        if (!AdminComponents.getAdminPageShell('orders', 'Orders')) return;
        this.render();
    },

    render() {
        const content = document.getElementById('adminContent');
        let orders = (HJKUtils.store.get('hjk_orders') || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const users = HJKUtils.store.get('hjk_users') || [];

        if (this.searchQuery) orders = orders.filter(o => o.orderNumber.toLowerCase().includes(this.searchQuery.toLowerCase()));
        if (this.filterStatus) orders = orders.filter(o => o.orderStatus === this.filterStatus);

        const total = orders.length;
        const totalPages = Math.ceil(total / this.perPage);
        const start = (this.currentPage - 1) * this.perPage;
        const pageOrders = orders.slice(start, start + this.perPage);

        content.innerHTML = `
            <div class="admin-toolbar">
                <div class="toolbar-left">
                    <div class="admin-search">
                        <i class="fa-solid fa-search"></i>
                        <input type="text" placeholder="Search by order number..." value="${this.searchQuery}" oninput="AdminOrders.searchQuery=this.value;AdminOrders.currentPage=1;AdminOrders.render()">
                    </div>
                    <select class="admin-filter-select" onchange="AdminOrders.filterStatus=this.value;AdminOrders.currentPage=1;AdminOrders.render()">
                        <option value="">All Status</option>
                        <option value="placed" ${this.filterStatus === 'placed' ? 'selected' : ''}>Placed</option>
                        <option value="confirmed" ${this.filterStatus === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="processing" ${this.filterStatus === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${this.filterStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${this.filterStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${this.filterStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
                <div class="toolbar-right">
                    <button class="btn-outline-custom btn-sm" onclick="AdminOrders.exportCSV()"><i class="fa-solid fa-download me-1"></i>Export</button>
                </div>
            </div>

            <div class="admin-card">
                <div class="admin-card-body" style="padding:0;overflow-x:auto">
                    <table class="admin-table">
                        <thead>
                            <tr><th>Order #</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th style="width:100px">Actions</th></tr>
                        </thead>
                        <tbody>
                            ${pageOrders.map(o => {
                                const customer = users.find(u => u.id === o.userId);
                                return `<tr>
                                    <td><a href="detail.html?id=${o.id}" style="color:var(--secondary);font-weight:600">${o.orderNumber}</a></td>
                                    <td>${customer ? customer.firstName + ' ' + customer.lastName : 'Unknown'}</td>
                                    <td>${o.items.length} item${o.items.length > 1 ? 's' : ''}</td>
                                    <td style="font-weight:600">${HJKUtils.formatPrice(o.totalAmount)}</td>
                                    <td>${HJKUtils.getStatusBadge(o.paymentStatus)}</td>
                                    <td>${HJKUtils.getStatusBadge(o.orderStatus)}</td>
                                    <td style="font-size:0.82rem">${HJKUtils.formatDate(o.createdAt)}</td>
                                    <td>
                                        <div class="table-actions">
                                            <a href="detail.html?id=${o.id}" class="table-action-btn view" title="View"><i class="fa-solid fa-eye"></i></a>
                                        </div>
                                    </td>
                                </tr>`;
                            }).join('')}
                            ${pageOrders.length === 0 ? '<tr><td colspan="8" class="text-center text-muted py-4">No orders found</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
                <div class="admin-card-footer">
                    <span style="font-size:0.85rem;color:var(--text-muted)">Showing ${Math.min(start + 1, total)}-${Math.min(start + this.perPage, total)} of ${total}</span>
                    ${AdminComponents.renderPagination(this.currentPage, totalPages, 'AdminOrders.goToPage')}
                </div>
            </div>`;
    },

    goToPage(page) { this.currentPage = page; this.render(); },

    exportCSV() {
        const orders = HJKUtils.store.get('hjk_orders') || [];
        const users = HJKUtils.store.get('hjk_users') || [];
        const rows = [['Order #', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Date']];
        orders.forEach(o => {
            const c = users.find(u => u.id === o.userId);
            rows.push([o.orderNumber, c ? c.firstName + ' ' + c.lastName : '', o.items.length, o.totalAmount, o.paymentStatus, o.orderStatus, HJKUtils.formatDate(o.createdAt)]);
        });
        HJKUtils.exportCSV(rows, 'orders-export.csv');
    },

    // Order Detail
    initDetail() {
        if (!AdminComponents.getAdminPageShell('orders', 'Order Details')) return;
        const id = HJKUtils.getUrlParam('id');
        const orders = HJKUtils.store.get('hjk_orders') || [];
        const order = orders.find(o => o.id === id);
        const users = HJKUtils.store.get('hjk_users') || [];
        const deliveryOptions = HJKUtils.store.get('hjk_delivery_options') || [];
        const content = document.getElementById('adminContent');

        if (!order) { content.innerHTML = '<p class="text-center text-muted py-5">Order not found</p>'; return; }

        const customer = users.find(u => u.id === order.userId);
        const allStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
        const currentIdx = allStatuses.indexOf(order.orderStatus);
        const canAdvance = currentIdx >= 0 && currentIdx < allStatuses.length - 1 && order.orderStatus !== 'cancelled';

        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 class="font-heading mb-1">Order ${order.orderNumber}</h4>
                    <span class="text-muted" style="font-size:0.85rem">Placed on ${HJKUtils.formatDateTime(order.createdAt)}</span>
                </div>
                <div class="d-flex gap-2 align-items-center">
                    ${HJKUtils.getStatusBadge(order.orderStatus)}
                    <a href="index.html" class="btn-outline-custom btn-sm"><i class="fa-solid fa-arrow-left me-1"></i>Back</a>
                </div>
            </div>

            <div class="row g-4">
                <!-- Left Column -->
                <div class="col-md-8">
                    <!-- Order Items -->
                    <div class="admin-card">
                        <div class="admin-card-header"><h5>Order Items</h5></div>
                        <div class="admin-card-body" style="padding:0">
                            <table class="admin-table">
                                <thead><tr><th>Product</th><th>Variant</th><th>Size</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                                <tbody>
                                    ${order.items.map(item => `
                                        <tr>
                                            <td>
                                                <div class="d-flex gap-2 align-items-center">
                                                    <img src="${item.image}" class="table-img">
                                                    <span style="font-weight:600;font-size:0.85rem">${item.productName}</span>
                                                </div>
                                            </td>
                                            <td>${item.color}</td>
                                            <td>${item.size}</td>
                                            <td>${item.quantity}</td>
                                            <td>${HJKUtils.formatPrice(item.unitPrice)}</td>
                                            <td style="font-weight:600">${HJKUtils.formatPrice(item.totalPrice)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Status Update -->
                    ${order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' ? `
                    <div class="admin-card">
                        <div class="admin-card-header"><h5>Update Status</h5></div>
                        <div class="admin-card-body">
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <label style="font-weight:600;font-size:0.85rem;margin-bottom:6px;display:block">Order Status</label>
                                    <select class="admin-filter-select w-100" id="newStatus">
                                        ${allStatuses.map(s => `<option value="${s}" ${order.orderStatus === s ? 'selected' : ''}>${s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label style="font-weight:600;font-size:0.85rem;margin-bottom:6px;display:block">Delivery Method</label>
                                    <select class="admin-filter-select w-100" id="deliveryMethod">
                                        <option value="">Select method</option>
                                        ${deliveryOptions.filter(d => d.isActive).map(d => `<option value="${d.id}" ${order.deliveryMethodId === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label style="font-weight:600;font-size:0.85rem;margin-bottom:6px;display:block">Tracking ID</label>
                                    <input type="text" class="admin-filter-select w-100" id="trackingId" value="${order.trackingId || ''}" placeholder="Enter tracking ID">
                                </div>
                            </div>
                            <div class="mt-3">
                                <label style="font-weight:600;font-size:0.85rem;margin-bottom:6px;display:block">Note</label>
                                <input type="text" class="admin-filter-select w-100" id="statusNote" placeholder="Optional note">
                            </div>
                            <button class="btn-primary-custom btn-sm mt-3" onclick="AdminOrders.updateStatus('${order.id}')"><i class="fa-solid fa-check me-1"></i>Update Order</button>
                        </div>
                    </div>` : ''}

                    <!-- Status History -->
                    <div class="admin-card">
                        <div class="admin-card-header"><h5>Status History</h5></div>
                        <div class="admin-card-body">
                            ${(order.statusHistory || []).slice().reverse().map(h => `
                                <div class="activity-item">
                                    <div class="activity-icon"><i class="fa-solid fa-circle" style="font-size:8px"></i></div>
                                    <div class="activity-info">
                                        <div class="activity-text"><strong>${h.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</strong>${h.note ? ' - ' + h.note : ''}</div>
                                        <div class="activity-time">${HJKUtils.formatDateTime(h.timestamp)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Right Column -->
                <div class="col-md-4">
                    <!-- Customer Info -->
                    <div class="admin-card">
                        <div class="admin-card-header"><h5>Customer</h5></div>
                        <div class="admin-card-body">
                            ${customer ? `
                                <p class="mb-1 fw-600">${customer.firstName} ${customer.lastName}</p>
                                <p class="mb-1 text-muted" style="font-size:0.85rem">${customer.email}</p>
                                <p class="mb-0 text-muted" style="font-size:0.85rem">${customer.phone || '-'}</p>
                            ` : '<p class="text-muted">Unknown customer</p>'}
                        </div>
                    </div>

                    <!-- Shipping Address -->
                    <div class="admin-card">
                        <div class="admin-card-header"><h5>Shipping Address</h5></div>
                        <div class="admin-card-body">
                            <p class="mb-1 fw-600">${order.shippingAddress.fullName}</p>
                            <p class="text-muted mb-0" style="font-size:0.85rem">
                                ${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}<br>
                                ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
                                Phone: ${order.shippingAddress.phone}
                            </p>
                        </div>
                    </div>

                    <!-- Payment Summary -->
                    <div class="admin-card">
                        <div class="admin-card-header"><h5>Payment</h5></div>
                        <div class="admin-card-body">
                            <div class="d-flex justify-content-between mb-2"><span>Subtotal</span><span>${HJKUtils.formatPrice(order.subtotal)}</span></div>
                            ${order.discount > 0 ? `<div class="d-flex justify-content-between mb-2" style="color:var(--success)"><span>Discount</span><span>-${HJKUtils.formatPrice(order.discount)}</span></div>` : ''}
                            <div class="d-flex justify-content-between mb-2"><span>Shipping</span><span>${order.shippingCost === 0 ? 'FREE' : HJKUtils.formatPrice(order.shippingCost)}</span></div>
                            <div class="d-flex justify-content-between fw-700 pt-2 mt-2" style="border-top:2px solid var(--border)"><span>Total</span><span>${HJKUtils.formatPrice(order.totalAmount)}</span></div>
                            <div class="mt-3">
                                <p class="mb-1" style="font-size:0.85rem">Status: ${HJKUtils.getStatusBadge(order.paymentStatus)}</p>
                                <p class="mb-0" style="font-size:0.85rem">ID: <code>${order.paymentId}</code></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    updateStatus(orderId) {
        const orders = HJKUtils.store.get('hjk_orders') || [];
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const newStatus = document.getElementById('newStatus').value;
        const deliveryMethodId = document.getElementById('deliveryMethod').value;
        const trackingId = document.getElementById('trackingId').value.trim();
        const note = document.getElementById('statusNote').value.trim();

        if (deliveryMethodId) {
            const deliveryOptions = HJKUtils.store.get('hjk_delivery_options') || [];
            const method = deliveryOptions.find(d => d.id === deliveryMethodId);
            order.deliveryMethodId = deliveryMethodId;
            order.deliveryMethodName = method?.name || '';
        }

        if (trackingId) order.trackingId = trackingId;

        order.orderStatus = newStatus;
        if (newStatus === 'delivered') order.paymentStatus = 'paid';
        order.statusHistory.push({ status: newStatus, timestamp: new Date().toISOString(), note: note || 'Updated by admin' });
        order.updatedAt = new Date().toISOString();

        HJKUtils.store.set('hjk_orders', orders);
        AdminComponents.showToast('Order status updated!', 'success');
        this.initDetail();
    }
};
