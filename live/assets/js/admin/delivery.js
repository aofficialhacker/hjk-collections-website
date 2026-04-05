/* ============================================
   HJKCollections - Admin Delivery Options
   ============================================ */

const AdminDelivery = {
    init() {
        if (!AdminComponents.getAdminPageShell('delivery', 'Delivery Options')) return;
        this.render();
    },

    async render() {
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        try {
            const response = await HJKAPI.admin.delivery.list();
            if (!response.success) throw new Error(response.message || 'Failed to load delivery options');

            const options = response.data || [];

            content.innerHTML = `
                <div class="admin-toolbar">
                    <div class="toolbar-left"><h5 class="font-heading mb-0">Manage Delivery Methods</h5></div>
                    <div class="toolbar-right">
                        <button class="btn-primary-custom btn-sm" onclick="AdminDelivery.showForm()"><i class="fa-solid fa-plus me-1"></i>Add Method</button>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="admin-card-body" style="padding:0">
                        <table class="admin-table">
                            <thead><tr><th>#</th><th>Name</th><th>Est. Days</th><th>Cost</th><th>Free Above</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                ${options.map((d, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td style="font-weight:600">${d.name}</td>
                                        <td>${d.estimatedDays} days</td>
                                        <td>${HJKUtils.formatPrice(d.cost)}</td>
                                        <td>${d.freeAbove ? HJKUtils.formatPrice(d.freeAbove) : '-'}</td>
                                        <td>
                                            <label class="toggle-switch">
                                                <input type="checkbox" ${d.isActive ? 'checked' : ''} onchange="AdminDelivery.toggleStatus('${d.id}')">
                                                <span class="toggle-slider"></span>
                                            </label>
                                        </td>
                                        <td>
                                            <div class="table-actions">
                                                <button class="table-action-btn edit" onclick="AdminDelivery.showForm('${d.id}')"><i class="fa-solid fa-pen"></i></button>
                                                <button class="table-action-btn delete" onclick="AdminDelivery.delete('${d.id}')"><i class="fa-solid fa-trash"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${options.length === 0 ? '<tr><td colspan="7" class="text-center text-muted py-4">No delivery options</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="deliveryFormModal"></div>`;
        } catch (err) {
            content.innerHTML = `<div class="text-center py-5 text-danger">${err.message}</div>`;
            AdminComponents.showToast(err.message, 'error');
        }
    },

    async toggleStatus(id) {
        try {
            const response = await HJKAPI.admin.delivery.toggle(id);
            if (!response.success) throw new Error(response.message);
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
            this.render();
        }
    },

    delete(id) {
        AdminComponents.showConfirm('Delete Delivery Method', 'Are you sure?', async () => {
            try {
                const response = await HJKAPI.admin.delivery.delete(id);
                if (!response.success) throw new Error(response.message);
                AdminComponents.showToast('Delivery method deleted', 'success');
                this.render();
            } catch (err) {
                AdminComponents.showToast(err.message, 'error');
            }
        });
    },

    async showForm(id) {
        let opt = null;
        if (id) {
            try {
                const response = await HJKAPI.admin.delivery.list();
                if (response.success) {
                    opt = (response.data || []).find(d => d.id === id) || null;
                }
            } catch (err) {
                AdminComponents.showToast(err.message, 'error');
                return;
            }
        }

        const modal = document.getElementById('deliveryFormModal');
        modal.innerHTML = `
            <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center">
                <div style="background:#fff;border-radius:var(--radius-lg);padding:30px;max-width:500px;width:90%">
                    <h5 class="font-heading mb-3">${opt ? 'Edit' : 'Add'} Delivery Method</h5>
                    <form class="admin-form" onsubmit="AdminDelivery.save(event,'${id || ''}')">
                        <div class="form-group"><label>Name *</label><input type="text" id="delName" required value="${opt?.name || ''}" placeholder="e.g., Standard Shipping"></div>
                        <div class="row g-3">
                            <div class="col-6"><div class="form-group"><label>Estimated Days *</label><input type="text" id="delDays" required value="${opt?.estimatedDays || ''}" placeholder="e.g., 5-7"></div></div>
                            <div class="col-6"><div class="form-group"><label>Cost (₹) *</label><input type="number" id="delCost" required value="${opt?.cost || ''}" placeholder="0"></div></div>
                        </div>
                        <div class="form-group"><label>Free Above (₹)</label><input type="number" id="delFreeAbove" value="${opt?.freeAbove || ''}" placeholder="e.g., 1500"></div>
                        <div class="d-flex gap-3 mt-3">
                            <button type="submit" class="btn-primary-custom btn-sm"><i class="fa-solid fa-save me-1"></i>Save</button>
                            <button type="button" class="btn-outline-custom btn-sm" onclick="document.getElementById('deliveryFormModal').innerHTML=''">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>`;
    },

    async save(e, id) {
        e.preventDefault();
        const name = document.getElementById('delName').value.trim();
        const estimatedDays = document.getElementById('delDays').value.trim();
        const cost = parseFloat(document.getElementById('delCost').value) || 0;
        const freeAbove = parseFloat(document.getElementById('delFreeAbove').value) || 0;

        try {
            const data = { name, estimatedDays, cost, freeAbove };
            if (id) data.id = id;

            const response = await HJKAPI.admin.delivery.save(data);
            if (!response.success) throw new Error(response.message);

            AdminComponents.showToast(`Delivery method ${id ? 'updated' : 'created'}`, 'success');
            this.render();
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
        }
    }
};
