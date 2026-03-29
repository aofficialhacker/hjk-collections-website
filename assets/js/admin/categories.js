/* ============================================
   HJKCollections - Admin Categories Management
   ============================================ */

const AdminCategories = {
    init() {
        if (!AdminComponents.getAdminPageShell('categories', 'Categories')) return;
        this.render();
    },

    async render() {
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        try {
            const response = await HJKAPI.admin.categories.list();
            if (!response.success) throw new Error(response.message || 'Failed to load categories');

            const categories = response.data || [];

            content.innerHTML = `
                <div class="admin-toolbar">
                    <div class="toolbar-left">
                        <div class="admin-search">
                            <i class="fa-solid fa-search"></i>
                            <input type="text" placeholder="Search categories..." oninput="AdminCategories.search(this.value)">
                        </div>
                    </div>
                    <div class="toolbar-right">
                        <a href="form.html" class="btn-primary-custom btn-sm"><i class="fa-solid fa-plus me-1"></i>Add Category</a>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="admin-card-body" style="padding:0">
                        <table class="admin-table" id="categoriesTable">
                            <thead>
                                <tr><th style="width:50px">#</th><th style="width:60px">Image</th><th>Name</th><th>Slug</th><th>Products</th><th>Status</th><th style="width:120px">Actions</th></tr>
                            </thead>
                            <tbody>
                                ${categories.map((cat, i) => `<tr data-name="${cat.name.toLowerCase()}">
                                    <td>${i + 1}</td>
                                    <td><img src="${cat.image}" class="table-img" alt="${cat.name}"></td>
                                    <td style="font-weight:600">${cat.name}</td>
                                    <td><code style="font-size:0.8rem">${cat.slug}</code></td>
                                    <td>${cat.productCount || 0}</td>
                                    <td>
                                        <label class="toggle-switch">
                                            <input type="checkbox" ${cat.isActive ? 'checked' : ''} onchange="AdminCategories.toggleStatus('${cat.id}')">
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <div class="table-actions">
                                            <a href="form.html?id=${cat.id}" class="table-action-btn edit" title="Edit"><i class="fa-solid fa-pen"></i></a>
                                            <button class="table-action-btn delete" title="Delete" onclick="AdminCategories.delete('${cat.id}')"><i class="fa-solid fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>`).join('')}
                                ${categories.length === 0 ? '<tr><td colspan="7" class="text-center text-muted py-4">No categories found</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>`;
        } catch (err) {
            content.innerHTML = `<div class="text-center py-5 text-danger">${err.message}</div>`;
            AdminComponents.showToast(err.message, 'error');
        }
    },

    search(query) {
        const rows = document.querySelectorAll('#categoriesTable tbody tr');
        rows.forEach(row => {
            const name = row.dataset.name || '';
            row.style.display = name.includes(query.toLowerCase()) ? '' : 'none';
        });
    },

    async toggleStatus(id) {
        try {
            const response = await HJKAPI.admin.categories.toggle(id);
            if (!response.success) throw new Error(response.message);
            AdminComponents.showToast('Category status updated', 'success');
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
            this.render();
        }
    },

    delete(id) {
        AdminComponents.showConfirm('Delete Category', 'Are you sure you want to delete this category?', async () => {
            try {
                const response = await HJKAPI.admin.categories.delete(id);
                if (!response.success) throw new Error(response.message);
                AdminComponents.showToast('Category deleted', 'success');
                this.render();
            } catch (err) {
                AdminComponents.showToast(err.message, 'error');
            }
        });
    },

    // Category Form
    initForm() {
        if (!AdminComponents.getAdminPageShell('categories', 'Category Form')) return;
        this.loadForm();
    },

    async loadForm() {
        const id = HJKUtils.getUrlParam('id');
        const content = document.getElementById('adminContent');
        let category = null;

        if (id) {
            try {
                const response = await HJKAPI.admin.categories.list();
                if (response.success) {
                    category = (response.data || []).find(c => c.id === id) || null;
                }
            } catch (err) {
                AdminComponents.showToast(err.message, 'error');
            }
        }

        content.innerHTML = `
            <div class="admin-card">
                <div class="admin-card-header">
                    <h5>${category ? 'Edit' : 'Add'} Category</h5>
                    <a href="index.html" class="btn-outline-custom btn-sm"><i class="fa-solid fa-arrow-left me-1"></i>Back</a>
                </div>
                <div class="admin-card-body">
                    <form class="admin-form" onsubmit="AdminCategories.saveForm(event, '${id || ''}')" style="max-width:600px">
                        <div class="form-group">
                            <label>Category Name *</label>
                            <input type="text" id="catName" required value="${category?.name || ''}" placeholder="Enter category name">
                        </div>
                        <div class="form-group">
                            <label>Slug</label>
                            <input type="text" id="catSlug" value="${category?.slug || ''}" placeholder="auto-generated-from-name">
                            <div class="form-help">Leave empty to auto-generate from name</div>
                        </div>
                        <div class="form-group">
                            <label>Category Image *</label>
                            <input type="file" id="catImageFile" accept="image/jpeg,image/png,image/webp,image/gif" onchange="AdminCategories.handleImageUpload(this)" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:var(--radius-sm);background:#fff">
                            <input type="hidden" id="catImage" value="${category?.image || ''}">
                        </div>
                        <div class="mb-3" id="catImagePreview">
                            ${category?.image ? `<div style="position:relative;display:inline-block"><img src="${category.image}" style="width:120px;height:120px;object-fit:cover;border-radius:var(--radius-md)"><button type="button" onclick="AdminCategories.removeImage()" style="position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;border:none;font-size:12px;cursor:pointer">&times;</button></div>` : ''}
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="catDesc" rows="3" placeholder="Category description">${category?.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="d-flex align-items-center gap-2">
                                <input type="checkbox" id="catActive" ${category ? (category.isActive ? 'checked' : '') : 'checked'}>
                                Active
                            </label>
                        </div>
                        <button type="submit" class="btn-primary-custom"><i class="fa-solid fa-save me-1"></i>${category ? 'Update' : 'Create'} Category</button>
                    </form>
                </div>
            </div>`;
    },

    async handleImageUpload(input) {
        const file = input.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        const preview = document.getElementById('catImagePreview');
        preview.innerHTML = '<div style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:var(--radius-md)"><i class="fa-solid fa-spinner fa-spin fa-lg"></i></div>';

        try {
            const res = await HJKAPI.admin.categories.uploadImage(formData);
            if (res.success && res.data.url) {
                document.getElementById('catImage').value = res.data.url;
                preview.innerHTML = `<div style="position:relative;display:inline-block"><img src="${res.data.url}" style="width:120px;height:120px;object-fit:cover;border-radius:var(--radius-md)"><button type="button" onclick="AdminCategories.removeImage()" style="position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;border:none;font-size:12px;cursor:pointer">&times;</button></div>`;
                AdminComponents.showToast('Image uploaded', 'success');
            }
        } catch (err) {
            preview.innerHTML = '';
            AdminComponents.showToast(err.message || 'Failed to upload image', 'error');
        }
        input.value = '';
    },

    removeImage() {
        document.getElementById('catImage').value = '';
        document.getElementById('catImagePreview').innerHTML = '';
    },

    async saveForm(e, id) {
        e.preventDefault();
        const name = document.getElementById('catName').value.trim();
        const slug = document.getElementById('catSlug').value.trim() || HJKUtils.slugify(name);
        const image = document.getElementById('catImage').value.trim();
        const description = document.getElementById('catDesc').value.trim();
        const isActive = document.getElementById('catActive').checked;

        if (!name || !image) { AdminComponents.showToast('Please fill required fields', 'error'); return; }

        try {
            const data = { name, slug, image, description, isActive };
            if (id) data.id = id;

            const response = await HJKAPI.admin.categories.save(data);
            if (!response.success) throw new Error(response.message);

            AdminComponents.showToast(`Category ${id ? 'updated' : 'created'}!`, 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 500);
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
        }
    }
};
