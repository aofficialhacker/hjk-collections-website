/* ============================================
   HJKCollections - Utility Functions
   ============================================ */

const HJKUtils = {
    // Format currency (INR)
    formatPrice(amount) {
        return '₹' + Number(amount).toLocaleString('en-IN');
    },

    // Calculate discount percentage
    getDiscount(normalPrice, sellingPrice) {
        if (!normalPrice || normalPrice <= sellingPrice) return 0;
        return Math.round(((normalPrice - sellingPrice) / normalPrice) * 100);
    },

    // Format date
    formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    // Format date with time
    formatDateTime(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    },

    // Relative time
    timeAgo(dateStr) {
        const now = new Date();
        const past = new Date(dateStr);
        const diff = Math.floor((now - past) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
        if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
        if (diff < 2592000) return Math.floor(diff / 86400) + ' days ago';
        return HJKUtils.formatDate(dateStr);
    },

    // Generate unique ID
    generateId(prefix = 'id') {
        return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    },

    // Generate order number
    generateOrderNumber() {
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return 'HJK-' + date + '-' + rand;
    },

    // Slugify string
    slugify(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    },

    // Truncate text
    truncate(text, maxLen = 100) {
        if (!text || text.length <= maxLen) return text;
        return text.substr(0, maxLen) + '...';
    },

    // Email validation
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Phone validation (Indian)
    isValidPhone(phone) {
        return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
    },

    // Pincode validation
    isValidPincode(pin) {
        return /^\d{6}$/.test(pin);
    },

    // Password strength check
    getPasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        if (score <= 2) return { label: 'Weak', color: 'var(--danger)', percent: 25 };
        if (score <= 3) return { label: 'Fair', color: 'var(--warning)', percent: 50 };
        if (score <= 4) return { label: 'Good', color: 'var(--info)', percent: 75 };
        return { label: 'Strong', color: 'var(--success)', percent: 100 };
    },

    // Get URL params
    getUrlParam(key) {
        const params = new URLSearchParams(window.location.search);
        return params.get(key);
    },

    // Set URL params without reload
    setUrlParams(params) {
        const url = new URL(window.location);
        Object.entries(params).forEach(([k, v]) => {
            if (v === null || v === undefined || v === '') {
                url.searchParams.delete(k);
            } else {
                url.searchParams.set(k, v);
            }
        });
        window.history.pushState({}, '', url);
    },

    // localStorage helpers
    store: {
        get(key) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch {
                return null;
            }
        },
        set(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        },
        remove(key) {
            localStorage.removeItem(key);
        }
    },

    // Debounce
    debounce(fn, delay = 300) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    // Deep clone
    clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Render stars HTML
    renderStars(rating, showCount = false, count = 0) {
        let html = '<div class="star-rating">';
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                html += '<i class="fa-solid fa-star filled"></i>';
            } else if (i === fullStars + 1 && hasHalf) {
                html += '<i class="fa-solid fa-star-half-stroke"></i>';
            } else {
                html += '<i class="fa-solid fa-star"></i>';
            }
        }
        if (showCount) {
            html += `<span class="rating-count">(${count})</span>`;
        }
        html += '</div>';
        return html;
    },

    // Render price HTML
    renderPrice(normalPrice, sellingPrice) {
        const discount = this.getDiscount(normalPrice, sellingPrice);
        let html = '<div class="price-display">';
        html += `<span class="selling-price">${this.formatPrice(sellingPrice)}</span>`;
        if (discount > 0) {
            html += `<span class="normal-price">${this.formatPrice(normalPrice)}</span>`;
            html += `<span class="discount-percent">${discount}% off</span>`;
        }
        html += '</div>';
        return html;
    },

    // Get lowest price from product
    getLowestPrice(product) {
        let lowest = Infinity;
        let lowestNormal = Infinity;
        product.variants.forEach(v => {
            v.sizes.forEach(s => {
                if (s.sellingPrice < lowest) {
                    lowest = s.sellingPrice;
                    lowestNormal = s.normalPrice;
                }
            });
        });
        return { sellingPrice: lowest, normalPrice: lowestNormal };
    },

    // Get total stock
    getTotalStock(product) {
        let total = 0;
        product.variants.forEach(v => {
            v.sizes.forEach(s => { total += s.stock; });
        });
        return total;
    },

    // Scroll to top
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Scroll to element
    scrollTo(selector) {
        const el = document.querySelector(selector);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    // Get status badge HTML
    getStatusBadge(status) {
        const map = {
            placed: { label: 'Placed', class: 'badge-info' },
            confirmed: { label: 'Confirmed', class: 'badge-info' },
            processing: { label: 'Processing', class: 'badge-warning' },
            shipped: { label: 'Shipped', class: 'badge-warning' },
            out_for_delivery: { label: 'Out for Delivery', class: 'badge-warning' },
            delivered: { label: 'Delivered', class: 'badge-success' },
            cancelled: { label: 'Cancelled', class: 'badge-danger' },
            return_requested: { label: 'Return Requested', class: 'badge-warning' },
            return_approved: { label: 'Return Approved', class: 'badge-info' },
            returned: { label: 'Returned', class: 'badge-success' },
            refunded: { label: 'Refunded', class: 'badge-success' },
            pending: { label: 'Pending', class: 'badge-warning' },
            approved: { label: 'Approved', class: 'badge-success' },
            rejected: { label: 'Rejected', class: 'badge-danger' },
            completed: { label: 'Completed', class: 'badge-success' },
            active: { label: 'Active', class: 'badge-success' },
            inactive: { label: 'Inactive', class: 'badge-danger' },
            paid: { label: 'Paid', class: 'badge-success' },
            failed: { label: 'Failed', class: 'badge-danger' }
        };
        const s = map[status] || { label: status, class: 'badge-info' };
        return `<span class="badge-custom ${s.class}">${s.label}</span>`;
    },

    // Simple share URLs
    shareUrls: {
        whatsapp(text, url) {
            return `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        },
        facebook(url) {
            return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        },
        twitter(text, url) {
            return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        },
        copyLink(url) {
            navigator.clipboard.writeText(url);
        }
    },

    // Format file size
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    },

    // CSV export
    exportCSV(data, filename) {
        if (!data.length) return;
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                let val = row[h] ?? '';
                if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                    val = '"' + val.replace(/"/g, '""') + '"';
                }
                return val;
            }).join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};
