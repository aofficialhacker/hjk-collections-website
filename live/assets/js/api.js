/* ============================================
   HJKCollections - API Client
   ============================================ */

const HJKAPI = {
    baseUrl: '/api',

    async request(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;
        const config = {
            credentials: 'include',
            headers: {},
            ...options,
        };

        if (config.body && !(config.body instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    // Session expired
                    const isAdmin = window.location.pathname.includes('/admin');
                    if (isAdmin) {
                        window.location.href = 'login.html';
                    }
                }
                throw { message: data.message || 'Request failed', status: response.status, errors: data.errors };
            }

            return data;
        } catch (error) {
            if (error.message && error.status) throw error;
            throw { message: 'Network error. Please check your connection.', status: 0 };
        }
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body });
    },

    put(endpoint, body) {
        return this.request(endpoint, { method: 'PUT', body });
    },

    delete(endpoint, body) {
        return this.request(endpoint, { method: 'DELETE', body });
    },

    upload(endpoint, formData) {
        return this.request(endpoint, { method: 'POST', body: formData });
    },

    // Auth endpoints
    auth: {
        login(email, password) {
            return HJKAPI.post('/auth/login.php', { email, password });
        },
        register(data) {
            return HJKAPI.post('/auth/register.php', data);
        },
        adminLogin(email, password) {
            return HJKAPI.post('/auth/admin-login.php', { email, password });
        },
        logout() {
            return HJKAPI.post('/auth/logout.php');
        },
        session() {
            return HJKAPI.get('/auth/session.php');
        },
        forgotPassword(email) {
            return HJKAPI.post('/auth/forgot-password.php', { email });
        },
        resetPassword(email, password) {
            return HJKAPI.post('/auth/reset-password.php', { email, password });
        },
    },

    // Product endpoints
    products: {
        list(params = {}) {
            const query = new URLSearchParams(params).toString();
            return HJKAPI.get('/products/list.php' + (query ? '?' + query : ''));
        },
        detail(idOrSlug) {
            const param = !isNaN(idOrSlug) ? 'id' : 'slug';
            return HJKAPI.get(`/products/detail.php?${param}=${idOrSlug}`);
        },
        featured(limit = 8) {
            return HJKAPI.get(`/products/featured.php?limit=${limit}`);
        },
        search(q) {
            return HJKAPI.get(`/products/search.php?q=${encodeURIComponent(q)}`);
        },
    },

    // Category endpoints
    categories: {
        list() {
            return HJKAPI.get('/categories/list.php');
        },
    },

    // Cart endpoints
    cart: {
        get() {
            return HJKAPI.get('/cart/get.php');
        },
        add(productId, variantId, size, quantity = 1) {
            return HJKAPI.post('/cart/add.php', { productId, variantId, size, quantity });
        },
        update(id, quantity) {
            return HJKAPI.put('/cart/update.php', { id, quantity });
        },
        remove(id) {
            return HJKAPI.delete('/cart/remove.php', { id });
        },
    },

    // Wishlist endpoints
    wishlist: {
        get() {
            return HJKAPI.get('/wishlist/get.php');
        },
        toggle(productId, variantId) {
            return HJKAPI.post('/wishlist/toggle.php', { productId, variantId });
        },
    },

    // Address endpoints
    addresses: {
        list() {
            return HJKAPI.get('/addresses/list.php');
        },
        save(data) {
            return HJKAPI.post('/addresses/save.php', data);
        },
        delete(id) {
            return HJKAPI.delete('/addresses/delete.php', { id });
        },
        setDefault(id) {
            return HJKAPI.put('/addresses/set-default.php', { id });
        },
    },

    // Order endpoints
    orders: {
        create(data) {
            return HJKAPI.post('/orders/create.php', data);
        },
        list(params = {}) {
            const query = new URLSearchParams(params).toString();
            return HJKAPI.get('/orders/list.php' + (query ? '?' + query : ''));
        },
        detail(id) {
            return HJKAPI.get(`/orders/detail.php?id=${id}`);
        },
        cancel(id, reason) {
            return HJKAPI.put('/orders/cancel.php', { id, reason });
        },
        submitReturn(data) {
            return HJKAPI.post('/orders/return.php', data);
        },
    },

    // Checkout endpoints
    checkout: {
        validateCoupon(code, orderAmount) {
            return HJKAPI.post('/checkout/validate-coupon.php', { code, orderAmount });
        },
        deliveryOptions() {
            return HJKAPI.get('/checkout/delivery-options.php');
        },
    },

    // Review endpoints
    reviews: {
        list(productId, params = {}) {
            params.product_id = productId;
            const query = new URLSearchParams(params).toString();
            return HJKAPI.get('/reviews/list.php?' + query);
        },
        create(data) {
            return HJKAPI.post('/reviews/create.php', data);
        },
    },

    // Other endpoints
    settings: {
        get() {
            return HJKAPI.get('/settings/get.php');
        },
    },

    banners: {
        list() {
            return HJKAPI.get('/banners/list.php');
        },
    },

    pages: {
        get(slug) {
            return HJKAPI.get(`/pages/get.php?slug=${slug}`);
        },
    },

    tracking: {
        search(orderNumber) {
            return HJKAPI.get(`/tracking/search.php?order_number=${encodeURIComponent(orderNumber)}`);
        },
    },

    newsletter: {
        subscribe(email) {
            return HJKAPI.post('/newsletter/subscribe.php', { email });
        },
    },

    // Admin endpoints
    admin: {
        dashboard: {
            stats() { return HJKAPI.get('/admin/dashboard/stats.php'); },
        },
        categories: {
            list(params = {}) {
                const q = new URLSearchParams(params).toString();
                return HJKAPI.get('/admin/categories/list.php' + (q ? '?' + q : ''));
            },
            save(data) { return HJKAPI.post('/admin/categories/save.php', data); },
            delete(id) { return HJKAPI.delete('/admin/categories/delete.php', { id }); },
            toggle(id) { return HJKAPI.put('/admin/categories/toggle.php', { id }); },
        },
        products: {
            list(params = {}) {
                const q = new URLSearchParams(params).toString();
                return HJKAPI.get('/admin/products/list.php' + (q ? '?' + q : ''));
            },
            detail(id) { return HJKAPI.get(`/admin/products/detail.php?id=${id}`); },
            save(data) { return HJKAPI.post('/admin/products/save.php', data); },
            delete(id) { return HJKAPI.delete('/admin/products/delete.php', { id }); },
            toggle(id) { return HJKAPI.put('/admin/products/toggle.php', { id }); },
            duplicate(id) { return HJKAPI.post('/admin/products/duplicate.php', { id }); },
            uploadImages(formData) { return HJKAPI.upload('/admin/products/upload-image.php', formData); },
        },
        orders: {
            list(params = {}) {
                const q = new URLSearchParams(params).toString();
                return HJKAPI.get('/admin/orders/list.php' + (q ? '?' + q : ''));
            },
            detail(id) { return HJKAPI.get(`/admin/orders/detail.php?id=${id}`); },
            updateStatus(data) { return HJKAPI.put('/admin/orders/update-status.php', data); },
        },
        customers: {
            list(params = {}) {
                const q = new URLSearchParams(params).toString();
                return HJKAPI.get('/admin/customers/list.php' + (q ? '?' + q : ''));
            },
            toggle(id) { return HJKAPI.put('/admin/customers/toggle.php', { id }); },
        },
        coupons: {
            list(params = {}) {
                const q = new URLSearchParams(params).toString();
                return HJKAPI.get('/admin/coupons/list.php' + (q ? '?' + q : ''));
            },
            save(data) { return HJKAPI.post('/admin/coupons/save.php', data); },
            delete(id) { return HJKAPI.delete('/admin/coupons/delete.php', { id }); },
            toggle(id) { return HJKAPI.put('/admin/coupons/toggle.php', { id }); },
        },
        delivery: {
            list() { return HJKAPI.get('/admin/delivery/list.php'); },
            save(data) { return HJKAPI.post('/admin/delivery/save.php', data); },
            delete(id) { return HJKAPI.delete('/admin/delivery/delete.php', { id }); },
            toggle(id) { return HJKAPI.put('/admin/delivery/toggle.php', { id }); },
        },
        reviews: {
            list(params = {}) {
                const q = new URLSearchParams(params).toString();
                return HJKAPI.get('/admin/reviews/list.php' + (q ? '?' + q : ''));
            },
            update(data) { return HJKAPI.put('/admin/reviews/update.php', data); },
        },
        returns: {
            list(params = {}) {
                const q = new URLSearchParams(params).toString();
                return HJKAPI.get('/admin/returns/list.php' + (q ? '?' + q : ''));
            },
            update(data) { return HJKAPI.put('/admin/returns/update.php', data); },
        },
        settings: {
            get() { return HJKAPI.get('/admin/settings/get.php'); },
            save(data) { return HJKAPI.post('/admin/settings/save.php', data); },
        },
        banners: {
            list() { return HJKAPI.get('/admin/banners/list.php'); },
            save(data) { return HJKAPI.post('/admin/banners/save.php', data); },
            delete(id) { return HJKAPI.delete('/admin/banners/delete.php', { id }); },
            toggle(id) { return HJKAPI.put('/admin/banners/toggle.php', { id }); },
        },
        cms: {
            list() { return HJKAPI.get('/admin/cms/list.php'); },
            save(data) { return HJKAPI.post('/admin/cms/save.php', data); },
        },
        reports: {
            sales(params = {}) {
                const q = new URLSearchParams(params).toString();
                return HJKAPI.get('/admin/reports/sales.php' + (q ? '?' + q : ''));
            },
            products(params = {}) {
                const q = new URLSearchParams(params).toString();
                return HJKAPI.get('/admin/reports/products.php' + (q ? '?' + q : ''));
            },
        },
    },
};
