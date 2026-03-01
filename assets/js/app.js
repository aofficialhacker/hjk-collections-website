/* ============================================
   HJKCollections - App Initialization
   ============================================ */

const HJKApp = {
    init() {
        HJKData.init();
        this.renderComponents();
        this.initBackToTop();
        this.initAnnouncementBar();
        this.updateCartBadge();
        this.updateWishlistBadge();
    },

    renderComponents() {
        // Render header
        const headerEl = document.getElementById('header');
        if (headerEl) {
            headerEl.innerHTML = HJKComponents.renderHeader();
            HJKComponents.initHeaderEvents();
        }

        // Render footer
        const footerEl = document.getElementById('footer');
        if (footerEl) {
            footerEl.innerHTML = HJKComponents.renderFooter();
        }

        // Render announcement bar
        const announcementEl = document.getElementById('announcement-bar');
        if (announcementEl) {
            const settings = HJKUtils.store.get('hjk_settings');
            if (settings && settings.headerAnnouncement) {
                announcementEl.innerHTML = `<div class="announcement-bar"><div class="container-custom">${settings.headerAnnouncement}</div></div>`;
            }
        }
    },

    // Auth helpers
    isLoggedIn() {
        const session = HJKUtils.store.get('hjk_session');
        return session && session.isLoggedIn;
    },

    getCurrentUser() {
        const session = HJKUtils.store.get('hjk_session');
        if (!session || !session.isLoggedIn) return null;
        const users = HJKUtils.store.get('hjk_users') || [];
        return users.find(u => u.id === session.userId) || null;
    },

    isAdmin() {
        const session = HJKUtils.store.get('hjk_admin_session');
        return session && session.isLoggedIn;
    },

    getAdminUser() {
        const session = HJKUtils.store.get('hjk_admin_session');
        if (!session || !session.isLoggedIn) return null;
        const users = HJKUtils.store.get('hjk_users') || [];
        return users.find(u => u.id === session.userId) || null;
    },

    logout() {
        HJKUtils.store.remove('hjk_session');
        HJKUtils.store.remove('hjk_cart');
        window.location.href = 'login.html';
    },

    adminLogout() {
        HJKUtils.store.remove('hjk_admin_session');
        window.location.href = 'login.html';
    },

    requireLogin(redirectUrl) {
        if (!this.isLoggedIn()) {
            sessionStorage.setItem('hjk_redirect', redirectUrl || window.location.href);
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    requireAdmin() {
        if (!this.isAdmin()) {
            window.location.href = 'admin/login.html';
            return false;
        }
        return true;
    },

    // Cart helpers
    getCart() {
        return HJKUtils.store.get('hjk_cart') || { userId: null, items: [], updatedAt: new Date().toISOString() };
    },

    saveCart(cart) {
        cart.updatedAt = new Date().toISOString();
        if (this.isLoggedIn()) {
            cart.userId = this.getCurrentUser().id;
        }
        HJKUtils.store.set('hjk_cart', cart);
        this.updateCartBadge();
    },

    addToCart(productId, variantId, size, quantity = 1) {
        const cart = this.getCart();
        const existing = cart.items.find(i => i.productId === productId && i.variantId === variantId && i.size === size);

        if (existing) {
            existing.quantity += quantity;
        } else {
            const products = HJKUtils.store.get('hjk_products') || [];
            const product = products.find(p => p.id === productId);
            if (!product) return;
            const variant = product.variants.find(v => v.id === variantId);
            if (!variant) return;
            const sizeData = variant.sizes.find(s => s.size === size);
            if (!sizeData) return;

            cart.items.push({
                id: HJKUtils.generateId('cart'),
                productId, variantId, size, quantity,
                priceAtAdd: sizeData.sellingPrice,
                addedAt: new Date().toISOString()
            });
        }
        this.saveCart(cart);
        HJKComponents.showToast('Added to cart!', 'success');
    },

    removeFromCart(cartItemId) {
        const cart = this.getCart();
        cart.items = cart.items.filter(i => i.id !== cartItemId);
        this.saveCart(cart);
    },

    updateCartQuantity(cartItemId, quantity) {
        const cart = this.getCart();
        const item = cart.items.find(i => i.id === cartItemId);
        if (item) {
            item.quantity = Math.max(1, quantity);
        }
        this.saveCart(cart);
    },

    getCartTotal() {
        const cart = this.getCart();
        return cart.items.reduce((sum, item) => sum + (item.priceAtAdd * item.quantity), 0);
    },

    getCartCount() {
        const cart = this.getCart();
        return cart.items.reduce((sum, item) => sum + item.quantity, 0);
    },

    updateCartBadge() {
        const badges = document.querySelectorAll('.cart-badge');
        const count = this.getCartCount();
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    },

    // Wishlist helpers
    getWishlist() {
        return HJKUtils.store.get('hjk_wishlist') || [];
    },

    toggleWishlist(productId, variantId) {
        let wishlist = this.getWishlist();
        const idx = wishlist.findIndex(w => w.productId === productId);

        if (idx > -1) {
            wishlist.splice(idx, 1);
            HJKUtils.store.set('hjk_wishlist', wishlist);
            this.updateWishlistBadge();
            HJKComponents.showToast('Removed from wishlist', 'info');
            return false;
        } else {
            wishlist.push({
                id: HJKUtils.generateId('wish'),
                userId: this.isLoggedIn() ? this.getCurrentUser().id : null,
                productId,
                variantId: variantId || null,
                addedAt: new Date().toISOString()
            });
            HJKUtils.store.set('hjk_wishlist', wishlist);
            this.updateWishlistBadge();
            HJKComponents.showToast('Added to wishlist!', 'success');
            return true;
        }
    },

    isInWishlist(productId) {
        const wishlist = this.getWishlist();
        return wishlist.some(w => w.productId === productId);
    },

    updateWishlistBadge() {
        const badges = document.querySelectorAll('.wishlist-badge');
        const count = this.getWishlist().length;
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    },

    // Recently viewed
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
        // Can be closed
        const bar = document.querySelector('.announcement-bar');
        if (bar && !sessionStorage.getItem('hjk_announcement_closed')) {
            bar.style.display = 'block';
        }
    },

    // Product helpers
    getProduct(productId) {
        const products = HJKUtils.store.get('hjk_products') || [];
        return products.find(p => p.id === productId);
    },

    getCategory(categoryId) {
        const categories = HJKUtils.store.get('hjk_categories') || [];
        return categories.find(c => c.id === categoryId);
    },

    // Search products
    searchProducts(query) {
        const products = HJKUtils.store.get('hjk_products') || [];
        const q = query.toLowerCase().trim();
        if (!q) return [];
        return products.filter(p =>
            p.isActive &&
            (p.name.toLowerCase().includes(q) ||
             p.shortDescription.toLowerCase().includes(q) ||
             p.tags.some(t => t.toLowerCase().includes(q)))
        ).slice(0, 8);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure data.js has initialized
    setTimeout(() => HJKApp.init(), 50);
});
