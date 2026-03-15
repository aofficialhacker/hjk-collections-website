/* ============================================
   HJKCollections - Checkout Page Logic
   ============================================ */

const HJKCheckout = {
    selectedAddressId: null,
    coupon: null,
    currentStep: 1,
    cartData: null,
    addresses: [],

    async init() {
        if (!HJKApp.requireLogin('checkout.html')) return;

        try {
            const cartRes = await HJKAPI.cart.get();
            if (!cartRes.success || !cartRes.data.items || cartRes.data.items.length === 0) {
                window.location.href = 'cart.html';
                return;
            }
            this.cartData = cartRes.data;
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to load cart', 'error');
            window.location.href = 'cart.html';
            return;
        }

        this.coupon = JSON.parse(sessionStorage.getItem('hjk_applied_coupon') || 'null');
        this.renderSteps();
        await this.renderAddresses();
        this.renderOrderSummary();
    },

    renderSteps() {
        const container = document.getElementById('checkoutSteps');
        if (!container) return;
        const steps = ['Address', 'Review & Pay'];
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

    async renderAddresses() {
        const container = document.getElementById('addressSection');
        if (!container) return;

        try {
            const res = await HJKAPI.addresses.list();
            if (res.success) {
                this.addresses = res.data || [];
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to load addresses', 'error');
            this.addresses = [];
        }

        const addresses = this.addresses;

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
        const container = document.getElementById('addressSection');
        if (!container) return;
        const addresses = this.addresses;

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

    async saveAddress() {
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

        try {
            const res = await HJKAPI.addresses.save({
                label, fullName, phone,
                addressLine1: line1, addressLine2: line2,
                city, state, pincode
            });
            if (res.success) {
                this.selectedAddressId = res.data.id;
                await this.renderAddresses();
                HJKComponents.showToast('Address saved!', 'success');
            } else {
                HJKComponents.showToast(res.message || 'Failed to save address', 'error');
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to save address', 'error');
        }
    },

    getShippingCost(subtotal) {
        // Free shipping above ₹1,500, otherwise ₹99 flat
        const settings = HJKApp.getSettings();
        const freeAbove = settings?.freeShippingAbove || 1500;
        const flatRate = settings?.shippingFlatRate || 99;
        return subtotal >= freeAbove ? 0 : flatRate;
    },

    renderOrderSummary() {
        const container = document.getElementById('orderSummary');
        if (!container) return;

        const cart = this.cartData;

        let subtotal = 0;
        let itemsHtml = '';

        (cart?.items || []).forEach(item => {
            const img = item.image || '';
            const lineTotal = item.currentPrice * item.quantity;
            subtotal += lineTotal;
            itemsHtml += `
                <div class="d-flex gap-3 mb-3 pb-3" style="border-bottom:1px solid var(--border)">
                    <img src="${img}" alt="${item.productName}" style="width:60px;height:60px;object-fit:cover;border-radius:var(--radius-sm)">
                    <div class="flex-grow-1">
                        <div style="font-weight:600;font-size:0.88rem">${item.productName}</div>
                        <div style="font-size:0.78rem;color:var(--text-muted)">${item.color || ''} | ${item.size} x ${item.quantity}</div>
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

        const shipping = this.getShippingCost(subtotal - discount);
        const total = subtotal - discount + shipping;

        container.innerHTML = `
            <div class="cart-summary">
                <h4>Order Summary</h4>
                ${itemsHtml}
                <div class="summary-row"><span>Subtotal</span><span>${HJKUtils.formatPrice(subtotal)}</span></div>
                ${discount > 0 ? `<div class="summary-row" style="color:var(--success)"><span>Discount (${this.coupon.code})</span><span>-${HJKUtils.formatPrice(discount)}</span></div>` : ''}
                <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span style="color:var(--success)">FREE</span>' : HJKUtils.formatPrice(shipping)}</span></div>
                ${shipping === 0 ? `<div style="font-size:0.75rem;color:var(--success);text-align:right;margin-top:-8px;margin-bottom:8px"><i class="fa-solid fa-truck me-1"></i>Free shipping on orders above ${HJKUtils.formatPrice(HJKApp.getSettings()?.freeShippingAbove || 1500)}</div>` : ''}
                <div class="summary-row total"><span>Total</span><span>${HJKUtils.formatPrice(total)}</span></div>
                <button class="btn-secondary-custom w-100 justify-content-center mt-3" onclick="HJKCheckout.placeOrder()">
                    <i class="fa-solid fa-lock me-1"></i> Pay ${HJKUtils.formatPrice(total)}
                </button>
                <p class="text-center mt-2" style="font-size:0.78rem;color:var(--text-muted)"><i class="fa-solid fa-shield-halved me-1"></i>Secure payment powered by Razorpay</p>
            </div>`;
    },

    placeOrder() {
        if (!this.selectedAddressId) { HJKComponents.showToast('Please select a shipping address', 'error'); return; }
        this.showPaymentModal();
    },

    showPaymentModal() {
        const cart = this.cartData;
        let subtotal = (cart?.items || []).reduce((s, i) => s + i.currentPrice * i.quantity, 0);
        let discount = 0;
        if (this.coupon) {
            discount = this.coupon.type === 'percentage'
                ? Math.min(subtotal * this.coupon.value / 100, this.coupon.maxDiscount || Infinity)
                : this.coupon.value;
        }
        const shipping = this.getShippingCost(subtotal - discount);
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

    async completeOrder() {
        try {
            const orderData = {
                addressId: this.selectedAddressId,
                couponCode: this.coupon?.code || '',
                paymentMethod: 'razorpay',
                paymentId: 'pay_mock_' + Date.now().toString(36)
            };

            const res = await HJKAPI.orders.create(orderData);
            if (!res.success) {
                throw { message: res.message || 'Failed to create order' };
            }

            // Clear coupon
            sessionStorage.removeItem('hjk_applied_coupon');
            HJKApp._cartCount = 0;
            HJKApp.updateCartBadge();

            // Redirect
            window.location.href = 'order-confirmation.html?orderId=' + res.data.id;
        } catch (err) {
            document.getElementById('paymentModal')?.remove();
            HJKComponents.showToast(err.message || 'Failed to place order. Please try again.', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => { setTimeout(() => HJKCheckout.init(), 100); });
