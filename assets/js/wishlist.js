/* ============================================
   HJKCollections - Wishlist Logic
   ============================================ */

const HJKWishlist = {
    init() {
        this.render();
    },

    render() {
        const container = document.getElementById('wishlistContent');
        if (!container) return;

        const user = HJKApp.getCurrentUser();
        if (!user) {
            container.innerHTML = HJKComponents.renderEmptyState('fa-heart', 'Please Login', 'Login to view your wishlist.', 'Login', 'login.html');
            return;
        }

        const wishlist = HJKApp.getWishlist();
        const products = HJKUtils.store.get('hjk_products') || [];

        if (wishlist.length === 0) {
            container.innerHTML = HJKComponents.renderEmptyState('fa-heart', 'Your Wishlist is Empty', 'Save items you love to your wishlist and shop them later.', 'Start Shopping', 'products.html');
            return;
        }

        const wishlistItems = wishlist.map(wItem => {
            const product = products.find(p => p.id === wItem.productId);
            if (!product) return null;
            const variant = product.variants.find(v => v.id === wItem.variantId) || product.variants[0];
            return { ...wItem, product, variant };
        }).filter(Boolean);

        if (wishlistItems.length === 0) {
            container.innerHTML = HJKComponents.renderEmptyState('fa-heart', 'Your Wishlist is Empty', 'Save items you love to your wishlist and shop them later.', 'Start Shopping', 'products.html');
            return;
        }

        container.innerHTML = `
            <div class="content-card">
                <div class="content-header d-flex justify-content-between align-items-center">
                    <h4>My Wishlist (${wishlistItems.length} items)</h4>
                    ${wishlistItems.length > 0 ? `<button class="btn-outline-custom btn-sm" onclick="HJKWishlist.clearAll()"><i class="fa-solid fa-trash"></i> Clear All</button>` : ''}
                </div>

                <div class="wishlist-grid">
                    ${wishlistItems.map(item => {
                        const lowestPrice = HJKUtils.getLowestPrice(item.product);
                        const image = item.variant.images?.[0] || 'assets/images/placeholder.jpg';
                        const inStock = item.variant.sizes?.some(s => s.stock > 0) || false;

                        return `
                        <div class="wishlist-item">
                            <div class="wishlist-item-image">
                                <a href="product-detail.html?id=${item.product.id}">
                                    <img src="${image}" alt="${item.product.name}">
                                </a>
                                <button class="wishlist-remove-btn" onclick="HJKWishlist.removeItem('${item.product.id}', '${item.variant.id}')" title="Remove">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            <div class="wishlist-item-info">
                                <a href="product-detail.html?id=${item.product.id}" class="wishlist-item-name">${item.product.name}</a>
                                <div class="wishlist-item-variant">Color: ${item.variant.color}</div>
                                <div class="wishlist-item-price">${HJKUtils.renderPrice(lowestPrice.normalPrice, lowestPrice.sellingPrice)}</div>
                                <div class="wishlist-item-stock ${inStock ? 'in-stock' : 'out-of-stock'}">
                                    <i class="fa-solid ${inStock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                    ${inStock ? 'In Stock' : 'Out of Stock'}
                                </div>
                                <div class="wishlist-item-actions">
                                    ${inStock ? `<button class="btn-primary-custom btn-sm" onclick="HJKWishlist.moveToCart('${item.product.id}', '${item.variant.id}')"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>` :
                                    `<button class="btn-outline-custom btn-sm" disabled><i class="fa-solid fa-cart-plus"></i> Out of Stock</button>`}
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
    },

    removeItem(productId, variantId) {
        HJKApp.toggleWishlist(productId, variantId);
        HJKComponents.showToast('Item removed from wishlist', 'info');
        this.render();
    },

    moveToCart(productId, variantId) {
        const products = HJKUtils.store.get('hjk_products') || [];
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const variant = product.variants.find(v => v.id === variantId);
        if (!variant || !variant.sizes || variant.sizes.length === 0) return;

        // Add first available size to cart
        const availableSize = variant.sizes.find(s => s.stock > 0);
        if (!availableSize) {
            HJKComponents.showToast('This item is out of stock', 'error');
            return;
        }

        HJKApp.addToCart(productId, variantId, availableSize.size, 1);

        // Remove from wishlist
        HJKApp.toggleWishlist(productId, variantId);

        HJKComponents.showToast('Item moved to cart!', 'success');
        this.render();
    },

    clearAll() {
        HJKComponents.showConfirm('Clear Wishlist', 'Are you sure you want to remove all items from your wishlist?', () => {
            const user = HJKApp.getCurrentUser();
            if (!user) return;

            const allWishlists = HJKUtils.store.get('hjk_wishlist') || [];
            const updated = allWishlists.filter(w => w.userId !== user.id);
            HJKUtils.store.set('hjk_wishlist', updated);
            HJKApp.updateWishlistBadge();
            HJKComponents.showToast('Wishlist cleared', 'info');
            this.render();
        });
    }
};
