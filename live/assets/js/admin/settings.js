/* ============================================
   HJKCollections - Admin Settings
   ============================================ */

const AdminSettings = {
    async initGeneral() {
        if (!AdminComponents.getAdminPageShell('settings', 'General Settings')) return;
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        try {
            const response = await HJKAPI.admin.settings.get();
            if (!response.success) throw new Error(response.message || 'Failed to load settings');

            const settings = response.data || {};

            content.innerHTML = `
                <div class="admin-card">
                    <div class="admin-card-header"><h5>General Settings</h5></div>
                    <div class="admin-card-body">
                        <form class="admin-form" onsubmit="AdminSettings.saveGeneral(event)" style="max-width:700px">
                            <h6 class="font-heading mb-3">Site Information</h6>
                            <div class="row g-3 mb-4">
                                <div class="col-md-6"><div class="form-group"><label>Site Name</label><input type="text" id="siteName" value="${settings.siteName || 'HJKCollections'}"></div></div>
                                <div class="col-md-6"><div class="form-group"><label>Tagline</label><input type="text" id="siteTagline" value="${settings.tagline || ''}"></div></div>
                                <div class="col-md-6"><div class="form-group"><label>Email</label><input type="email" id="siteEmail" value="${settings.email || ''}"></div></div>
                                <div class="col-md-6"><div class="form-group"><label>Phone</label><input type="tel" id="sitePhone" value="${settings.phone || ''}"></div></div>
                                <div class="col-md-6"><div class="form-group"><label>WhatsApp</label><input type="tel" id="siteWhatsapp" value="${settings.whatsapp || ''}"></div></div>
                                <div class="col-12"><div class="form-group"><label>Address</label><textarea id="siteAddress" rows="2">${settings.address || ''}</textarea></div></div>
                            </div>

                            <h6 class="font-heading mb-3">Social Media Links</h6>
                            <div class="row g-3 mb-4">
                                <div class="col-md-6"><div class="form-group"><label><i class="fa-brands fa-facebook me-1"></i>Facebook</label><input type="url" id="socialFb" value="${settings.socialLinks?.facebook || ''}"></div></div>
                                <div class="col-md-6"><div class="form-group"><label><i class="fa-brands fa-instagram me-1"></i>Instagram</label><input type="url" id="socialIg" value="${settings.socialLinks?.instagram || ''}"></div></div>
                                <div class="col-md-6"><div class="form-group"><label><i class="fa-brands fa-twitter me-1"></i>Twitter</label><input type="url" id="socialTw" value="${settings.socialLinks?.twitter || ''}"></div></div>
                                <div class="col-md-6"><div class="form-group"><label><i class="fa-brands fa-youtube me-1"></i>YouTube</label><input type="url" id="socialYt" value="${settings.socialLinks?.youtube || ''}"></div></div>
                            </div>

                            <h6 class="font-heading mb-3">Google Maps</h6>
                            <div class="form-group">
                                <label>Map Embed URL</label>
                                <input type="url" id="mapUrl" value="${settings.mapUrl || ''}" placeholder="Google Maps embed URL">
                            </div>

                            <button type="submit" class="btn-primary-custom"><i class="fa-solid fa-save me-1"></i>Save Settings</button>
                        </form>
                    </div>
                </div>`;
        } catch (err) {
            content.innerHTML = `<div class="text-center py-5 text-danger">${err.message}</div>`;
            AdminComponents.showToast(err.message, 'error');
        }
    },

    async saveGeneral(e) {
        e.preventDefault();

        try {
            const data = {
                siteName: document.getElementById('siteName').value.trim(),
                tagline: document.getElementById('siteTagline').value.trim(),
                email: document.getElementById('siteEmail').value.trim(),
                phone: document.getElementById('sitePhone').value.trim(),
                whatsapp: document.getElementById('siteWhatsapp').value.trim(),
                address: document.getElementById('siteAddress').value.trim(),
                socialLinks: {
                    facebook: document.getElementById('socialFb').value.trim(),
                    instagram: document.getElementById('socialIg').value.trim(),
                    twitter: document.getElementById('socialTw').value.trim(),
                    youtube: document.getElementById('socialYt').value.trim()
                },
                mapUrl: document.getElementById('mapUrl').value.trim()
            };

            const response = await HJKAPI.admin.settings.save(data);
            if (!response.success) throw new Error(response.message);

            AdminComponents.showToast('Settings saved!', 'success');
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
        }
    },

    async initBanners() {
        if (!AdminComponents.getAdminPageShell('banners', 'Banners')) return;
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        try {
            const response = await HJKAPI.admin.banners.list();
            if (!response.success) throw new Error(response.message || 'Failed to load banners');

            const banners = response.data || [];

            content.innerHTML = `
                <div class="admin-toolbar">
                    <div class="toolbar-left"><h5 class="font-heading mb-0">Manage Banners</h5></div>
                    <div class="toolbar-right">
                        <button class="btn-primary-custom btn-sm" onclick="AdminSettings.showBannerForm()"><i class="fa-solid fa-plus me-1"></i>Add Banner</button>
                    </div>
                </div>

                <div class="row g-4" id="bannersGrid">
                    ${banners.map(b => `
                        <div class="col-md-6">
                            <div class="admin-card">
                                <div style="position:relative">
                                    <img src="${b.image}" style="width:100%;height:200px;object-fit:cover;border-radius:var(--radius-lg) var(--radius-lg) 0 0">
                                    <div style="position:absolute;top:10px;right:10px;display:flex;gap:6px">
                                        <button class="table-action-btn edit" style="background:#fff" onclick="AdminSettings.showBannerForm('${b.id}')"><i class="fa-solid fa-pen"></i></button>
                                        <button class="table-action-btn delete" style="background:#fff" onclick="AdminSettings.deleteBanner('${b.id}')"><i class="fa-solid fa-trash"></i></button>
                                    </div>
                                </div>
                                <div style="padding:16px">
                                    <h6 style="font-weight:600;margin-bottom:4px">${b.title}</h6>
                                    <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:4px">${b.subtitle || ''}</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span style="font-size:0.78rem;color:var(--text-muted)">Link: ${b.link || '-'}</span>
                                        <label class="toggle-switch" style="transform:scale(0.8)">
                                            <input type="checkbox" ${b.isActive ? 'checked' : ''} onchange="AdminSettings.toggleBanner('${b.id}')">
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    ${banners.length === 0 ? '<div class="col-12"><p class="text-center text-muted py-4">No banners yet</p></div>' : ''}
                </div>
                <div id="bannerFormModal"></div>`;
        } catch (err) {
            content.innerHTML = `<div class="text-center py-5 text-danger">${err.message}</div>`;
            AdminComponents.showToast(err.message, 'error');
        }
    },

    async showBannerForm(id) {
        let banner = null;
        if (id) {
            try {
                const response = await HJKAPI.admin.banners.list();
                if (response.success) {
                    banner = (response.data || []).find(b => b.id === id) || null;
                }
            } catch (err) {
                AdminComponents.showToast(err.message, 'error');
                return;
            }
        }

        document.getElementById('bannerFormModal').innerHTML = `
            <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center">
                <div style="background:#fff;border-radius:var(--radius-lg);padding:30px;max-width:500px;width:90%">
                    <h5 class="font-heading mb-3">${banner ? 'Edit' : 'Add'} Banner</h5>
                    <form class="admin-form" onsubmit="AdminSettings.saveBanner(event,'${id || ''}')">
                        <div class="form-group"><label>Title *</label><input type="text" id="banTitle" required value="${banner?.title || ''}"></div>
                        <div class="form-group"><label>Subtitle</label><input type="text" id="banSubtitle" value="${banner?.subtitle || ''}"></div>
                        <div class="form-group"><label>Image URL *</label><input type="url" id="banImage" required value="${banner?.image || ''}"></div>
                        <div class="form-group"><label>Button Text</label><input type="text" id="banBtnText" value="${banner?.buttonText || ''}"></div>
                        <div class="form-group"><label>Link</label><input type="text" id="banLink" value="${banner?.link || ''}"></div>
                        <div class="d-flex gap-3">
                            <button type="submit" class="btn-primary-custom btn-sm">Save</button>
                            <button type="button" class="btn-outline-custom btn-sm" onclick="document.getElementById('bannerFormModal').innerHTML=''">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>`;
    },

    async saveBanner(e, id) {
        e.preventDefault();

        try {
            const data = {
                title: document.getElementById('banTitle').value.trim(),
                subtitle: document.getElementById('banSubtitle').value.trim(),
                image: document.getElementById('banImage').value.trim(),
                buttonText: document.getElementById('banBtnText').value.trim(),
                link: document.getElementById('banLink').value.trim(),
                isActive: true
            };
            if (id) data.id = id;

            const response = await HJKAPI.admin.banners.save(data);
            if (!response.success) throw new Error(response.message);

            AdminComponents.showToast('Banner saved!', 'success');
            this.initBanners();
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
        }
    },

    async toggleBanner(id) {
        try {
            const response = await HJKAPI.admin.banners.toggle(id);
            if (!response.success) throw new Error(response.message);
        } catch (err) {
            AdminComponents.showToast(err.message, 'error');
            this.initBanners();
        }
    },

    deleteBanner(id) {
        AdminComponents.showConfirm('Delete Banner', 'Are you sure?', async () => {
            try {
                const response = await HJKAPI.admin.banners.delete(id);
                if (!response.success) throw new Error(response.message);
                AdminComponents.showToast('Banner deleted', 'success');
                this.initBanners();
            } catch (err) {
                AdminComponents.showToast(err.message, 'error');
            }
        });
    }
};
