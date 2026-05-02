/* ============================================
   HJKCollections - Admin Payment Logs
   ============================================ */

const AdminPaymentLogs = {
    currentPage: 1,
    perPage: 20,
    filterStatus: '',
    searchQuery: '',
    dateFrom: '',
    dateTo: '',
    summary: {},

    statusMeta: {
        created:           { label: 'Created',          bg: '#e8f0fe', color: '#1a73e8', icon: 'fa-circle-notch' },
        order_created:     { label: 'Order Created',    bg: '#e6f4ea', color: '#137333', icon: 'fa-circle-check' },
        order_failed:      { label: 'Order FAILED',     bg: '#fce8e6', color: '#c5221f', icon: 'fa-triangle-exclamation' },
        signature_failed:  { label: 'Signature Failed', bg: '#fce8e6', color: '#c5221f', icon: 'fa-shield-halved' },
        payment_failed:    { label: 'Payment Failed',   bg: '#fff4e5', color: '#b06000', icon: 'fa-circle-xmark' },
        cancelled:         { label: 'Cancelled',        bg: '#f1f3f4', color: '#5f6368', icon: 'fa-circle-minus' },
    },

    init() {
        if (!AdminComponents.getAdminPageShell('payment-logs', 'Payment Logs')) return;
        this.render();
    },

    async render() {
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        try {
            const params = { page: this.currentPage, perPage: this.perPage };
            if (this.filterStatus) params.status = this.filterStatus;
            if (this.searchQuery) params.search = this.searchQuery;
            if (this.dateFrom) params.date_from = this.dateFrom;
            if (this.dateTo) params.date_to = this.dateTo;

            const res = await HJKAPI.admin.paymentLogs.list(params);
            if (!res.success) throw new Error(res.message || 'Failed to load payment logs');

            const rows = res.data || [];
            const pagination = res.pagination || { total: rows.length, page: 1, totalPages: 1 };
            this.summary = res.summary || {};

            const failed = (this.summary.order_failed || 0) + (this.summary.signature_failed || 0);

            content.innerHTML = `
                ${failed > 0 ? `
                <div class="admin-card mb-3" style="border:1px solid #f1c5c0;background:#fff5f4">
                    <div class="admin-card-body" style="display:flex;align-items:center;gap:12px;padding:14px 18px">
                        <i class="fa-solid fa-triangle-exclamation" style="color:#c5221f;font-size:1.4rem"></i>
                        <div style="flex:1">
                            <strong style="color:#c5221f">${failed} payment${failed === 1 ? '' : 's'} need${failed === 1 ? 's' : ''} attention.</strong>
                            <span style="color:#666;margin-left:8px">Razorpay captured the money but the order was not created.</span>
                        </div>
                        <button class="btn-outline-custom btn-sm" onclick="AdminPaymentLogs.filterStatus='order_failed';AdminPaymentLogs.currentPage=1;AdminPaymentLogs.render()">View failed</button>
                    </div>
                </div>` : ''}

                <div class="admin-toolbar">
                    <div class="toolbar-left">
                        <div class="admin-search">
                            <i class="fa-solid fa-search"></i>
                            <input type="text" placeholder="Search razorpay id, payment id, or customer..." value="${this.searchQuery}" oninput="AdminPaymentLogs.searchQuery=this.value;AdminPaymentLogs.currentPage=1;AdminPaymentLogs.debouncedRender()">
                        </div>
                        <select class="admin-filter-select" onchange="AdminPaymentLogs.filterStatus=this.value;AdminPaymentLogs.currentPage=1;AdminPaymentLogs.render()">
                            <option value="">All statuses</option>
                            ${Object.keys(this.statusMeta).map(s => `<option value="${s}" ${this.filterStatus === s ? 'selected' : ''}>${this.statusMeta[s].label}${this.summary[s] ? ' (' + this.summary[s] + ')' : ''}</option>`).join('')}
                        </select>
                        <input type="date" class="admin-filter-select" value="${this.dateFrom}" onchange="AdminPaymentLogs.dateFrom=this.value;AdminPaymentLogs.currentPage=1;AdminPaymentLogs.render()">
                        <input type="date" class="admin-filter-select" value="${this.dateTo}" onchange="AdminPaymentLogs.dateTo=this.value;AdminPaymentLogs.currentPage=1;AdminPaymentLogs.render()">
                    </div>
                </div>

                <div class="admin-card">
                    <div class="admin-card-body" style="padding:0;overflow-x:auto">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th style="width:140px">Created</th>
                                    <th>Customer</th>
                                    <th>Razorpay Order ID</th>
                                    <th>Payment ID</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Order #</th>
                                    <th style="width:160px">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(r => this.renderRow(r)).join('')}
                                ${rows.length === 0 ? '<tr><td colspan="8" class="text-center text-muted py-4">No payment logs found</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                    <div class="admin-card-footer">
                        <span style="font-size:0.85rem;color:var(--text-muted)">Total: ${pagination.total}</span>
                        ${AdminComponents.renderPagination(this.currentPage, pagination.totalPages, 'AdminPaymentLogs.goToPage')}
                    </div>
                </div>

                <div id="paymentLogModal" class="admin-modal" style="display:none"></div>`;
        } catch (err) {
            content.innerHTML = `<div class="text-center py-5 text-danger">${err.message}</div>`;
            AdminComponents.showToast(err.message, 'error');
        }
    },

    renderRow(r) {
        const meta = this.statusMeta[r.status] || { label: r.status, bg: '#f1f3f4', color: '#3c4043', icon: 'fa-circle' };
        const orderCell = r.orderId
            ? `<a href="detail.html?id=${r.orderId}" style="font-weight:600">${r.orderNumber || ('#' + r.orderId)}</a>`
            : '<span class="text-muted">—</span>';
        const recoverable = r.status === 'order_failed';
        return `
            <tr ${r.status === 'order_failed' || r.status === 'signature_failed' ? 'style="background:#fff8f7"' : ''}>
                <td><div style="font-size:0.82rem">${HJKUtils.formatDateTime(r.createdAt)}</div></td>
                <td>
                    <div style="font-weight:600">${r.customerName}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${r.email}</div>
                </td>
                <td><code style="font-size:0.78rem">${r.razorpayOrderId || '—'}</code></td>
                <td><code style="font-size:0.78rem">${r.razorpayPaymentId || '—'}</code></td>
                <td style="font-weight:600">${HJKUtils.formatPrice(r.amount)}</td>
                <td><span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:${meta.bg};color:${meta.color};border-radius:20px;font-size:0.75rem;font-weight:600"><i class="fa-solid ${meta.icon}"></i>${meta.label}</span></td>
                <td>${orderCell}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-action-btn view" title="View details" onclick="AdminPaymentLogs.viewDetail(${r.id})"><i class="fa-solid fa-eye"></i></button>
                        ${recoverable ? `<button class="table-action-btn edit" title="Recover order" onclick="AdminPaymentLogs.recover(${r.id})"><i class="fa-solid fa-rotate-right"></i></button>` : ''}
                    </div>
                </td>
            </tr>`;
    },

    goToPage(page) { this.currentPage = page; this.render(); },

    _renderTimer: null,
    debouncedRender() {
        clearTimeout(this._renderTimer);
        this._renderTimer = setTimeout(() => this.render(), 300);
    },

    async viewDetail(id) {
        try {
            const res = await HJKAPI.admin.paymentLogs.detail(id);
            if (!res.success) throw new Error(res.message);
            const d = res.data;
            const meta = this.statusMeta[d.status] || { label: d.status, bg: '#f1f3f4', color: '#3c4043' };

            const cartHtml = (d.requestPayload && Array.isArray(d.requestPayload.cart))
                ? `<table class="admin-table" style="width:100%;font-size:0.85rem">
                    <thead><tr><th>Product</th><th>Variant</th><th>Qty</th><th>Price</th></tr></thead>
                    <tbody>${d.requestPayload.cart.map(it => `<tr><td>${it.product_name}</td><td>${it.color || ''} / ${it.size || ''}</td><td>${it.quantity}</td><td>${HJKUtils.formatPrice(it.selling_price)}</td></tr>`).join('')}</tbody>
                  </table>`
                : '<p class="text-muted">No cart snapshot</p>';

            const addr = d.requestPayload?.address;
            const addrHtml = addr
                ? `${addr.full_name}<br>${addr.address_line1}${addr.address_line2 ? ', ' + addr.address_line2 : ''}<br>${addr.city}, ${addr.state} - ${addr.pincode}<br>Phone: ${addr.phone}`
                : '<span class="text-muted">No address snapshot</span>';

            const modal = document.getElementById('paymentLogModal');
            modal.innerHTML = `
                <div class="admin-modal-backdrop" onclick="AdminPaymentLogs.closeModal()"></div>
                <div class="admin-modal-content" style="max-width:780px">
                    <div class="admin-modal-header">
                        <h5>Payment Log #${d.id}</h5>
                        <button class="admin-modal-close" onclick="AdminPaymentLogs.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body" style="max-height:70vh;overflow-y:auto">
                        <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px">
                            <span style="display:inline-block;padding:6px 14px;background:${meta.bg};color:${meta.color};border-radius:20px;font-weight:600;font-size:0.85rem">${meta.label}</span>
                            <span class="text-muted" style="font-size:0.85rem">${HJKUtils.formatDateTime(d.createdAt)} &rarr; ${HJKUtils.formatDateTime(d.updatedAt)}</span>
                        </div>

                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <h6>Customer</h6>
                                <p class="mb-0">${d.customerName}<br><small class="text-muted">${d.email} &middot; ${d.phone || '-'}</small></p>
                            </div>
                            <div class="col-md-6">
                                <h6>Amount</h6>
                                <p class="mb-0" style="font-size:1.2rem;font-weight:700">${HJKUtils.formatPrice(d.amount)}</p>
                            </div>
                        </div>

                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <h6>Razorpay Order ID</h6>
                                <code style="font-size:0.85rem">${d.razorpayOrderId || '—'}</code>
                            </div>
                            <div class="col-md-6">
                                <h6>Razorpay Payment ID</h6>
                                <code style="font-size:0.85rem">${d.razorpayPaymentId || '—'}</code>
                            </div>
                        </div>

                        ${d.orderId ? `<div class="mb-3"><h6>Linked Order</h6><a href="detail.html?id=${d.orderId}">${d.orderNumber || ('#' + d.orderId)}</a></div>` : ''}

                        ${d.errorMessage ? `<div class="mb-3"><h6 style="color:#c5221f">Error</h6><pre style="background:#fff5f4;border:1px solid #f1c5c0;border-radius:6px;padding:10px;font-size:0.82rem;white-space:pre-wrap">${d.errorMessage}</pre></div>` : ''}

                        <h6>Cart Snapshot</h6>
                        ${cartHtml}

                        <h6 class="mt-3">Shipping Address Snapshot</h6>
                        <p class="text-muted" style="font-size:0.9rem">${addrHtml}</p>

                        ${d.status === 'order_failed' ? `
                            <div class="mt-4 p-3" style="background:#fffaf0;border:1px solid #f5d28a;border-radius:8px">
                                <strong>Recovery</strong>
                                <p class="text-muted mb-2" style="font-size:0.85rem">Money was captured but no order exists. Click below to create the order from this snapshot and email the customer.</p>
                                <button class="btn-primary-custom btn-sm" onclick="AdminPaymentLogs.recover(${d.id})"><i class="fa-solid fa-rotate-right me-1"></i>Recover order</button>
                            </div>
                        ` : ''}
                    </div>
                </div>`;
            modal.style.display = 'block';
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
        }
    },

    closeModal() {
        const modal = document.getElementById('paymentLogModal');
        if (modal) { modal.style.display = 'none'; modal.innerHTML = ''; }
    },

    recover(id) {
        AdminComponents.showConfirm(
            'Recover order from payment',
            'This will create a new order in the database, decrement stock, and email the customer a confirmation. Continue?',
            async () => {
                try {
                    const res = await HJKAPI.admin.paymentLogs.recover(id);
                    if (!res.success) throw new Error(res.message);
                    AdminComponents.showToast('Order recovered: ' + res.data.orderNumber, 'success');
                    this.closeModal();
                    this.render();
                } catch (err) {
                    AdminComponents.showToast(err.message, 'error');
                }
            }
        );
    },
};
