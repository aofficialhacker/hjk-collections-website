/* ============================================
   HJKCollections - Admin Returns Management
   ============================================ */

const AdminReturns = {
    init() {
        if (!AdminComponents.getAdminPageShell('returns', 'Returns')) return;
        this.render();
    },

    render() {
        const content = document.getElementById('adminContent');
        const returns = (HJKUtils.store.get('hjk_returns') || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const users = HJKUtils.store.get('hjk_users') || [];

        content.innerHTML = `
            <div class="admin-card">
                <div class="admin-card-header">
                    <h5>Return Requests</h5>
                    <span style="font-size:0.85rem;color:var(--text-muted)">${returns.filter(r => r.status === 'pending').length} pending</span>
                </div>
                <div class="admin-card-body" style="padding:0;overflow-x:auto">
                    <table class="admin-table">
                        <thead><tr><th>Return ID</th><th>Order</th><th>Customer</th><th>Reason</th><th>Video</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${returns.map(r => {
                                const customer = users.find(u => u.id === r.userId);
                                return `<tr>
                                    <td><code style="font-size:0.8rem">${r.id}</code></td>
                                    <td style="font-weight:600">${r.orderNumber}</td>
                                    <td>${customer ? customer.firstName + ' ' + customer.lastName : 'Unknown'}</td>
                                    <td>${r.reason.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                                    <td>${r.videoUrl ? `<span style="color:var(--success);font-size:0.82rem"><i class="fa-solid fa-video me-1"></i>${r.videoUrl}</span>` : '-'}</td>
                                    <td>${HJKUtils.getStatusBadge(r.status)}</td>
                                    <td style="font-size:0.82rem">${HJKUtils.formatDate(r.createdAt)}</td>
                                    <td>
                                        ${r.status === 'pending' ? `
                                            <div class="table-actions">
                                                <button class="table-action-btn edit" title="Approve" onclick="AdminReturns.updateStatus('${r.id}','approved')"><i class="fa-solid fa-check"></i></button>
                                                <button class="table-action-btn delete" title="Reject" onclick="AdminReturns.updateStatus('${r.id}','rejected')"><i class="fa-solid fa-xmark"></i></button>
                                            </div>
                                        ` : `<span style="font-size:0.8rem;color:var(--text-muted)">${r.status}</span>`}
                                    </td>
                                </tr>`;
                            }).join('')}
                            ${returns.length === 0 ? '<tr><td colspan="8" class="text-center text-muted py-4">No return requests</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>`;
    },

    updateStatus(returnId, status) {
        const action = status === 'approved' ? 'approve' : 'reject';
        AdminComponents.showConfirm(`${action.charAt(0).toUpperCase() + action.slice(1)} Return`, `Are you sure you want to ${action} this return request?`, () => {
            const returns = HJKUtils.store.get('hjk_returns') || [];
            const ret = returns.find(r => r.id === returnId);
            if (ret) {
                ret.status = status;
                ret.updatedAt = new Date().toISOString();
                HJKUtils.store.set('hjk_returns', returns);

                // Update order status if approved
                if (status === 'approved') {
                    const orders = HJKUtils.store.get('hjk_orders') || [];
                    const order = orders.find(o => o.id === ret.orderId);
                    if (order) {
                        order.orderStatus = 'return_approved';
                        order.statusHistory.push({ status: 'return_approved', timestamp: new Date().toISOString(), note: 'Return approved by admin' });
                        order.updatedAt = new Date().toISOString();
                        HJKUtils.store.set('hjk_orders', orders);
                    }
                }

                AdminComponents.showToast(`Return ${status}`, 'success');
                this.render();
            }
        });
    }
};
