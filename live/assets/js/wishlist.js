/* ============================================
   HJKCollections - Wishlist Logic
   ============================================ */

const HJKWishlist = {
    wishlistItems: [],

    async init() {
        await this.render();
    },

    async render() {
        const container = document.getElementById('wishlistContent');
        if (!container) return;

        if (!HJKApp.isLoggedIn()) {
            container.innerHTML = HJKComponents.renderEmptyState('fa-heart', 'Please Login', 'Login to view your wishlist.', 'Login', 'login.html');
            return;
        }

        try {
            const res = await HJKAPI.wishlist.get();
            if (!res.success) throw { message: res.message || 'Failed to load wishlist' };
            this.wishlistItems = res.data || [];
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to load wishlist', 'error');
            container.innerHTML = HJKComponents.renderEmptyState('fa-heart', 'Error Loading Wishlist', 'Please try again later.', 'Start Shopping', 'products.html');
            return;
        }

        if (this.wishlistItems.length === 0) {
            container.innerHTML = HJKComponents.renderEmptyState('fa-heart', 'Your Wishlist is Empty', 'Save items you love to your wishlist and shop them later.', 'Start Shopping', 'products.html');
            return;
        }

        // Each wishlist item from API should include product/variant info
        const items = this.wishlistItems;

        container.innerHTML = `
            <div class="content-card">
                <div class="content-header d-flex justify-content-between align-items-center">
                    <h4>My Wishlist (${items.length} items)</h4>
                    ${items.length > 0 ? `<button class="btn-outline-custom btn-sm" onclick="HJKWishlist.clearAll()"><i class="fa-solid fa-trash"></i> Clear All</button>` : ''}
                </div>

                <div class="wishlist-grid">
                    ${items.map(item => {
                        const image = item.image || 'assets/images/placeholder.jpg';
                        const inStock = item.stock > 0;
                        const sellingPrice = item.currentPrice || item.sellingPrice || 0;
                        const normalPrice = item.normalPrice || sellingPrice;

                        return `
                        <div class="wishlist-item">
                            <div class="wishlist-item-image">
                                <a href="product-detail.html?slug=${item.productSlug || ''}">
                                    <img src="${image}" alt="${item.productName || ''}">
                                </a>
                                <button class="wishlist-remove-btn" onclick="HJKWishlist.removeItem('${item.productId}', '${item.variantId}')" title="Remove">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            <div class="wishlist-item-info">
                                <a href="product-detail.html?slug=${item.productSlug || ''}" class="wishlist-item-name">${item.productName || ''}</a>
                                <div class="wishlist-item-variant">Color: ${item.color || ''}</div>
                                <div class="wishlist-item-price">${HJKUtils.renderPrice(normalPrice, sellingPrice)}</div>
                                <div class="wishlist-item-stock ${inStock ? 'in-stock' : 'out-of-stock'}">
                                    <i class="fa-solid ${inStock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                    ${inStock ? 'In Stock' : 'Out of Stock'}
                                </div>
                                <div class="wishlist-item-actions">
                                    ${inStock ? `<button class="btn-primary-custom btn-sm" onclick="HJKWishlist.moveToCart('${item.productId}', '${item.variantId}')"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>` :
                                    `<button class="btn-outline-custom btn-sm" disabled><i class="fa-solid fa-cart-plus"></i> Out of Stock</button>`}
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
    },

    async removeItem(productId, variantId) {
        try {
            await HJKApp.toggleWishlist(productId, variantId);
            await this.render();
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to remove item', 'error');
        }
    },

    async moveToCart(productId, variantId) {
        try {
            // Fetch product detail to find available size
            const res = await HJKAPI.products.detail(productId);
            if (!res.success || !res.data) {
                HJKComponents.showToast('Product not found', 'error');
                return;
            }
            const product = res.data;
            const variant = product.variants.find(v => v.id === variantId);
            if (!variant || !variant.sizes || variant.sizes.length === 0) {
                HJKComponents.showToast('This item is not available', 'error');
                return;
            }

            const availableSize = variant.sizes.find(s => s.stock > 0);
            if (!availableSize) {
                HJKComponents.showToast('This item is out of stock', 'error');
                return;
            }

            await HJKApp.addToCart(productId, variantId, availableSize.size, 1);

            // Remove from wishlist
            await HJKApp.toggleWishlist(productId, variantId);

            HJKComponents.showToast('Item moved to cart!', 'success');
            await this.render();
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to move item to cart', 'error');
        }
    },

    clearAll() {
        HJKComponents.showConfirm('Clear Wishlist', 'Are you sure you want to remove all items from your wishlist?', async () => {
            try {
                // Toggle each item to remove it
                const items = [...this.wishlistItems];
                for (const item of items) {
                    await HJKAPI.wishlist.toggle(item.productId, item.variantId);
                }
                HJKApp._wishlistCount = 0;
                HJKApp._wishlistItems = [];
                HJKApp.updateWishlistBadge();
                HJKComponents.showToast('Wishlist cleared', 'info');
                await this.render();
            } catch (err) {
                HJKComponents.showToast(err.message || 'Failed to clear wishlist', 'error');
            }
        });
    }
};
