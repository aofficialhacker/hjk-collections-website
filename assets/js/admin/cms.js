/* ============================================
   HJKCollections - Admin CMS Pages
   ============================================ */

const AdminCMS = {
    init() {
        if (!AdminComponents.getAdminPageShell('cms', 'CMS Pages')) return;
        this.render();
    },

    render() {
        const content = document.getElementById('adminContent');
        const pages = HJKUtils.store.get('hjk_cms_pages') || [];

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
    },

    initEdit() {
        if (!AdminComponents.getAdminPageShell('cms', 'Edit Page')) return;
        const id = HJKUtils.getUrlParam('id');
        const pages = HJKUtils.store.get('hjk_cms_pages') || [];
        const page = pages.find(p => p.id === id);
        const content = document.getElementById('adminContent');

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
    },

    savePage(e, id) {
        e.preventDefault();
        const pages = HJKUtils.store.get('hjk_cms_pages') || [];
        const page = pages.find(p => p.id === id);
        if (page) {
            page.title = document.getElementById('pageTitle').value.trim();
            page.metaDescription = document.getElementById('pageMeta').value.trim();
            page.content = document.getElementById('pageContent').value;
            page.updatedAt = new Date().toISOString();
            HJKUtils.store.set('hjk_cms_pages', pages);
            AdminComponents.showToast('Page updated!', 'success');
        }
    }
};
