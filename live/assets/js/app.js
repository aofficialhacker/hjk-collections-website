/* ============================================
   HJKCollections - App Initialization
   ============================================ */

const HJKApp = {
    _session: null,
    _settings: null,
    _categories: null,
    _ready: false,

    async init() {
        await this.loadSession();
        await this.loadSettings();
        await this.loadCategories();
        await this.loadWishlist();
        this._ready = true;
        this.renderComponents();
        this.initBackToTop();
        this.initAnnouncementBar();
        this.updateCartBadge();
        this.updateWishlistBadge();
    },

    async loadSession() {
        try {
            const res = await HJKAPI.auth.session();
            if (res.success && res.data.loggedIn) {
                this._session = res.data.user;
            } else {
                this._session = null;
            }
        } catch {
            this._session = null;
        }
    },

    async loadSettings() {
        try {
            // Cache settings in sessionStorage for performance
            const cached = sessionStorage.getItem('hjk_settings_cache');
            if (cached) {
                this._settings = JSON.parse(cached);
                return;
            }
            const res = await HJKAPI.settings.get();
            if (res.success) {
                this._settings = res.data;
                sessionStorage.setItem('hjk_settings_cache', JSON.stringify(res.data));
            }
        } catch {
            this._settings = null;
        }
    },

    async loadCategories() {
        try {
            const cached = sessionStorage.getItem('hjk_categories_cache');
            if (cached) {
                this._categories = JSON.parse(cached);
                return;
            }
            const res = await HJKAPI.categories.list();
            if (res.success) {
                this._categories = res.data;
                sessionStorage.setItem('hjk_categories_cache', JSON.stringify(res.data));
            }
        } catch {
            this._categories = [];
        }
    },

    renderComponents() {
        const headerEl = document.getElementById('header');
        if (headerEl) {
            headerEl.innerHTML = HJKComponents.renderHeader();
            HJKComponents.initHeaderEvents();
        }

        const footerEl = document.getElementById('footer');
        if (footerEl) {
            footerEl.innerHTML = HJKComponents.renderFooter();
        }

        const announcementEl = document.getElementById('announcement-bar');
        if (announcementEl) {
            const settings = this.getSettings();
            if (settings && settings.headerAnnouncement) {
                announcementEl.innerHTML = `<div class="announcement-bar"><div class="container-custom">${settings.headerAnnouncement}</div></div>`;
            }
        }
    },

    // Auth helpers
    isLoggedIn() {
        return this._session !== null;
    },

    getCurrentUser() {
        return this._session;
    },

    isAdmin() {
        // Check admin session via cookie-based session (the session.php returns adminLoggedIn)
        return this._session && this._session.role === 'superadmin';
    },

    getAdminUser() {
        if (this.isAdmin()) return this._session;
        return null;
    },

    getSettings() {
        return this._settings;
    },

    getCategories() {
        return this._categories || [];
    },

    getCategory(id) {
        return (this._categories || []).find(c => c.id === id || c.id === parseInt(id));
    },

    async logout() {
        try {
            await HJKAPI.auth.logout();
        } catch {}
        this._session = null;
        sessionStorage.clear();
        window.location.href = '/login.html';
    },

    async adminLogout() {
        try {
            await HJKAPI.auth.logout();
        } catch {}
        this._session = null;
        sessionStorage.clear();
        window.location.href = '/admin/login.html';
    },

    requireLogin(redirectUrl) {
        if (!this.isLoggedIn()) {
            sessionStorage.setItem('hjk_redirect', redirectUrl || window.location.href);
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },

    requireAdmin() {
        if (!this.isAdmin()) {
            window.location.href = '/admin/login.html';
            return false;
        }
        return true;
    },

    // Cart helpers - now async via API
    async addToCart(productId, variantId, size, quantity = 1) {
        if (!this.isLoggedIn()) {
            this.requireLogin();
            return;
        }
        try {
            const res = await HJKAPI.cart.add(productId, variantId, size, quantity);
            if (res.success) {
                this._cartCount = res.data.cartCount;
                this.updateCartBadge();
                HJKComponents.showToast('Added to cart!', 'success');
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to add to cart', 'error');
        }
    },

    async removeFromCart(cartItemId) {
        try {
            const res = await HJKAPI.cart.remove(cartItemId);
            if (res.success) {
                this._cartCount = res.data.cartCount;
                this.updateCartBadge();
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to remove item', 'error');
        }
    },

    async updateCartQuantity(cartItemId, quantity) {
        try {
            await HJKAPI.cart.update(cartItemId, quantity);
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to update cart', 'error');
        }
    },

    async getCartCount() {
        if (!this.isLoggedIn()) return 0;
        if (this._cartCount !== undefined) return this._cartCount;
        try {
            const res = await HJKAPI.cart.get();
            if (res.success) {
                this._cartCount = res.data.itemCount;
                return this._cartCount;
            }
        } catch {}
        return 0;
    },

    async updateCartBadge() {
        const count = await this.getCartCount();
        const badges = document.querySelectorAll('.cart-badge');
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    },

    // Wishlist helpers
    async toggleWishlist(productId, variantId) {
        if (!this.isLoggedIn()) {
            this.requireLogin();
            return;
        }
        try {
            const res = await HJKAPI.wishlist.toggle(productId, variantId);
            if (res.success) {
                this._wishlistCount = res.data.wishlistCount;
                // Refresh cached wishlist items
                await this.loadWishlist();
                this.updateWishlistBadge();
                HJKComponents.showToast(res.message, res.data.action === 'added' ? 'success' : 'info');
                return res.data.inWishlist;
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to update wishlist', 'error');
        }
        return false;
    },

    // Synchronous check using cached data (for use in rendering)
    isInWishlist(productId) {
        if (!this.isLoggedIn()) return false;
        return (this._wishlistItems || []).some(w => w.productId == productId);
    },

    // Load wishlist data from API into cache
    async loadWishlist() {
        if (!this.isLoggedIn()) return;
        try {
            const res = await HJKAPI.wishlist.get();
            if (res.success) {
                this._wishlistItems = res.data;
                this._wishlistCount = res.data.length;
            }
        } catch {
            this._wishlistItems = [];
        }
    },

    async updateWishlistBadge() {
        let count = 0;
        if (this.isLoggedIn()) {
            if (this._wishlistCount !== undefined) {
                count = this._wishlistCount;
            } else {
                try {
                    const res = await HJKAPI.wishlist.get();
                    if (res.success) {
                        count = res.data.length;
                        this._wishlistCount = count;
                        this._wishlistItems = res.data;
                    }
                } catch {}
            }
        }
        const badges = document.querySelectorAll('.wishlist-badge');
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    },

    // Recently viewed (keep in localStorage - no need for API)
    addToRecentlyViewed(productId) {
        let recent = HJKUtils.store.get('hjk_recently_viewed') || [];
        recent = recent.filter(id => id !== productId);
        recent.unshift(productId);
        if (recent.length > 10) recent = recent.slice(0, 10);
        HJKUtils.store.set('hjk_recently_viewed', recent);
    },

    getRecentlyViewed() {
        return HJKUtils.store.get('hjk_recently_viewed') || [];
    },

    // Back to top
    initBackToTop() {
        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
        btn.setAttribute('aria-label', 'Back to top');
        document.body.appendChild(btn);

        window.addEventListener('scroll', () => {
            btn.classList.toggle('visible', window.scrollY > 300);
        });

        btn.addEventListener('click', () => {
            HJKUtils.scrollToTop();
        });
    },

    initAnnouncementBar() {
        const bar = document.querySelector('.announcement-bar');
        if (bar && !sessionStorage.getItem('hjk_announcement_closed')) {
            bar.style.display = 'block';
        }
    },

    // Search products via API
    async searchProducts(query) {
        try {
            const res = await HJKAPI.products.search(query);
            return res.success ? res.data : [];
        } catch {
            return [];
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    HJKApp.init();
});
