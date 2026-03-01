/* ============================================
   HJKCollections - Admin Customers Management
   ============================================ */

const AdminCustomers = {
    searchQuery: '',

    init() {
        if (!AdminComponents.getAdminPageShell('customers', 'Customers')) return;
        this.render();
    },

    render() {
        const content = document.getElementById('adminContent');
        let users = (HJKUtils.store.get('hjk_users') || []).filter(u => u.role === 'customer');
        const orders = HJKUtils.store.get('hjk_orders') || [];

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            users = users.filter(u => (u.firstName + ' ' + u.lastName).toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
        }

        content.innerHTML = `
            <div class="admin-toolbar">
                <div class="toolbar-left">
                    <div class="admin-search">
                        <i class="fa-solid fa-search"></i>
                        <input type="text" placeholder="Search customers..." value="${this.searchQuery}" oninput="AdminCustomers.searchQuery=this.value;AdminCustomers.render()">
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
                            ${users.map((u, i) => {
                                const userOrders = orders.filter(o => o.userId === u.id);
                                const totalSpent = userOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0);
                                return `<tr>
                                    <td>${i + 1}</td>
                                    <td style="font-weight:600">${u.firstName} ${u.lastName}</td>
                                    <td>${u.email}</td>
                                    <td>${u.phone || '-'}</td>
                                    <td>${userOrders.length}</td>
                                    <td>${HJKUtils.formatPrice(totalSpent)}</td>
                                    <td>
                                        <label class="toggle-switch">
                                            <input type="checkbox" ${u.isActive !== false ? 'checked' : ''} onchange="AdminCustomers.toggleStatus('${u.id}',this.checked)">
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </td>
                                    <td style="font-size:0.82rem">${HJKUtils.formatDate(u.createdAt)}</td>
                                    <td>
                                        <button class="table-action-btn view" title="View" onclick="AdminCustomers.viewDetail('${u.id}')"><i class="fa-solid fa-eye"></i></button>
                                    </td>
                                </tr>`;
                            }).join('')}
                            ${users.length === 0 ? '<tr><td colspan="9" class="text-center text-muted py-4">No customers found</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="customerDetailModal"></div>`;
    },

    toggleStatus(id, isActive) {
        const users = HJKUtils.store.get('hjk_users') || [];
        const u = users.find(x => x.id === id);
        if (u) { u.isActive = isActive; HJKUtils.store.set('hjk_users', users); AdminComponents.showToast(`Customer ${isActive ? 'enabled' : 'disabled'}`, 'success'); }
    },

    viewDetail(id) {
        const users = HJKUtils.store.get('hjk_users') || [];
        const u = users.find(x => x.id === id);
        const orders = (HJKUtils.store.get('hjk_orders') || []).filter(o => o.userId === id);
        const addresses = (HJKUtils.store.get('hjk_addresses') || []).filter(a => a.userId === id);
        if (!u) return;

        const modal = document.getElementById('customerDetailModal');
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
                        <div class="col-6"><strong>Orders:</strong> ${orders.length}</div>
                    </div>
                    <h6 class="font-heading mb-2">Addresses (${addresses.length})</h6>
                    ${addresses.map(a => `<div style="background:var(--bg-light);padding:10px;border-radius:var(--radius-sm);margin-bottom:8px;font-size:0.85rem">${a.fullName} - ${a.addressLine1}, ${a.city}, ${a.state} ${a.pincode}</div>`).join('') || '<p class="text-muted" style="font-size:0.85rem">No addresses</p>'}
                    <h6 class="font-heading mt-3 mb-2">Recent Orders</h6>
                    ${orders.slice(0, 5).map(o => `<div class="d-flex justify-content-between py-2" style="border-bottom:1px solid var(--border);font-size:0.85rem"><span>${o.orderNumber}</span><span>${HJKUtils.formatPrice(o.totalAmount)}</span>${HJKUtils.getStatusBadge(o.orderStatus)}</div>`).join('') || '<p class="text-muted" style="font-size:0.85rem">No orders</p>'}
                </div>
            </div>`;
    },

    exportCSV() {
        const users = (HJKUtils.store.get('hjk_users') || []).filter(u => u.role === 'customer');
        const orders = HJKUtils.store.get('hjk_orders') || [];
        const rows = [['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Joined']];
        users.forEach(u => {
            const uo = orders.filter(o => o.userId === u.id);
            const spent = uo.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0);
            rows.push([u.firstName + ' ' + u.lastName, u.email, u.phone || '', uo.length, spent, HJKUtils.formatDate(u.createdAt)]);
        });
        HJKUtils.exportCSV(rows, 'customers-export.csv');
    }
};
