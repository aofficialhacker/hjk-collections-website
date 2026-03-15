/* ============================================
   HJKCollections - Admin Returns Management
   ============================================ */

const AdminReturns = {
    init() {
        if (!AdminComponents.getAdminPageShell('returns', 'Returns')) return;
        this.render();
    },

    async render() {
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        try {
            const response = await HJKAPI.admin.returns.list();
            if (!response.success) throw new Error(response.message || 'Failed to load returns');

            const returns = response.data || [];
            const pendingCount = returns.filter(r => r.status === 'pending').length;

            content.innerHTML = `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h5>Return Requests</h5>
                        <span style="font-size:0.85rem;color:var(--text-muted)">${pendingCount} pending</span>
                    </div>
                    <div class="admin-card-body" style="padding:0;overflow-x:auto">
                        <table class="admin-table">
                            <thead><tr><th>Return ID</th><th>Order</th><th>Customer</th><th>Reason</th><th>Video</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                            <tbody>
                                ${returns.map(r => `<tr>
                                    <td><code style="font-size:0.8rem">${r.id}</code></td>
                                    <td style="font-weight:600">${r.orderNumber}</td>
                                    <td>${r.customerName || 'Unknown'}</td>
                                    <td>${(r.reason || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
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
                                </tr>`).join('')}
                                ${returns.length === 0 ? '<tr><td colspan="8" class="text-center text-muted py-4">No return requests</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>`;
        } catch (err) {
            content.innerHTML = `<div class="text-center py-5 text-danger">${err.message}</div>`;
            AdminComponents.showToast(err.message, 'error');
        }
    },

    updateStatus(returnId, status) {
        const action = status === 'approved' ? 'approve' : 'reject';
        AdminComponents.showConfirm(`${action.charAt(0).toUpperCase() + action.slice(1)} Return`, `Are you sure you want to ${action} this return request?`, async () => {
            try {
                const response = await HJKAPI.admin.returns.update({
                    id: returnId,
                    status: status,
                    adminNote: `Return ${status} by admin`
                });
                if (!response.success) throw new Error(response.message);

                AdminComponents.showToast(`Return ${status}`, 'success');
                this.render();
            } catch (err) {
                AdminComponents.showToast(err.message, 'error');
            }
        });
    }
};
