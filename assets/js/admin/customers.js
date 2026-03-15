/* ============================================
   HJKCollections - Admin Customers Management
   ============================================ */

const AdminCustomers = {
    searchQuery: '',
    currentPage: 1,
    perPage: 20,

    init() {
        if (!AdminComponents.getAdminPageShell('customers', 'Customers')) return;
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

            const response = await HJKAPI.admin.customers.list(params);
            if (!response.success) throw new Error(response.message || 'Failed to load customers');

            const customers = response.data || [];
            const pagination = response.pagination || { total: customers.length, page: 1, totalPages: 1 };

            content.innerHTML = `
                <div class="admin-toolbar">
                    <div class="toolbar-left">
                        <div class="admin-search">
                            <i class="fa-solid fa-search"></i>
                            <input type="text" placeholder="Search customers..." value="${this.searchQuery}" oninput="AdminCustomers.searchQuery=this.value;AdminCustomers.currentPage=1;AdminCustomers.render()">
                        </div>
                    </div>
                    <div class="toolbar-right">
                        <button class="btn-outline-custom btn-sm" onclick="AdminCustomers.exportCSV()"><i class="fa-solid fa-download me-1"></i>Export</button>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="admin-card-body" style="padding:0;overflow-x:auto">
                        <table class="admin-table">
                            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Total Spent</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                            <tbody>
                                ${customers.map((u, i) => `<tr>
                                    <td>${(this.currentPage - 1) * this.perPage + i + 1}</td>
                                    <td style="font-weight:600">${u.firstName} ${u.lastName}</td>
                                    <td>${u.email}</td>
                                    <td>${u.phone || '-'}</td>
                                    <td>${u.orderCount || 0}</td>
                                    <td>${HJKUtils.formatPrice(u.totalSpent || 0)}</td>
                                    <td>
                                        <label class="toggle-switch">
                                            <input type="checkbox" ${u.isActive !== false ? 'checked' : ''} onchange="AdminCustomers.toggleStatus('${u.id}')">
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </td>
                                    <td style="font-size:0.82rem">${HJKUtils.formatDate(u.createdAt)}</td>
                                    <td>
                                        <button class="table-action-btn view" title="View" onclick="AdminCustomers.viewDetail('${u.id}')"><i class="fa-solid fa-eye"></i></button>
                                    </td>
                                </tr>`).join('')}
                                ${customers.length === 0 ? '<tr><td colspan="9" class="text-center text-muted py-4">No customers found</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                    ${pagination.totalPages > 1 ? `
                    <div class="admin-card-footer">
                        <span style="font-size:0.85rem;color:var(--text-muted)">Showing ${Math.min((this.currentPage-1)*this.perPage+1, pagination.total)}-${Math.min(this.currentPage*this.perPage, pagination.total)} of ${pagination.total}</span>
                        ${AdminComponents.renderPagination(this.currentPage, pagination.totalPages, 'AdminCustomers.goToPage')}
                    </div>` : ''}
                </div>

                <div id="customerDetailModal"></div>`;
        } catch (err) {
            content.innerHTML = `<div class="text-center py-5 text-danger">${err.message}</div>`;
            AdminComponents.showToast(err.message, 'error');
        }
    },

    goToPage(page) { this.currentPage = page; this.render(); },

    async toggleStatus(id) {
        try {
            const response = await HJKAPI.admin.customers.toggle(id);
            if (!response.success) throw new Error(response.message);
            AdminComponents.showToast('Customer status updated', 'success');
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
            this.render();
        }
    },

    async viewDetail(id) {
        const modal = document.getElementById('customerDetailModal');
        modal.innerHTML = '<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center"><div style="background:#fff;border-radius:var(--radius-lg);padding:30px"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div></div>';

        try {
            // Fetch customer details from the list endpoint with search
            const response = await HJKAPI.admin.customers.list({ search: '', perPage: 9999 });
            if (!response.success) throw new Error(response.message);

            const u = (response.data || []).find(c => c.id === id);
            if (!u) throw new Error('Customer not found');

            const orders = u.recentOrders || [];
            const addresses = u.addresses || [];

            modal.innerHTML = `
                <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:20px">
                    <div style="background:#fff;border-radius:var(--radius-lg);padding:30px;max-width:600px;width:100%">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="font-heading mb-0">${u.firstName} ${u.lastName}</h5>
                            <button style="background:none;border:none;font-size:1.2rem;cursor:pointer" onclick="document.getElementById('customerDetailModal').innerHTML=''"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-6"><strong>Email:</strong> ${u.email}</div>
                            <div class="col-6"><strong>Phone:</strong> ${u.phone || '-'}</div>
                            <div class="col-6"><strong>Joined:</strong> ${HJKUtils.formatDate(u.createdAt)}</div>
                            <div class="col-6"><strong>Orders:</strong> ${u.orderCount || 0}</div>
                        </div>
                        <h6 class="font-heading mb-2">Addresses (${addresses.length})</h6>
                        ${addresses.map(a => `<div style="background:var(--bg-light);padding:10px;border-radius:var(--radius-sm);margin-bottom:8px;font-size:0.85rem">${a.fullName} - ${a.addressLine1}, ${a.city}, ${a.state} ${a.pincode}</div>`).join('') || '<p class="text-muted" style="font-size:0.85rem">No addresses</p>'}
                        <h6 class="font-heading mt-3 mb-2">Recent Orders</h6>
                        ${orders.slice(0, 5).map(o => `<div class="d-flex justify-content-between py-2" style="border-bottom:1px solid var(--border);font-size:0.85rem"><span>${o.orderNumber}</span><span>${HJKUtils.formatPrice(o.totalAmount)}</span>${HJKUtils.getStatusBadge(o.orderStatus)}</div>`).join('') || '<p class="text-muted" style="font-size:0.85rem">No orders</p>'}
                    </div>
                </div>`;
        } catch (err) {
            modal.innerHTML = '';
            AdminComponents.showToast(err.message, 'error');
        }
    },

    async exportCSV() {
        try {
            const response = await HJKAPI.admin.customers.list({ perPage: 9999 });
            const customers = response.success ? (response.data || []) : [];
            const rows = [['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Joined']];
            customers.forEach(u => {
                rows.push([u.firstName + ' ' + u.lastName, u.email, u.phone || '', u.orderCount || 0, u.totalSpent || 0, HJKUtils.formatDate(u.createdAt)]);
            });
            HJKUtils.exportCSV(rows, 'customers-export.csv');
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
        }
    }
};
