/* ============================================
   HJKCollections - Cart Page Logic
   ============================================ */

const HJKCart = {
    appliedCoupon: null,
    cartData: null,

    async init() {
        this.appliedCoupon = JSON.parse(sessionStorage.getItem('hjk_applied_coupon') || 'null');
        await this.render();
    },

    async render() {
        const container = document.getElementById('cartContent');
        if (!container) return;

        try {
            const res = await HJKAPI.cart.get();
            if (!res.success) throw { message: res.message || 'Failed to load cart' };
            this.cartData = res.data;
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to load cart', 'error');
            container.innerHTML = HJKComponents.renderEmptyState('fa-bag-shopping', 'Error Loading Cart', 'Please try again later.', 'Start Shopping', 'products.html');
            return;
        }

        const cart = this.cartData;

        if (!cart.items || cart.items.length === 0) {
            container.innerHTML = HJKComponents.renderEmptyState('fa-bag-shopping', 'Your Cart is Empty', 'Looks like you haven\'t added anything to your cart yet.', 'Start Shopping', 'products.html');
            return;
        }

        let itemsHtml = '';
        let subtotal = 0;

        cart.items.forEach(item => {
            const img = item.image || '';
            const lineTotal = item.currentPrice * item.quantity;
            subtotal += lineTotal;

            itemsHtml += `
            <tr>
                <td>
                    <div class="cart-item-info">
                        <img src="${img}" alt="${item.productName}">
                        <div>
                            <div class="cart-item-name"><a href="product-detail.html?slug=${item.productSlug}" style="color:var(--text)">${item.productName}</a></div>
                            <div class="cart-item-variant">${item.color || ''} | ${item.size}</div>
                        </div>
                    </div>
                </td>
                <td class="cart-item-price">${HJKUtils.formatPrice(item.currentPrice)}</td>
                <td>
                    <div class="qty-control">
                        <button onclick="HJKCart.updateQty('${item.id}', ${item.quantity - 1})">-</button>
                        <input type="number" value="${item.quantity}" min="1" onchange="HJKCart.updateQty('${item.id}', parseInt(this.value))">
                        <button onclick="HJKCart.updateQty('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                </td>
                <td class="cart-item-price">${HJKUtils.formatPrice(lineTotal)}</td>
                <td><button class="cart-item-remove" onclick="HJKCart.removeItem('${item.id}')"><i class="fa-solid fa-trash-can"></i></button></td>
            </tr>`;
        });

        const settings = HJKApp.getSettings() || {};
        const freeShipAbove = settings.freeShippingAbove || 1500;
        const shipping = subtotal >= freeShipAbove ? 0 : 80;
        let discount = 0;
        let couponHtml = '';

        if (this.appliedCoupon) {
            if (this.appliedCoupon.type === 'percentage') {
                discount = Math.min(subtotal * this.appliedCoupon.value / 100, this.appliedCoupon.maxDiscount || Infinity);
            } else {
                discount = this.appliedCoupon.value;
            }
            couponHtml = `<div class="d-flex justify-content-between align-items-center mt-2">
                <span class="badge-custom badge-success"><i class="fa-solid fa-tag me-1"></i>${this.appliedCoupon.code}</span>
                <button class="text-danger" style="background:none;border:none;font-size:0.82rem;cursor:pointer" onclick="HJKCart.removeCoupon()">Remove</button>
            </div>`;
        }

        const total = subtotal - discount + shipping;

        container.innerHTML = `
        <div class="row g-4">
            <div class="col-lg-8">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="font-heading mb-0">Shopping Cart (${cart.items.length} items)</h4>
                    <a href="products.html" class="text-muted" style="font-size:0.9rem"><i class="fa-solid fa-arrow-left me-1"></i>Continue Shopping</a>
                </div>
                <div class="table-responsive">
                    <table class="cart-table">
                        <thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Total</th><th></th></tr></thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="cart-summary">
                    <h4>Order Summary</h4>
                    <div class="summary-row"><span>Subtotal</span><span>${HJKUtils.formatPrice(subtotal)}</span></div>
                    ${discount > 0 ? `<div class="summary-row" style="color:var(--success)"><span>Discount</span><span>-${HJKUtils.formatPrice(discount)}</span></div>` : ''}
                    <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span style="color:var(--success)">FREE</span>' : HJKUtils.formatPrice(shipping)}</span></div>
                    ${shipping > 0 ? `<p style="font-size:0.78rem;color:var(--text-muted);margin:4px 0">Free shipping on orders above ${HJKUtils.formatPrice(freeShipAbove)}</p>` : ''}
                    <div class="summary-row total"><span>Total</span><span>${HJKUtils.formatPrice(total)}</span></div>

                    <div class="coupon-section">
                        <label class="form-label-custom">Coupon Code</label>
                        <div class="coupon-input-group">
                            <input type="text" id="couponInput" placeholder="Enter code" value="${this.appliedCoupon?.code || ''}">
                            <button onclick="HJKCart.applyCoupon()">Apply</button>
                        </div>
                        ${couponHtml}
                    </div>

                    <button class="btn-primary-custom w-100 justify-content-center" onclick="HJKCart.proceedToCheckout()">
                        Proceed to Checkout <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>`;
    },

    async updateQty(cartItemId, qty) {
        if (qty < 1) return this.removeItem(cartItemId);
        try {
            await HJKApp.updateCartQuantity(cartItemId, qty);
            await this.render();
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to update quantity', 'error');
        }
    },

    removeItem(cartItemId) {
        HJKComponents.showConfirm('Remove Item', 'Are you sure you want to remove this item?', async () => {
            try {
                await HJKApp.removeFromCart(cartItemId);
                await this.render();
                HJKComponents.showToast('Item removed from cart', 'info');
            } catch (err) {
                HJKComponents.showToast(err.message || 'Failed to remove item', 'error');
            }
        });
    },

    async applyCoupon() {
        const code = document.getElementById('couponInput')?.value.trim().toUpperCase();
        if (!code) { HJKComponents.showToast('Please enter a coupon code', 'error'); return; }

        try {
            // Calculate current subtotal from cart data
            const subtotal = (this.cartData?.items || []).reduce((s, i) => s + i.currentPrice * i.quantity, 0);
            const res = await HJKAPI.checkout.validateCoupon(code, subtotal);
            if (!res.success) {
                HJKComponents.showToast(res.message || 'Invalid coupon code', 'error');
                return;
            }

            this.appliedCoupon = res.data;
            sessionStorage.setItem('hjk_applied_coupon', JSON.stringify(res.data));
            HJKComponents.showToast('Coupon applied successfully!', 'success');
            await this.render();
        } catch (err) {
            HJKComponents.showToast(err.message || 'Invalid coupon code', 'error');
        }
    },

    async removeCoupon() {
        this.appliedCoupon = null;
        sessionStorage.removeItem('hjk_applied_coupon');
        await this.render();
    },

    proceedToCheckout() {
        if (!HJKApp.requireLogin('checkout.html')) return;
        window.location.href = 'checkout.html';
    }
};

document.addEventListener('DOMContentLoaded', () => { setTimeout(() => HJKCart.init(), 100); });
