/* ============================================
   HJKCollections - Cart Page Logic
   ============================================ */

const HJKCart = {
    appliedCoupon: null,

    init() {
        this.appliedCoupon = JSON.parse(sessionStorage.getItem('hjk_applied_coupon') || 'null');
        this.render();
    },

    render() {
        const container = document.getElementById('cartContent');
        if (!container) return;
        const cart = HJKApp.getCart();
        const products = HJKUtils.store.get('hjk_products') || [];

        if (cart.items.length === 0) {
            container.innerHTML = HJKComponents.renderEmptyState('fa-bag-shopping', 'Your Cart is Empty', 'Looks like you haven\'t added anything to your cart yet.', 'Start Shopping', 'products.html');
            return;
        }

        let itemsHtml = '';
        let subtotal = 0;

        cart.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return;
            const variant = product.variants.find(v => v.id === item.variantId);
            const img = variant?.images[0] || '';
            const lineTotal = item.priceAtAdd * item.quantity;
            subtotal += lineTotal;

            itemsHtml += `
            <tr>
                <td>
                    <div class="cart-item-info">
                        <img src="${img}" alt="${product.name}">
                        <div>
                            <div class="cart-item-name"><a href="product-detail.html?id=${product.id}" style="color:var(--text)">${product.name}</a></div>
                            <div class="cart-item-variant">${variant?.color || ''} | ${item.size}</div>
                        </div>
                    </div>
                </td>
                <td class="cart-item-price">${HJKUtils.formatPrice(item.priceAtAdd)}</td>
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

        const settings = HJKUtils.store.get('hjk_settings') || {};
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

    updateQty(cartItemId, qty) {
        if (qty < 1) return this.removeItem(cartItemId);
        HJKApp.updateCartQuantity(cartItemId, qty);
        this.render();
    },

    removeItem(cartItemId) {
        HJKComponents.showConfirm('Remove Item', 'Are you sure you want to remove this item?', () => {
            HJKApp.removeFromCart(cartItemId);
            this.render();
            HJKComponents.showToast('Item removed from cart', 'info');
        });
    },

    applyCoupon() {
        const code = document.getElementById('couponInput')?.value.trim().toUpperCase();
        if (!code) { HJKComponents.showToast('Please enter a coupon code', 'error'); return; }

        const coupons = HJKUtils.store.get('hjk_coupons') || [];
        const coupon = coupons.find(c => c.code === code);

        if (!coupon) { HJKComponents.showToast('Invalid coupon code', 'error'); return; }
        if (!coupon.isActive) { HJKComponents.showToast('This coupon is no longer active', 'error'); return; }

        const now = new Date();
        if (new Date(coupon.validFrom) > now) { HJKComponents.showToast('This coupon is not yet valid', 'error'); return; }
        if (new Date(coupon.validUntil) < now) { HJKComponents.showToast('This coupon has expired', 'error'); return; }

        const subtotal = HJKApp.getCartTotal();
        if (subtotal < coupon.minOrderAmount) {
            HJKComponents.showToast(`Minimum order amount is ${HJKUtils.formatPrice(coupon.minOrderAmount)}`, 'error');
            return;
        }
        if (coupon.usedCount >= coupon.usageLimit) { HJKComponents.showToast('This coupon has reached its usage limit', 'error'); return; }

        this.appliedCoupon = coupon;
        sessionStorage.setItem('hjk_applied_coupon', JSON.stringify(coupon));
        HJKComponents.showToast('Coupon applied successfully!', 'success');
        this.render();
    },

    removeCoupon() {
        this.appliedCoupon = null;
        sessionStorage.removeItem('hjk_applied_coupon');
        this.render();
    },

    proceedToCheckout() {
        if (!HJKApp.requireLogin('checkout.html')) return;
        window.location.href = 'checkout.html';
    }
};

document.addEventListener('DOMContentLoaded', () => { setTimeout(() => HJKCart.init(), 100); });
