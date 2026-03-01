/* ============================================
   HJKCollections - Shared UI Components
   ============================================ */

const HJKComponents = {
    renderHeader() {
        const session = HJKUtils.store.get('hjk_session');
        const isLoggedIn = session && session.isLoggedIn;
        const user = isLoggedIn ? (() => {
            const users = HJKUtils.store.get('hjk_users') || [];
            return users.find(u => u.id === session.userId);
        })() : null;
        const categories = HJKUtils.store.get('hjk_categories') || [];

        return `
        <nav class="navbar navbar-expand-lg sticky-top" id="main-navbar">
            <div class="container-custom">
                <a class="navbar-brand" href="index.html">
                    <span class="brand-text">
                        <span class="brand-hjk">HJK</span><span class="brand-collections">Collections</span>
                    </span>
                </a>

                <div class="header-actions-mobile d-lg-none">
                    <a href="wishlist.html" class="header-icon-btn" data-tooltip="Wishlist">
                        <i class="fa-regular fa-heart"></i>
                        <span class="icon-badge wishlist-badge">0</span>
                    </a>
                    <a href="cart.html" class="header-icon-btn" data-tooltip="Cart">
                        <i class="fa-solid fa-bag-shopping"></i>
                        <span class="icon-badge cart-badge">0</span>
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileMenu">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                </div>

                <div class="collapse navbar-collapse" id="navbarContent">
                    <ul class="navbar-nav mx-auto">
                        <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="products.html" data-bs-toggle="dropdown">Shop</a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="products.html">All Products</a></li>
                                <li><hr class="dropdown-divider"></li>
                                ${categories.filter(c => c.isActive).map(c =>
                                    `<li><a class="dropdown-item" href="products.html?category=${c.slug}">${c.name}</a></li>`
                                ).join('')}
                            </ul>
                        </li>
                        <li class="nav-item"><a class="nav-link" href="about.html">About</a></li>
                        <li class="nav-item"><a class="nav-link" href="contact.html">Contact</a></li>
                    </ul>

                    <div class="header-search d-none d-lg-block">
                        <div class="search-wrapper">
                            <input type="text" class="search-input" placeholder="Search bags..." id="headerSearch">
                            <i class="fa-solid fa-magnifying-glass search-icon"></i>
                            <div class="search-results" id="searchResults"></div>
                        </div>
                    </div>

                    <div class="header-actions d-none d-lg-flex">
                        ${isLoggedIn ? `
                            <div class="dropdown">
                                <button class="header-icon-btn dropdown-toggle" data-bs-toggle="dropdown">
                                    <i class="fa-regular fa-user"></i>
                                    <span class="header-user-name">${user ? user.firstName : 'Account'}</span>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li><a class="dropdown-item" href="profile/index.html"><i class="fa-regular fa-user me-2"></i>My Profile</a></li>
                                    <li><a class="dropdown-item" href="profile/orders.html"><i class="fa-solid fa-box me-2"></i>My Orders</a></li>
                                    <li><a class="dropdown-item" href="profile/addresses.html"><i class="fa-solid fa-location-dot me-2"></i>Addresses</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item" href="#" onclick="HJKApp.logout(); return false;"><i class="fa-solid fa-right-from-bracket me-2"></i>Logout</a></li>
                                </ul>
                            </div>
                        ` : `
                            <a href="login.html" class="header-icon-btn" data-tooltip="Login">
                                <i class="fa-regular fa-user"></i>
                            </a>
                        `}
                        <a href="wishlist.html" class="header-icon-btn" data-tooltip="Wishlist">
                            <i class="fa-regular fa-heart"></i>
                            <span class="icon-badge wishlist-badge">0</span>
                        </a>
                        <a href="cart.html" class="header-icon-btn" data-tooltip="Cart">
                            <i class="fa-solid fa-bag-shopping"></i>
                            <span class="icon-badge cart-badge">0</span>
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Mobile Offcanvas Menu -->
        <div class="offcanvas offcanvas-end" tabindex="-1" id="mobileMenu">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title font-heading">Menu</h5>
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
            </div>
            <div class="offcanvas-body">
                <div class="mobile-search mb-3">
                    <input type="text" class="form-control-custom" placeholder="Search bags..." id="mobileSearch">
                </div>
                <ul class="mobile-nav-list">
                    <li><a href="index.html"><i class="fa-solid fa-house me-2"></i>Home</a></li>
                    <li><a href="products.html"><i class="fa-solid fa-bag-shopping me-2"></i>All Products</a></li>
                    ${categories.filter(c => c.isActive).map(c =>
                        `<li><a href="products.html?category=${c.slug}" class="ps-4">${c.name}</a></li>`
                    ).join('')}
                    <li><a href="about.html"><i class="fa-solid fa-info-circle me-2"></i>About Us</a></li>
                    <li><a href="contact.html"><i class="fa-solid fa-envelope me-2"></i>Contact</a></li>
                    <li class="divider"></li>
                    ${isLoggedIn ? `
                        <li><a href="profile/index.html"><i class="fa-regular fa-user me-2"></i>My Profile</a></li>
                        <li><a href="profile/orders.html"><i class="fa-solid fa-box me-2"></i>My Orders</a></li>
                        <li><a href="wishlist.html"><i class="fa-regular fa-heart me-2"></i>Wishlist</a></li>
                        <li><a href="#" onclick="HJKApp.logout(); return false;"><i class="fa-solid fa-right-from-bracket me-2"></i>Logout</a></li>
                    ` : `
                        <li><a href="login.html"><i class="fa-solid fa-right-to-bracket me-2"></i>Login</a></li>
                        <li><a href="register.html"><i class="fa-solid fa-user-plus me-2"></i>Register</a></li>
                    `}
                </ul>
            </div>
        </div>`;
    },

    initHeaderEvents() {
        // Search autocomplete
        const searchInput = document.getElementById('headerSearch');
        const searchResults = document.getElementById('searchResults');
        if (searchInput && searchResults) {
            searchInput.addEventListener('input', HJKUtils.debounce((e) => {
                const query = e.target.value.trim();
                if (query.length < 2) {
                    searchResults.style.display = 'none';
                    return;
                }
                const results = HJKApp.searchProducts(query);
                if (results.length === 0) {
                    searchResults.innerHTML = '<div class="search-no-results">No products found</div>';
                } else {
                    searchResults.innerHTML = results.map(p => {
                        const price = HJKUtils.getLowestPrice(p);
                        const img = p.variants[0]?.images[0] || '';
                        return `
                            <a href="product-detail.html?id=${p.id}" class="search-result-item">
                                <img src="${img}" alt="${p.name}">
                                <div class="search-result-info">
                                    <div class="search-result-name">${p.name}</div>
                                    <div class="search-result-price">${HJKUtils.formatPrice(price.sellingPrice)}</div>
                                </div>
                            </a>`;
                    }).join('');
                }
                searchResults.style.display = 'block';
            }, 250));

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-wrapper')) {
                    searchResults.style.display = 'none';
                }
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const q = searchInput.value.trim();
                    if (q) window.location.href = `products.html?search=${encodeURIComponent(q)}`;
                }
            });
        }

        // Active nav link
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    },

    renderFooter() {
        const settings = HJKUtils.store.get('hjk_settings') || {};
        const categories = HJKUtils.store.get('hjk_categories') || [];

        return `
        <footer class="site-footer">
            <div class="footer-main">
                <div class="container-custom">
                    <div class="row g-4">
                        <div class="col-lg-4 col-md-6">
                            <div class="footer-brand">
                                <h3 class="font-heading mb-3"><span style="color: var(--secondary)">HJK</span>Collections</h3>
                                <p>${settings.footerAbout || ''}</p>
                                <div class="footer-social">
                                    ${settings.socialLinks?.facebook ? `<a href="${settings.socialLinks.facebook}" target="_blank"><i class="fa-brands fa-facebook-f"></i></a>` : ''}
                                    ${settings.socialLinks?.instagram ? `<a href="${settings.socialLinks.instagram}" target="_blank"><i class="fa-brands fa-instagram"></i></a>` : ''}
                                    ${settings.socialLinks?.twitter ? `<a href="${settings.socialLinks.twitter}" target="_blank"><i class="fa-brands fa-twitter"></i></a>` : ''}
                                    ${settings.socialLinks?.youtube ? `<a href="${settings.socialLinks.youtube}" target="_blank"><i class="fa-brands fa-youtube"></i></a>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-2 col-md-6 col-6">
                            <h5 class="footer-title">Quick Links</h5>
                            <ul class="footer-links">
                                <li><a href="index.html">Home</a></li>
                                <li><a href="products.html">Shop</a></li>
                                <li><a href="about.html">About Us</a></li>
                                <li><a href="contact.html">Contact</a></li>
                                <li><a href="faq.html">FAQ</a></li>
                            </ul>
                        </div>
                        <div class="col-lg-2 col-md-6 col-6">
                            <h5 class="footer-title">Categories</h5>
                            <ul class="footer-links">
                                ${categories.filter(c => c.isActive).map(c =>
                                    `<li><a href="products.html?category=${c.slug}">${c.name}</a></li>`
                                ).join('')}
                            </ul>
                        </div>
                        <div class="col-lg-4 col-md-6">
                            <h5 class="footer-title">Contact & Newsletter</h5>
                            <div class="footer-contact">
                                <p><i class="fa-solid fa-location-dot me-2"></i>${settings.address || ''}</p>
                                <p><i class="fa-solid fa-phone me-2"></i>${settings.contactPhone || ''}</p>
                                <p><i class="fa-solid fa-envelope me-2"></i>${settings.contactEmail || ''}</p>
                            </div>
                            <div class="footer-newsletter mt-3">
                                <p class="mb-2" style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">Subscribe for updates & offers</p>
                                <form class="newsletter-form" onsubmit="HJKComponents.handleNewsletter(event)">
                                    <input type="email" placeholder="Your email address" required>
                                    <button type="submit"><i class="fa-solid fa-paper-plane"></i></button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <div class="container-custom">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <p>&copy; 2026 HJKCollections. All rights reserved.</p>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <div class="footer-bottom-links">
                                <a href="terms.html">Terms</a>
                                <a href="privacy.html">Privacy</a>
                                <a href="shipping-policy.html">Shipping</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>`;
    },

    handleNewsletter(e) {
        e.preventDefault();
        const email = e.target.querySelector('input').value;
        let subscribers = HJKUtils.store.get('hjk_newsletter') || [];
        if (subscribers.includes(email)) {
            this.showToast('You are already subscribed!', 'info');
        } else {
            subscribers.push(email);
            HJKUtils.store.set('hjk_newsletter', subscribers);
            this.showToast('Subscribed successfully!', 'success');
        }
        e.target.reset();
    },

    // Product Card
    renderProductCard(product) {
        const price = HJKUtils.getLowestPrice(product);
        const discount = HJKUtils.getDiscount(price.normalPrice, price.sellingPrice);
        const img = product.variants[0]?.images[0] || '';
        const isWished = HJKApp.isInWishlist(product.id);
        const category = HJKApp.getCategory(product.categoryId);

        return `
        <div class="product-card card-custom hover-lift">
            <div class="product-card-image img-hover-zoom">
                <a href="product-detail.html?id=${product.id}">
                    <img src="${img}" alt="${product.name}" loading="lazy">
                </a>
                ${discount > 0 ? `<span class="product-badge badge-discount">${discount}% OFF</span>` : ''}
                <div class="product-card-actions">
                    <button class="btn-icon wishlist-toggle ${isWished ? 'active' : ''}"
                            onclick="HJKComponents.toggleWishlistBtn(this, '${product.id}', '${product.variants[0]?.id}')"
                            data-tooltip="${isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                        <i class="fa-${isWished ? 'solid' : 'regular'} fa-heart"></i>
                    </button>
                    <button class="btn-icon" onclick="HJKComponents.quickView('${product.id}')" data-tooltip="Quick View">
                        <i class="fa-regular fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="product-card-body">
                ${category ? `<span class="product-card-category">${category.name}</span>` : ''}
                <h5 class="product-card-title">
                    <a href="product-detail.html?id=${product.id}">${product.name}</a>
                </h5>
                ${HJKUtils.renderStars(product.averageRating, true, product.totalReviews)}
                <div class="product-card-price">
                    ${HJKUtils.renderPrice(price.normalPrice, price.sellingPrice)}
                </div>
                <div class="product-card-colors">
                    ${product.variants.slice(0, 4).map(v =>
                        `<span class="color-dot" style="background:${v.colorHex}" title="${v.color}"></span>`
                    ).join('')}
                    ${product.variants.length > 4 ? `<span class="color-dot-more">+${product.variants.length - 4}</span>` : ''}
                </div>
            </div>
        </div>`;
    },

    toggleWishlistBtn(btn, productId, variantId) {
        const isNowWished = HJKApp.toggleWishlist(productId, variantId);
        btn.classList.toggle('active', isNowWished);
        const icon = btn.querySelector('i');
        icon.className = isNowWished ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        btn.setAttribute('data-tooltip', isNowWished ? 'Remove from Wishlist' : 'Add to Wishlist');
    },

    quickView(productId) {
        const product = HJKApp.getProduct(productId);
        if (!product) return;
        const price = HJKUtils.getLowestPrice(product);
        const img = product.variants[0]?.images[0] || '';
        const category = HJKApp.getCategory(product.categoryId);

        const html = `
        <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
            <div class="modal-content-custom" style="max-width:700px">
                <div class="modal-header-custom">
                    <h5>Quick View</h5>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body-custom">
                    <div class="row g-3">
                        <div class="col-md-5">
                            <img src="${img}" alt="${product.name}" class="w-100 rounded" style="aspect-ratio:1;object-fit:cover;">
                        </div>
                        <div class="col-md-7">
                            ${category ? `<span class="badge-custom badge-primary mb-2">${category.name}</span>` : ''}
                            <h4 class="font-heading mb-2">${product.name}</h4>
                            ${HJKUtils.renderStars(product.averageRating, true, product.totalReviews)}
                            <div class="my-3">${HJKUtils.renderPrice(price.normalPrice, price.sellingPrice)}</div>
                            <p class="text-muted" style="font-size:0.9rem">${product.shortDescription}</p>
                            <div class="mt-3 d-flex gap-2">
                                <a href="product-detail.html?id=${product.id}" class="btn-primary-custom btn-sm">View Details</a>
                                <button class="btn-outline-custom btn-sm" onclick="HJKApp.addToCart('${product.id}','${product.variants[0].id}','${product.variants[0].sizes[0].size}');this.closest('.modal-overlay').remove()">
                                    <i class="fa-solid fa-bag-shopping"></i> Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    // Toast Notification
    showToast(message, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: 'fa-circle-check text-success',
            error: 'fa-circle-xmark text-danger',
            warning: 'fa-triangle-exclamation text-warning',
            info: 'fa-circle-info text-info'
        };

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.classList.add('toast-hide');setTimeout(()=>this.parentElement.remove(),300)">&times;</button>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Confirm Modal
    showConfirm(title, message, onConfirm) {
        const html = `
        <div class="modal-overlay" id="confirmModal">
            <div class="modal-content-custom" style="max-width:420px">
                <div class="modal-header-custom">
                    <h5>${title}</h5>
                    <button class="modal-close" onclick="document.getElementById('confirmModal').remove()">&times;</button>
                </div>
                <div class="modal-body-custom">
                    <p class="mb-0">${message}</p>
                </div>
                <div class="modal-footer-custom">
                    <button class="btn-outline-custom btn-sm" onclick="document.getElementById('confirmModal').remove()">Cancel</button>
                    <button class="btn-primary-custom btn-sm" id="confirmBtn" style="background:var(--danger);border-color:var(--danger)">Confirm</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('confirmBtn').addEventListener('click', () => {
            document.getElementById('confirmModal').remove();
            onConfirm();
        });
    },

    // Breadcrumbs
    renderBreadcrumbs(items) {
        return `
        <div class="breadcrumb-custom">
            <a href="index.html">Home</a>
            ${items.map((item, i) => `
                <span class="separator"><i class="fa-solid fa-chevron-right"></i></span>
                ${i === items.length - 1
                    ? `<span class="current">${item.label}</span>`
                    : `<a href="${item.url}">${item.label}</a>`
                }
            `).join('')}
        </div>`;
    },

    // Pagination
    renderPagination(currentPage, totalPages, onPageChange) {
        if (totalPages <= 1) return '';
        let html = '<div class="pagination-custom">';

        html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}"
                    ${currentPage > 1 ? `onclick="${onPageChange}(${currentPage - 1})"` : ''}>
                    <i class="fa-solid fa-chevron-left"></i></button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
                if (i === 3 || i === totalPages - 2) html += '<span class="page-btn disabled">...</span>';
                continue;
            }
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}"
                        onclick="${onPageChange}(${i})">${i}</button>`;
        }

        html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}"
                    ${currentPage < totalPages ? `onclick="${onPageChange}(${currentPage + 1})"` : ''}>
                    <i class="fa-solid fa-chevron-right"></i></button>`;

        html += '</div>';
        return html;
    },

    // Empty State
    renderEmptyState(icon, title, message, btnText, btnHref) {
        return `
        <div class="empty-state">
            <i class="fa-solid ${icon}"></i>
            <h4>${title}</h4>
            <p>${message}</p>
            ${btnText ? `<a href="${btnHref}" class="btn-primary-custom">${btnText}</a>` : ''}
        </div>`;
    },

    // Loading
    showLoader() {
        if (document.querySelector('.loading-overlay')) return;
        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loader);
    },

    hideLoader() {
        const loader = document.querySelector('.loading-overlay');
        if (loader) loader.remove();
    }
};
