/* ============================================
   HJKCollections - Admin Reviews Management
   ============================================ */

const AdminReviews = {
    filterStatus: '',

    init() {
        if (!AdminComponents.getAdminPageShell('reviews', 'Reviews')) return;
        this.render();
    },

    async render() {
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        try {
            const params = {};
            if (this.filterStatus) params.status = this.filterStatus;

            const response = await HJKAPI.admin.reviews.list(params);
            if (!response.success) throw new Error(response.message || 'Failed to load reviews');

            const reviews = response.data || [];

            content.innerHTML = `
                <div class="admin-toolbar">
                    <div class="toolbar-left">
                        <select class="admin-filter-select" onchange="AdminReviews.filterStatus=this.value;AdminReviews.render()">
                            <option value="">All Reviews</option>
                            <option value="pending" ${this.filterStatus === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="approved" ${this.filterStatus === 'approved' ? 'selected' : ''}>Approved</option>
                            <option value="rejected" ${this.filterStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="admin-card-body" style="padding:0;overflow-x:auto">
                        <table class="admin-table">
                            <thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Comment</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                            <tbody>
                                ${reviews.map(r => `<tr>
                                    <td style="font-weight:600;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.productName || 'Unknown'}</td>
                                    <td>${r.customerName || 'Unknown'}</td>
                                    <td>${HJKUtils.renderStars(r.rating)}</td>
                                    <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.comment || '-'}</td>
                                    <td>${HJKUtils.getStatusBadge(r.status)}</td>
                                    <td style="font-size:0.82rem">${HJKUtils.formatDate(r.createdAt)}</td>
                                    <td>
                                        <div class="table-actions">
                                            ${r.status === 'pending' ? `
                                                <button class="table-action-btn edit" title="Approve" onclick="AdminReviews.updateStatus('${r.id}','approved')"><i class="fa-solid fa-check"></i></button>
                                                <button class="table-action-btn delete" title="Reject" onclick="AdminReviews.updateStatus('${r.id}','rejected')"><i class="fa-solid fa-xmark"></i></button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>`).join('')}
                                ${reviews.length === 0 ? '<tr><td colspan="7" class="text-center text-muted py-4">No reviews found</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>`;
        } catch (err) {
            content.innerHTML = `<div class="text-center py-5 text-danger">${err.message}</div>`;
            AdminComponents.showToast(err.message, 'error');
        }
    },

    async updateStatus(reviewId, status) {
        try {
            const response = await HJKAPI.admin.reviews.update({
                id: reviewId,
                status: status
            });
            if (!response.success) throw new Error(response.message);
            AdminComponents.showToast(`Review ${status}`, 'success');
            this.render();
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
        }
    }
};
