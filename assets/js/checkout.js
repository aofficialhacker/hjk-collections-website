/* ============================================
   HJKCollections - Checkout Page Logic
   ============================================ */

const HJKCheckout = {
    selectedAddressId: null,
    selectedDeliveryId: null,
    coupon: null,
    currentStep: 1,

    init() {
        if (!HJKApp.requireLogin('checkout.html')) return;
        const cart = HJKApp.getCart();
        if (cart.items.length === 0) { window.location.href = 'cart.html'; return; }

        this.coupon = JSON.parse(sessionStorage.getItem('hjk_applied_coupon') || 'null');
        this.renderSteps();
        this.renderAddresses();
        this.renderDeliveryOptions();
        this.renderOrderSummary();
    },

    renderSteps() {
        const container = document.getElementById('checkoutSteps');
        if (!container) return;
        const steps = ['Address', 'Delivery', 'Review & Pay'];
        container.innerHTML = steps.map((s, i) => {
            const num = i + 1;
            let cls = num < this.currentStep ? 'completed' : num === this.currentStep ? 'active' : '';
            return `
                ${i > 0 ? `<div class="checkout-step-line ${num <= this.currentStep ? 'completed' : ''}"></div>` : ''}
                <div class="checkout-step ${cls}">
                    <span class="step-number">${num < this.currentStep ? '<i class="fa-solid fa-check"></i>' : num}</span>
                    <span>${s}</span>
                </div>`;
        }).join('');
    },

    renderAddresses() {
        const user = HJKApp.getCurrentUser();
        const addresses = (HJKUtils.store.get('hjk_addresses') || []).filter(a => a.userId === user.id);
        const container = document.getElementById('addressSection');
        if (!container) return;

        if (addresses.length === 0) {
            container.innerHTML = `<div class="mb-4"><h5 class="font-heading mb-3">Shipping Address</h5><p class="text-muted">No addresses found. Please add one.</p></div>`;
            this.showAddressForm(container);
            return;
        }

        const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
        this.selectedAddressId = this.selectedAddressId || defaultAddr.id;

        container.innerHTML = `
            <h5 class="font-heading mb-3">Shipping Address</h5>
            <div class="row g-3 mb-3">
                ${addresses.map(addr => `
                    <div class="col-md-6">
                        <div class="address-card ${addr.id === this.selectedAddressId ? 'selected' : ''}" onclick="HJKCheckout.selectAddress('${addr.id}')">
                            <span class="address-label">${addr.label}</span>
                            ${addr.isDefault ? '<span class="address-default">Default</span>' : ''}
                            <div class="address-name">${addr.fullName}</div>
                            <div class="address-text">${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}<br>${addr.city}, ${addr.state} - ${addr.pincode}</div>
                            <div class="address-phone"><i class="fa-solid fa-phone me-1"></i>${addr.phone}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="btn-outline-custom btn-sm" onclick="HJKCheckout.toggleNewAddress()"><i class="fa-solid fa-plus"></i> Add New Address</button>
            <div id="newAddressForm" style="display:none" class="mt-3"></div>
        `;
    },

    selectAddress(id) {
        this.selectedAddressId = id;
        this.renderAddresses();
    },

    toggleNewAddress() {
        const form = document.getElementById('newAddressForm');
        if (form.style.display === 'none') {
            this.showAddressForm(form);
            form.style.display = 'block';
        } else {
            form.style.display = 'none';
        }
    },

    showAddressForm(container) {
        container.innerHTML = `
        <div class="card-custom p-3">
            <div class="row g-3">
                <div class="col-md-6"><input type="text" class="form-control-custom" id="addrFullName" placeholder="Full Name" required></div>
                <div class="col-md-6"><input type="text" class="form-control-custom" id="addrPhone" placeholder="Phone Number" required></div>
                <div class="col-12"><input type="text" class="form-control-custom" id="addrLine1" placeholder="Address Line 1" required></div>
                <div class="col-12"><input type="text" class="form-control-custom" id="addrLine2" placeholder="Address Line 2 (Optional)"></div>
                <div class="col-md-4"><input type="text" class="form-control-custom" id="addrCity" placeholder="City" required></div>
                <div class="col-md-4"><input type="text" class="form-control-custom" id="addrState" placeholder="State" required></div>
                <div class="col-md-4"><input type="text" class="form-control-custom" id="addrPincode" placeholder="Pincode" required></div>
                <div class="col-md-6">
                    <select class="form-control-custom" id="addrLabel"><option value="Home">Home</option><option value="Work">Work</option><option value="Other">Other</option></select>
                </div>
                <div class="col-12"><button class="btn-primary-custom btn-sm" onclick="HJKCheckout.saveAddress()">Save Address</button></div>
            </div>
        </div>`;
    },

    saveAddress() {
        const fullName = document.getElementById('addrFullName')?.value.trim();
        const phone = document.getElementById('addrPhone')?.value.trim();
        const line1 = document.getElementById('addrLine1')?.value.trim();
        const line2 = document.getElementById('addrLine2')?.value.trim();
        const city = document.getElementById('addrCity')?.value.trim();
        const state = document.getElementById('addrState')?.value.trim();
        const pincode = document.getElementById('addrPincode')?.value.trim();
        const label = document.getElementById('addrLabel')?.value;

        if (!fullName || !phone || !line1 || !city || !state || !pincode) {
            HJKComponents.showToast('Please fill in all required fields', 'error'); return;
        }
        if (!HJKUtils.isValidPhone(phone)) { HJKComponents.showToast('Invalid phone number', 'error'); return; }
        if (!HJKUtils.isValidPincode(pincode)) { HJKComponents.showToast('Invalid pincode', 'error'); return; }

        const user = HJKApp.getCurrentUser();
        const addresses = HJKUtils.store.get('hjk_addresses') || [];
        const newAddr = {
            id: HJKUtils.generateId('addr'), userId: user.id, label,
            fullName, phone, addressLine1: line1, addressLine2: line2,
            city, state, pincode, isDefault: addresses.filter(a => a.userId === user.id).length === 0,
            createdAt: new Date().toISOString()
        };
        addresses.push(newAddr);
        HJKUtils.store.set('hjk_addresses', addresses);
        this.selectedAddressId = newAddr.id;
        this.renderAddresses();
        HJKComponents.showToast('Address saved!', 'success');
    },

    renderDeliveryOptions() {
        const options = (HJKUtils.store.get('hjk_delivery_options') || []).filter(d => d.isActive);
        const container = document.getElementById('deliverySection');
        if (!container) return;

        const cart = HJKApp.getCart();
        const subtotal = cart.items.reduce((s, i) => s + i.priceAtAdd * i.quantity, 0);
        if (!this.selectedDeliveryId && options.length) this.selectedDeliveryId = options[0].id;

        container.innerHTML = `
            <h5 class="font-heading mb-3 mt-4">Delivery Method</h5>
            <div class="d-flex flex-column gap-3">
                ${options.map(opt => {
                    const isFree = subtotal >= (opt.freeAbove || Infinity);
                    return `
                    <div class="delivery-option ${opt.id === this.selectedDeliveryId ? 'selected' : ''}" onclick="HJKCheckout.selectDelivery('${opt.id}')">
                        <input type="radio" name="delivery" ${opt.id === this.selectedDeliveryId ? 'checked' : ''}>
                        <div class="delivery-info">
                            <div class="delivery-name">${opt.name}</div>
                            <div class="delivery-days">${opt.estimatedDays} business days</div>
                        </div>
                        <div class="delivery-cost">${isFree ? '<span style="color:var(--success)">FREE</span>' : HJKUtils.formatPrice(opt.cost)}</div>
                    </div>`;
                }).join('')}
            </div>`;
    },

    selectDelivery(id) {
        this.selectedDeliveryId = id;
        this.renderDeliveryOptions();
        this.renderOrderSummary();
    },

    renderOrderSummary() {
        const container = document.getElementById('orderSummary');
        if (!container) return;

        const cart = HJKApp.getCart();
        const products = HJKUtils.store.get('hjk_products') || [];
        const deliveryOptions = HJKUtils.store.get('hjk_delivery_options') || [];
        const delivery = deliveryOptions.find(d => d.id === this.selectedDeliveryId);
        const settings = HJKUtils.store.get('hjk_settings') || {};

        let subtotal = 0;
        let itemsHtml = '';

        cart.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return;
            const variant = product.variants.find(v => v.id === item.variantId);
            const img = variant?.images[0] || '';
            const lineTotal = item.priceAtAdd * item.quantity;
            subtotal += lineTotal;
            itemsHtml += `
                <div class="d-flex gap-3 mb-3 pb-3" style="border-bottom:1px solid var(--border)">
                    <img src="${img}" alt="${product.name}" style="width:60px;height:60px;object-fit:cover;border-radius:var(--radius-sm)">
                    <div class="flex-grow-1">
                        <div style="font-weight:600;font-size:0.88rem">${product.name}</div>
                        <div style="font-size:0.78rem;color:var(--text-muted)">${variant?.color || ''} | ${item.size} x ${item.quantity}</div>
                    </div>
                    <div style="font-weight:600;font-size:0.9rem">${HJKUtils.formatPrice(lineTotal)}</div>
                </div>`;
        });

        let discount = 0;
        if (this.coupon) {
            discount = this.coupon.type === 'percentage'
                ? Math.min(subtotal * this.coupon.value / 100, this.coupon.maxDiscount || Infinity)
                : this.coupon.value;
        }

        const shipping = delivery ? (subtotal >= (delivery.freeAbove || Infinity) ? 0 : delivery.cost) : 0;
        const total = subtotal - discount + shipping;

        container.innerHTML = `
            <div class="cart-summary">
                <h4>Order Summary</h4>
                ${itemsHtml}
                <div class="summary-row"><span>Subtotal</span><span>${HJKUtils.formatPrice(subtotal)}</span></div>
                ${discount > 0 ? `<div class="summary-row" style="color:var(--success)"><span>Discount (${this.coupon.code})</span><span>-${HJKUtils.formatPrice(discount)}</span></div>` : ''}
                <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span style="color:var(--success)">FREE</span>' : HJKUtils.formatPrice(shipping)}</span></div>
                <div class="summary-row total"><span>Total</span><span>${HJKUtils.formatPrice(total)}</span></div>
                <button class="btn-secondary-custom w-100 justify-content-center mt-3" onclick="HJKCheckout.placeOrder()">
                    <i class="fa-solid fa-lock me-1"></i> Pay ${HJKUtils.formatPrice(total)}
                </button>
                <p class="text-center mt-2" style="font-size:0.78rem;color:var(--text-muted)"><i class="fa-solid fa-shield-halved me-1"></i>Secure payment powered by Razorpay</p>
            </div>`;
    },

    placeOrder() {
        if (!this.selectedAddressId) { HJKComponents.showToast('Please select a shipping address', 'error'); return; }
        if (!this.selectedDeliveryId) { HJKComponents.showToast('Please select a delivery method', 'error'); return; }
        this.showPaymentModal();
    },

    showPaymentModal() {
        const cart = HJKApp.getCart();
        const products = HJKUtils.store.get('hjk_products') || [];
        const delivery = (HJKUtils.store.get('hjk_delivery_options') || []).find(d => d.id === this.selectedDeliveryId);
        let subtotal = cart.items.reduce((s, i) => s + i.priceAtAdd * i.quantity, 0);
        let discount = 0;
        if (this.coupon) {
            discount = this.coupon.type === 'percentage'
                ? Math.min(subtotal * this.coupon.value / 100, this.coupon.maxDiscount || Infinity)
                : this.coupon.value;
        }
        const shipping = delivery ? (subtotal >= (delivery.freeAbove || Infinity) ? 0 : delivery.cost) : 0;
        const total = subtotal - discount + shipping;

        const html = `
        <div class="modal-overlay" id="paymentModal">
            <div class="modal-content-custom payment-modal">
                <div class="payment-header">
                    <span style="font-weight:600">Razorpay</span>
                    <button style="background:none;border:none;color:#fff;font-size:1.2rem" onclick="document.getElementById('paymentModal').remove()">&times;</button>
                </div>
                <div class="payment-body" id="paymentBody">
                    <div class="payment-amount">${HJKUtils.formatPrice(total)}</div>
                    <p class="text-center text-muted mb-3" style="font-size:0.85rem">Select payment method</p>
                    <div class="payment-methods">
                        <button class="payment-method-btn" onclick="HJKCheckout.processPayment()"><i class="fa-solid fa-mobile-screen-button text-info"></i> UPI (GPay, PhonePe, Paytm)</button>
                        <button class="payment-method-btn" onclick="HJKCheckout.processPayment()"><i class="fa-solid fa-credit-card text-warning"></i> Credit / Debit Card</button>
                        <button class="payment-method-btn" onclick="HJKCheckout.processPayment()"><i class="fa-solid fa-building-columns text-success"></i> Net Banking</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    processPayment() {
        const body = document.getElementById('paymentBody');
        body.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner mx-auto mb-3"></div>
                <p style="font-weight:500">Processing payment...</p>
                <p class="text-muted" style="font-size:0.82rem">Please do not close this window</p>
            </div>`;

        setTimeout(() => this.completeOrder(), 2000);
    },

    completeOrder() {
        const user = HJKApp.getCurrentUser();
        const cart = HJKApp.getCart();
        const products = HJKUtils.store.get('hjk_products') || [];
        const addresses = HJKUtils.store.get('hjk_addresses') || [];
        const address = addresses.find(a => a.id === this.selectedAddressId);
        const deliveryOptions = HJKUtils.store.get('hjk_delivery_options') || [];
        const delivery = deliveryOptions.find(d => d.id === this.selectedDeliveryId);

        let subtotal = 0;
        const orderItems = cart.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            const variant = product?.variants.find(v => v.id === item.variantId);
            const lineTotal = item.priceAtAdd * item.quantity;
            subtotal += lineTotal;
            return {
                productId: item.productId, productName: product?.name || 'Product',
                variantId: item.variantId, color: variant?.color || '', size: item.size,
                quantity: item.quantity, unitPrice: item.priceAtAdd, totalPrice: lineTotal,
                image: variant?.images[0] || ''
            };
        });

        let discount = 0;
        if (this.coupon) {
            discount = this.coupon.type === 'percentage'
                ? Math.min(subtotal * this.coupon.value / 100, this.coupon.maxDiscount || Infinity)
                : this.coupon.value;
        }
        const shipping = delivery ? (subtotal >= (delivery.freeAbove || Infinity) ? 0 : delivery.cost) : 0;
        const total = subtotal - discount + shipping;

        const order = {
            id: HJKUtils.generateId('ord'),
            orderNumber: HJKUtils.generateOrderNumber(),
            userId: user.id,
            items: orderItems,
            shippingAddress: address ? {
                fullName: address.fullName, phone: address.phone,
                addressLine1: address.addressLine1, addressLine2: address.addressLine2,
                city: address.city, state: address.state, pincode: address.pincode
            } : {},
            subtotal, discount, couponCode: this.coupon?.code || '', shippingCost: shipping, totalAmount: total,
            paymentMethod: 'razorpay', paymentStatus: 'paid',
            paymentId: 'pay_mock_' + Date.now().toString(36),
            orderStatus: 'placed',
            statusHistory: [{ status: 'placed', timestamp: new Date().toISOString(), note: 'Order placed successfully' }],
            deliveryMethod: this.selectedDeliveryId, deliveryMethodName: delivery?.name || '',
            trackingId: '', estimatedDelivery: this.getEstimatedDate(delivery?.estimatedDays),
            notes: '',
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };

        const orders = HJKUtils.store.get('hjk_orders') || [];
        orders.push(order);
        HJKUtils.store.set('hjk_orders', orders);

        // Clear cart and coupon
        HJKUtils.store.set('hjk_cart', { userId: null, items: [], updatedAt: new Date().toISOString() });
        sessionStorage.removeItem('hjk_applied_coupon');
        HJKApp.updateCartBadge();

        // Redirect
        window.location.href = 'order-confirmation.html?orderId=' + order.id;
    },

    getEstimatedDate(daysStr) {
        if (!daysStr) return '';
        const maxDays = parseInt(daysStr.split('-').pop()) || 7;
        const d = new Date();
        d.setDate(d.getDate() + maxDays);
        return d.toISOString().slice(0, 10);
    }
};

document.addEventListener('DOMContentLoaded', () => { setTimeout(() => HJKCheckout.init(), 100); });
