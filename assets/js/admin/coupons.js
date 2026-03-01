/* ============================================
   HJKCollections - Admin Coupons Management
   ============================================ */

const AdminCoupons = {
    init() {
        if (!AdminComponents.getAdminPageShell('coupons', 'Coupons')) return;
        this.render();
    },

    render() {
        const content = document.getElementById('adminContent');
        const coupons = HJKUtils.store.get('hjk_coupons') || [];

        content.innerHTML = `
            <div class="admin-toolbar">
                <div class="toolbar-left"><h5 class="font-heading mb-0">Manage Coupons</h5></div>
                <div class="toolbar-right">
                    <a href="form.html" class="btn-primary-custom btn-sm"><i class="fa-solid fa-plus me-1"></i>Add Coupon</a>
                </div>
            </div>

            <div class="admin-card">
                <div class="admin-card-body" style="padding:0;overflow-x:auto">
                    <table class="admin-table">
                        <thead><tr><th>#</th><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Max Discount</th><th>Usage</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${coupons.map((c, i) => {
                                const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                                return `<tr>
                                    <td>${i + 1}</td>
                                    <td><code style="font-weight:700;font-size:0.9rem;color:var(--secondary)">${c.code}</code></td>
                                    <td>${c.type === 'percentage' ? 'Percentage' : 'Fixed'}</td>
                                    <td>${c.type === 'percentage' ? c.value + '%' : HJKUtils.formatPrice(c.value)}</td>
                                    <td>${c.minOrderAmount ? HJKUtils.formatPrice(c.minOrderAmount) : '-'}</td>
                                    <td>${c.maxDiscount ? HJKUtils.formatPrice(c.maxDiscount) : '-'}</td>
                                    <td>${c.usedCount || 0}/${c.usageLimit || '∞'}</td>
                                    <td style="font-size:0.82rem">${c.expiryDate ? HJKUtils.formatDate(c.expiryDate) : 'No expiry'} ${isExpired ? '<span style="color:var(--danger);font-size:0.75rem">(Expired)</span>' : ''}</td>
                                    <td>
                                        <label class="toggle-switch">
                                            <input type="checkbox" ${c.isActive ? 'checked' : ''} onchange="AdminCoupons.toggleStatus('${c.id}',this.checked)">
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <div class="table-actions">
                                            <a href="form.html?id=${c.id}" class="table-action-btn edit"><i class="fa-solid fa-pen"></i></a>
                                            <button class="table-action-btn delete" onclick="AdminCoupons.delete('${c.id}')"><i class="fa-solid fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>`;
                            }).join('')}
                            ${coupons.length === 0 ? '<tr><td colspan="10" class="text-center text-muted py-4">No coupons found</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>`;
    },

    toggleStatus(id, isActive) {
        const coupons = HJKUtils.store.get('hjk_coupons') || [];
        const c = coupons.find(x => x.id === id);
        if (c) { c.isActive = isActive; HJKUtils.store.set('hjk_coupons', coupons); }
    },

    delete(id) {
        AdminComponents.showConfirm('Delete Coupon', 'Are you sure?', () => {
            let coupons = HJKUtils.store.get('hjk_coupons') || [];
            coupons = coupons.filter(c => c.id !== id);
            HJKUtils.store.set('hjk_coupons', coupons);
            AdminComponents.showToast('Coupon deleted', 'success');
            this.render();
        });
    },

    // Coupon Form
    initForm() {
        if (!AdminComponents.getAdminPageShell('coupons', 'Coupon Form')) return;
        const id = HJKUtils.getUrlParam('id');
        const coupons = HJKUtils.store.get('hjk_coupons') || [];
        const coupon = id ? coupons.find(c => c.id === id) : null;
        const content = document.getElementById('adminContent');

        content.innerHTML = `
            <div class="admin-card">
                <div class="admin-card-header">
                    <h5>${coupon ? 'Edit' : 'Add'} Coupon</h5>
                    <a href="index.html" class="btn-outline-custom btn-sm"><i class="fa-solid fa-arrow-left me-1"></i>Back</a>
                </div>
                <div class="admin-card-body">
                    <form class="admin-form" onsubmit="AdminCoupons.saveForm(event,'${id || ''}')" style="max-width:600px">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="form-group"><label>Coupon Code *</label><input type="text" id="cpCode" required value="${coupon?.code || ''}" placeholder="e.g., SAVE20" style="text-transform:uppercase"></div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Discount Type *</label>
                                    <select id="cpType" required>
                                        <option value="percentage" ${coupon?.type === 'percentage' ? 'selected' : ''}>Percentage (%)</option>
                                        <option value="fixed" ${coupon?.type === 'fixed' ? 'selected' : ''}>Fixed Amount (₹)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-md-4"><div class="form-group"><label>Value *</label><input type="number" id="cpValue" required value="${coupon?.value || ''}" placeholder="e.g., 20"></div></div>
                            <div class="col-md-4"><div class="form-group"><label>Min Order Amount</label><input type="number" id="cpMinOrder" value="${coupon?.minOrderAmount || ''}" placeholder="₹0"></div></div>
                            <div class="col-md-4"><div class="form-group"><label>Max Discount</label><input type="number" id="cpMaxDiscount" value="${coupon?.maxDiscount || ''}" placeholder="₹0"></div></div>
                        </div>
                        <div class="row g-3">
                            <div class="col-md-4"><div class="form-group"><label>Usage Limit</label><input type="number" id="cpUsageLimit" value="${coupon?.usageLimit || ''}" placeholder="Unlimited"></div></div>
                            <div class="col-md-4"><div class="form-group"><label>Per User Limit</label><input type="number" id="cpPerUser" value="${coupon?.perUserLimit || ''}" placeholder="1"></div></div>
                            <div class="col-md-4"><div class="form-group"><label>Expiry Date</label><input type="date" id="cpExpiry" value="${coupon?.expiryDate ? coupon.expiryDate.split('T')[0] : ''}"></div></div>
                        </div>
                        <div class="form-group"><label class="d-flex align-items-center gap-2"><input type="checkbox" id="cpActive" ${coupon ? (coupon.isActive ? 'checked' : '') : 'checked'}> Active</label></div>
                        <button type="submit" class="btn-primary-custom"><i class="fa-solid fa-save me-1"></i>${coupon ? 'Update' : 'Create'} Coupon</button>
                    </form>
                </div>
            </div>`;
    },

    saveForm(e, id) {
        e.preventDefault();
        const code = document.getElementById('cpCode').value.trim().toUpperCase();
        const type = document.getElementById('cpType').value;
        const value = parseFloat(document.getElementById('cpValue').value) || 0;
        const minOrderAmount = parseFloat(document.getElementById('cpMinOrder').value) || 0;
        const maxDiscount = parseFloat(document.getElementById('cpMaxDiscount').value) || 0;
        const usageLimit = parseInt(document.getElementById('cpUsageLimit').value) || 0;
        const perUserLimit = parseInt(document.getElementById('cpPerUser').value) || 1;
        const expiryDate = document.getElementById('cpExpiry').value ? new Date(document.getElementById('cpExpiry').value).toISOString() : null;
        const isActive = document.getElementById('cpActive').checked;

        if (!code || !value) { AdminComponents.showToast('Please fill required fields', 'error'); return; }

        const coupons = HJKUtils.store.get('hjk_coupons') || [];
        if (id) {
            const c = coupons.find(x => x.id === id);
            if (c) Object.assign(c, { code, type, value, minOrderAmount, maxDiscount, usageLimit, perUserLimit, expiryDate, isActive });
        } else {
            coupons.push({ id: HJKUtils.generateId('coupon'), code, type, value, minOrderAmount, maxDiscount, usageLimit, perUserLimit, expiryDate, isActive, usedCount: 0, createdAt: new Date().toISOString() });
        }
        HJKUtils.store.set('hjk_coupons', coupons);
        AdminComponents.showToast(`Coupon ${id ? 'updated' : 'created'}!`, 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 500);
    }
};
