/* ============================================
   HJKCollections - Admin Components
   ============================================ */

const AdminComponents = {
    // Compute base path from current page to admin root
    getAdminBase() {
        const path = window.location.pathname;
        // Check if we're in a subdirectory under admin (e.g., admin/categories/, admin/products/)
        const adminIdx = path.indexOf('/admin/');
        if (adminIdx === -1) return '';
        const afterAdmin = path.substring(adminIdx + 7); // after "/admin/"
        const depth = (afterAdmin.match(/\//g) || []).length;
        if (depth >= 1) return '../';
        return '';
    },

    renderSidebar(activePage) {
        const sidebar = document.getElementById('adminSidebar');
        if (!sidebar) return;

        const base = this.getAdminBase();

        // Sidebar badges will be loaded asynchronously
        const navItems = [
            { section: 'Main' },
            { key: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high', url: base + 'index.html' },

            { section: 'Catalog' },
            { key: 'categories', label: 'Categories', icon: 'fa-layer-group', url: base + 'categories/index.html' },
            { key: 'products', label: 'Products', icon: 'fa-box', url: base + 'products/index.html' },

            { section: 'Sales' },
            { key: 'orders', label: 'Orders', icon: 'fa-shopping-cart', url: base + 'orders/index.html', badgeId: 'badge-orders' },
            { key: 'delivery', label: 'Delivery Options', icon: 'fa-truck', url: base + 'delivery/index.html' },
            { key: 'returns', label: 'Returns', icon: 'fa-rotate-left', url: base + 'returns/index.html', badgeId: 'badge-returns' },
            { key: 'coupons', label: 'Coupons', icon: 'fa-ticket', url: base + 'coupons/index.html' },

            { section: 'Engagement' },
            { key: 'reviews', label: 'Reviews', icon: 'fa-star', url: base + 'reviews/index.html', badgeId: 'badge-reviews' },
            { key: 'customers', label: 'Customers', icon: 'fa-users', url: base + 'customers/index.html' },

            { section: 'Content' },
            // { key: 'cms', label: 'CMS Pages', icon: 'fa-file-lines', url: base + 'cms/pages.html' },
            { key: 'banners', label: 'Banners', icon: 'fa-images', url: base + 'settings/banners.html' },

            { section: 'System' },
            { key: 'settings', label: 'Settings', icon: 'fa-gear', url: base + 'settings/general.html' },
            { key: 'reports', label: 'Reports', icon: 'fa-chart-bar', url: base + 'reports/index.html' },
        ];

        sidebar.innerHTML = `
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    HJK<span style="color:var(--secondary)">Collections</span>
                    <span>Admin Panel</span>
                </div>
            </div>
            <nav class="sidebar-nav">
                ${navItems.map(item => {
                    if (item.section) return `<div class="nav-section">${item.section}</div>`;
                    return `<a href="${item.url}" class="nav-item ${activePage === item.key ? 'active' : ''}">
                        <i class="fa-solid ${item.icon}"></i>
                        <span>${item.label}</span>
                        ${item.badgeId ? `<span class="nav-badge" id="${item.badgeId}" style="display:none"></span>` : ''}
                    </a>`;
                }).join('')}
            </nav>
            <div style="padding:16px 24px;border-top:1px solid rgba(255,255,255,0.1)">
                <a href="${base}../index.html" class="nav-item" style="padding:8px 0"><i class="fa-solid fa-globe"></i> View Store</a>
                <a href="#" class="nav-item" style="padding:8px 0" onclick="AdminComponents.logout()"><i class="fa-solid fa-sign-out-alt"></i> Logout</a>
            </div>`;

        // Load badge counts asynchronously from dashboard stats
        this.loadSidebarBadges();
    },

    async loadSidebarBadges() {
        try {
            const response = await HJKAPI.admin.dashboard.stats();
            if (response.success) {
                const stats = response.data;
                const pendingOrders = stats.ordersByStatus?.placed || 0;
                const pendingReviews = stats.pendingReviews || 0;
                const pendingReturns = stats.pendingReturns || 0;

                if (pendingOrders > 0) {
                    const el = document.getElementById('badge-orders');
                    if (el) { el.textContent = pendingOrders; el.style.display = ''; }
                }
                if (pendingReviews > 0) {
                    const el = document.getElementById('badge-reviews');
                    if (el) { el.textContent = pendingReviews; el.style.display = ''; }
                }
                if (pendingReturns > 0) {
                    const el = document.getElementById('badge-returns');
                    if (el) { el.textContent = pendingReturns; el.style.display = ''; }
                }
            }
        } catch (e) {
            // Silently fail for sidebar badges
        }
    },

    renderTopbar(title) {
        const topbar = document.getElementById('adminTopbar');
        if (!topbar) return;

        const user = HJKApp.getCurrentUser();
        const userName = user ? (user.firstName + ' ' + user.lastName) : 'Admin';
        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

        topbar.innerHTML = `
            <div class="topbar-left">
                <button class="sidebar-toggle" onclick="AdminComponents.toggleSidebar()"><i class="fa-solid fa-bars"></i></button>
                <h5>${title}</h5>
            </div>
            <div class="topbar-right">
                <button class="topbar-icon-btn" onclick="AdminComponents.toggleFullscreen()"><i class="fa-solid fa-expand"></i></button>
                <button class="topbar-icon-btn"><i class="fa-solid fa-bell"></i><span class="notif-dot"></span></button>
                <div class="topbar-user">
                    <div class="topbar-user-avatar">${initials}</div>
                    <div class="topbar-user-info">
                        <div class="topbar-user-name">${userName}</div>
                        <div class="topbar-user-role">Super Admin</div>
                    </div>
                </div>
            </div>`;
    },

    toggleSidebar() {
        const sidebar = document.getElementById('adminSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
    },

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    },

    logout() {
        HJKApp.adminLogout();
    },

    checkAuth() {
        if (!HJKApp.isLoggedIn()) {
            window.location.href = this.getAdminBase() + 'login.html';
            return false;
        }
        return true;
    },

    renderPagination(currentPage, totalPages, onPageChange) {
        if (totalPages <= 1) return '';
        let html = '<div class="d-flex justify-content-center gap-2 mt-3">';
        html += `<button class="btn-outline-custom btn-sm" ${currentPage === 1 ? 'disabled' : ''} onclick="${onPageChange}(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="btn-outline-custom btn-sm ${i === currentPage ? 'active' : ''}" onclick="${onPageChange}(${i})" style="${i === currentPage ? 'background:var(--primary);color:#fff;border-color:var(--primary)' : ''}">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += '<span style="padding:4px">...</span>';
            }
        }
        html += `<button class="btn-outline-custom btn-sm" ${currentPage === totalPages ? 'disabled' : ''} onclick="${onPageChange}(${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
        html += '</div>';
        return html;
    },

    showToast(msg, type) {
        HJKComponents.showToast(msg, type);
    },

    showConfirm(title, msg, onConfirm) {
        HJKComponents.showConfirm(title, msg, onConfirm);
    },

    getAdminPageShell(sidebarPage, topbarTitle) {
        if (!this.checkAuth()) return false;
        this.renderSidebar(sidebarPage);
        this.renderTopbar(topbarTitle);
        return true;
    }
};
