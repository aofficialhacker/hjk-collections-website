/* ============================================
   HJKCollections - Admin CMS Pages
   ============================================ */

const AdminCMS = {
    init() {
        if (!AdminComponents.getAdminPageShell('cms', 'CMS Pages')) return;
        this.render();
    },

    async render() {
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        try {
            const response = await HJKAPI.admin.cms.list();
            if (!response.success) throw new Error(response.message || 'Failed to load pages');

            const pages = response.data || [];

            content.innerHTML = `
                <div class="admin-card">
                    <div class="admin-card-header"><h5>Manage Pages</h5></div>
                    <div class="admin-card-body" style="padding:0">
                        <table class="admin-table">
                            <thead><tr><th>#</th><th>Title</th><th>Slug</th><th>Last Updated</th><th>Actions</th></tr></thead>
                            <tbody>
                                ${pages.map((p, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td style="font-weight:600">${p.title}</td>
                                        <td><code style="font-size:0.8rem">${p.slug}</code></td>
                                        <td style="font-size:0.82rem">${p.updatedAt ? HJKUtils.formatDate(p.updatedAt) : HJKUtils.formatDate(p.createdAt)}</td>
                                        <td>
                                            <a href="edit-page.html?id=${p.id}" class="table-action-btn edit"><i class="fa-solid fa-pen"></i></a>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>`;
        } catch (err) {
            content.innerHTML = `<div class="text-center py-5 text-danger">${err.message}</div>`;
            AdminComponents.showToast(err.message, 'error');
        }
    },

    initEdit() {
        if (!AdminComponents.getAdminPageShell('cms', 'Edit Page')) return;
        this.loadEdit();
    },

    async loadEdit() {
        const id = HJKUtils.getUrlParam('id');
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        try {
            const response = await HJKAPI.admin.cms.list();
            if (!response.success) throw new Error(response.message);

            const page = (response.data || []).find(p => p.id == id);
            if (!page) { content.innerHTML = '<p class="text-center text-muted py-5">Page not found</p>'; return; }

            content.innerHTML = `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h5>Edit: ${page.title}</h5>
                        <a href="pages.html" class="btn-outline-custom btn-sm"><i class="fa-solid fa-arrow-left me-1"></i>Back</a>
                    </div>
                    <div class="admin-card-body">
                        <form class="admin-form" onsubmit="AdminCMS.savePage(event,'${id}')">
                            <div class="form-group">
                                <label>Page Title</label>
                                <input type="text" id="pageTitle" value="${page.title}" required>
                            </div>
                            <div class="form-group">
                                <label>Meta Description</label>
                                <input type="text" id="pageMeta" value="${page.metaDescription || ''}" placeholder="SEO description">
                            </div>
                            <div class="form-group">
                                <label>Content (HTML)</label>
                                <textarea id="pageContent" rows="15" style="font-family:monospace;font-size:0.85rem">${page.content || ''}</textarea>
                            </div>
                            <button type="submit" class="btn-primary-custom"><i class="fa-solid fa-save me-1"></i>Save Page</button>
                        </form>
                    </div>
                </div>`;
        } catch (err) {
            content.innerHTML = `<div class="text-center py-5 text-danger">${err.message}</div>`;
            AdminComponents.showToast(err.message, 'error');
        }
    },

    async savePage(e, id) {
        e.preventDefault();

        try {
            const data = {
                id: id,
                title: document.getElementById('pageTitle').value.trim(),
                metaDescription: document.getElementById('pageMeta').value.trim(),
                content: document.getElementById('pageContent').value
            };

            const response = await HJKAPI.admin.cms.save(data);
            if (!response.success) throw new Error(response.message);

            AdminComponents.showToast('Page updated!', 'success');
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
        }
    }
};
