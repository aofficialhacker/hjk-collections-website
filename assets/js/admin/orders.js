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

    async render() {
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        try {
            const params = {
                page: this.currentPage,
                perPage: this.perPage
            };
            if (this.searchQuery) params.search = this.searchQuery;
            if (this.filterStatus) params.status = this.filterStatus;

            const response = await HJKAPI.admin.orders.list(params);
            if (!response.success) throw new Error(response.message || 'Failed to load orders');

            const orders = response.data || [];
            const pagination = response.pagination || { total: orders.length, page: 1, totalPages: 1 };
            const total = pagination.total;
            const totalPages = pagination.totalPages;
            const start = (this.currentPage - 1) * this.perPage;

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
                                ${orders.map(o => `<tr>
                                    <td><a href="detail.html?id=${o.id}" style="color:var(--secondary);font-weight:600">${o.orderNumber}</a></td>
                                    <td>${o.customerName || 'Unknown'}</td>
                                    <td>${(o.items || []).length} item${(o.items || []).length > 1 ? 's' : ''}</td>
                                    <td style="font-weight:600">${HJKUtils.formatPrice(o.totalAmount)}</td>
                                    <td>${HJKUtils.getStatusBadge(o.paymentStatus)}</td>
                                    <td>${HJKUtils.getStatusBadge(o.orderStatus)}</td>
                                    <td style="font-size:0.82rem">${HJKUtils.formatDate(o.createdAt)}</td>
                                    <td>
                                        <div class="table-actions">
                                            <a href="detail.html?id=${o.id}" class="table-action-btn view" title="View"><i class="fa-solid fa-eye"></i></a>
                                        </div>
                                    </td>
                                </tr>`).join('')}
                                ${orders.length === 0 ? '<tr><td colspan="8" class="text-center text-muted py-4">No orders found</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                    <div class="admin-card-footer">
                        <span style="font-size:0.85rem;color:var(--text-muted)">Showing ${Math.min(start + 1, total)}-${Math.min(start + this.perPage, total)} of ${total}</span>
                        ${AdminComponents.renderPagination(this.currentPage, totalPages, 'AdminOrders.goToPage')}
                    </div>
                </div>`;
        } catch (err) {
            content.innerHTML = `<div class="text-center py-5 text-danger">${err.message}</div>`;
            AdminComponents.showToast(err.message, 'error');
        }
    },

    goToPage(page) { this.currentPage = page; this.render(); },

    async exportCSV() {
        try {
            const response = await HJKAPI.admin.orders.list({ perPage: 9999 });
            const orders = response.success ? (response.data || []) : [];
            const rows = [['Order #', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Date']];
            orders.forEach(o => {
                rows.push([o.orderNumber, o.customerName || '', (o.items || []).length, o.totalAmount, o.paymentStatus, o.orderStatus, HJKUtils.formatDate(o.createdAt)]);
            });
            HJKUtils.exportCSV(rows, 'orders-export.csv');
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
        }
    },

    // Order Detail
    initDetail() {
        if (!AdminComponents.getAdminPageShell('orders', 'Order Details')) return;
        this.loadDetail();
    },

    async loadDetail() {
        const id = HJKUtils.getUrlParam('id');
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        try {
            const response = await HJKAPI.admin.orders.detail(id);
            if (!response.success) throw new Error(response.message || 'Order not found');

            const order = response.data;
            const allStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

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
                                        ${(order.items || []).map(item => `
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
                                ${order.customer ? `
                                    <p class="mb-1 fw-600">${order.customer.firstName} ${order.customer.lastName}</p>
                                    <p class="mb-1 text-muted" style="font-size:0.85rem">${order.customer.email}</p>
                                    <p class="mb-0 text-muted" style="font-size:0.85rem">${order.customer.phone || '-'}</p>
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
        } catch (err) {
            content.innerHTML = `<p class="text-center text-muted py-5">${err.message || 'Order not found'}</p>`;
            AdminComponents.showToast(err.message, 'error');
        }
    },

    async updateStatus(orderId) {
        const newStatus = document.getElementById('newStatus').value;
        const trackingId = document.getElementById('trackingId').value.trim();
        const note = document.getElementById('statusNote').value.trim();

        try {
            const data = { id: orderId, status: newStatus };
            if (trackingId) data.trackingId = trackingId;
            if (note) data.note = note;

            const response = await HJKAPI.admin.orders.updateStatus(data);
            if (!response.success) throw new Error(response.message);

            AdminComponents.showToast('Order status updated!', 'success');
            this.loadDetail();
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
        }
    }
};
