/* ============================================
   HJKCollections - Product Detail Page Logic
   ============================================ */

const HJKProductDetail = {
    product: null,
    selectedVariant: null,
    selectedSize: null,
    quantity: 1,

    init() {
        const productId = HJKUtils.getUrlParam('id');
        if (!productId) { window.location.href = 'products.html'; return; }

        this.product = HJKApp.getProduct(productId);
        if (!this.product) {
            document.getElementById('productDetail').innerHTML = HJKComponents.renderEmptyState('fa-bag-shopping', 'Product Not Found', 'The product you are looking for does not exist.', 'Browse Products', 'products.html');
            return;
        }

        HJKApp.addToRecentlyViewed(productId);
        this.selectedVariant = this.product.variants[0];
        this.selectedSize = this.selectedVariant.sizes[0];
        this.quantity = 1;

        this.renderBreadcrumbs();
        this.renderGallery();
        this.renderProductInfo();
        this.renderTabs();
        this.renderRelated();
    },

    renderBreadcrumbs() {
        const cat = HJKApp.getCategory(this.product.categoryId);
        const bc = document.getElementById('breadcrumbContainer');
        if (bc) {
            const items = [];
            if (cat) items.push({ label: cat.name, url: 'products.html?category=' + cat.slug });
            items.push({ label: this.product.name });
            bc.innerHTML = HJKComponents.renderBreadcrumbs(items);
        }
        document.title = this.product.name + ' - HJKCollections';
    },

    renderGallery() {
        const container = document.getElementById('productGallery');
        const images = this.selectedVariant.images;
        container.innerHTML = `
            <div class="gallery-main" id="galleryMain">
                <img src="${images[0]}" alt="${this.product.name}" id="mainImage">
            </div>
            <div class="gallery-thumbs">
                ${images.map((img, i) => `
                    <div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="HJKProductDetail.changeImage('${img}', this)">
                        <img src="${img}" alt="Thumbnail ${i + 1}">
                    </div>
                `).join('')}
            </div>`;

        // Zoom on hover
        const mainDiv = document.getElementById('galleryMain');
        const mainImg = document.getElementById('mainImage');
        mainDiv.addEventListener('mousemove', (e) => {
            const rect = mainDiv.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            mainImg.style.transformOrigin = `${x}% ${y}%`;
        });
        mainDiv.addEventListener('mouseleave', () => {
            mainImg.style.transformOrigin = 'center center';
        });
    },

    changeImage(src, thumb) {
        document.getElementById('mainImage').src = src;
        document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
        if (thumb) thumb.classList.add('active');
    },

    renderProductInfo() {
        const p = this.product;
        const v = this.selectedVariant;
        const s = this.selectedSize;
        const cat = HJKApp.getCategory(p.categoryId);
        const discount = HJKUtils.getDiscount(s.normalPrice, s.sellingPrice);
        const isWished = HJKApp.isInWishlist(p.id);
        const pageUrl = window.location.href;

        let stockHtml = '';
        if (s.stock === 0) stockHtml = '<span class="stock-status out-of-stock"><i class="fa-solid fa-circle-xmark"></i> Out of Stock</span>';
        else if (s.stock <= 5) stockHtml = `<span class="stock-status low-stock"><i class="fa-solid fa-circle-exclamation"></i> Only ${s.stock} left!</span>`;
        else stockHtml = '<span class="stock-status in-stock"><i class="fa-solid fa-circle-check"></i> In Stock</span>';

        const container = document.getElementById('productInfo');
        container.innerHTML = `
            ${cat ? `<span class="product-category">${cat.name}</span>` : ''}
            <h1 class="product-title">${p.name}</h1>
            <div class="product-rating">
                ${HJKUtils.renderStars(p.averageRating, true, p.totalReviews)}
                <a href="#reviews" onclick="HJKProductDetail.switchTab('reviews')">Write a Review</a>
            </div>

            <div class="product-price-section">
                <div class="price-display">
                    <span class="selling-price">${HJKUtils.formatPrice(s.sellingPrice)}</span>
                    ${discount > 0 ? `
                        <span class="normal-price">${HJKUtils.formatPrice(s.normalPrice)}</span>
                        <span class="badge-discount">${discount}% OFF</span>
                    ` : ''}
                </div>
                <p style="font-size:0.8rem;color:var(--text-muted);margin:4px 0 0">Inclusive of all taxes</p>
                ${stockHtml}
            </div>

            <!-- Color Variants -->
            <div class="mb-3">
                <span class="product-option-label">Color: <strong>${v.color}</strong></span>
                <div class="color-swatches mt-2">
                    ${p.variants.map(variant => `
                        <button class="color-swatch ${variant.id === v.id ? 'active' : ''}"
                            style="background:${variant.colorHex}"
                            data-color="${variant.color}"
                            onclick="HJKProductDetail.selectVariant('${variant.id}')">
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Sizes -->
            <div class="mb-3">
                <span class="product-option-label">Size:</span>
                <div class="size-options mt-2">
                    ${v.sizes.map(size => `
                        <button class="size-option ${size.size === s.size ? 'active' : ''} ${size.stock === 0 ? 'out-of-stock' : ''}"
                            onclick="HJKProductDetail.selectSize('${size.size}')"
                            ${size.stock === 0 ? 'disabled' : ''}>
                            ${size.size}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Quantity -->
            <div class="mb-3">
                <span class="product-option-label">Quantity:</span>
                <div class="qty-control mt-2">
                    <button onclick="HJKProductDetail.changeQty(-1)">-</button>
                    <input type="number" value="${this.quantity}" min="1" max="${s.stock}" id="qtyInput"
                        onchange="HJKProductDetail.setQty(this.value)">
                    <button onclick="HJKProductDetail.changeQty(1)">+</button>
                </div>
            </div>

            <!-- Actions -->
            <div class="product-actions">
                <button class="btn-primary-custom" onclick="HJKProductDetail.addToCart()" ${s.stock === 0 ? 'disabled' : ''}>
                    <i class="fa-solid fa-bag-shopping"></i> Add to Cart
                </button>
                <button class="btn-icon ${isWished ? 'active' : ''}" id="wishlistBtn"
                    onclick="HJKProductDetail.toggleWishlist()" style="width:50px;height:50px;font-size:1.2rem">
                    <i class="fa-${isWished ? 'solid' : 'regular'} fa-heart"></i>
                </button>
            </div>

            <!-- Short Description -->
            <div class="product-short-desc">${p.shortDescription}</div>

            <!-- Share -->
            <div class="product-share">
                <span>Share:</span>
                <a href="${HJKUtils.shareUrls.whatsapp(p.name + ' - Check out this bag!', pageUrl)}" target="_blank" class="share-btn whatsapp"><i class="fa-brands fa-whatsapp"></i></a>
                <a href="${HJKUtils.shareUrls.facebook(pageUrl)}" target="_blank" class="share-btn facebook"><i class="fa-brands fa-facebook-f"></i></a>
                <a href="${HJKUtils.shareUrls.twitter(p.name, pageUrl)}" target="_blank" class="share-btn twitter"><i class="fa-brands fa-twitter"></i></a>
                <button class="share-btn copy-link" onclick="navigator.clipboard.writeText('${pageUrl}');HJKComponents.showToast('Link copied!','success')"><i class="fa-solid fa-link"></i></button>
            </div>

            <!-- SKU -->
            <p style="font-size:0.82rem;color:var(--text-light);margin-top:12px">SKU: ${s.sku}</p>
        `;
    },

    selectVariant(variantId) {
        this.selectedVariant = this.product.variants.find(v => v.id === variantId);
        this.selectedSize = this.selectedVariant.sizes[0];
        this.quantity = 1;
        this.renderGallery();
        this.renderProductInfo();
    },

    selectSize(sizeName) {
        this.selectedSize = this.selectedVariant.sizes.find(s => s.size === sizeName);
        this.quantity = 1;
        this.renderProductInfo();
    },

    changeQty(delta) {
        this.quantity = Math.max(1, Math.min(this.selectedSize.stock, this.quantity + delta));
        const input = document.getElementById('qtyInput');
        if (input) input.value = this.quantity;
    },

    setQty(val) {
        this.quantity = Math.max(1, Math.min(this.selectedSize.stock, parseInt(val) || 1));
        const input = document.getElementById('qtyInput');
        if (input) input.value = this.quantity;
    },

    addToCart() {
        HJKApp.addToCart(this.product.id, this.selectedVariant.id, this.selectedSize.size, this.quantity);
    },

    toggleWishlist() {
        const isNow = HJKApp.toggleWishlist(this.product.id, this.selectedVariant.id);
        const btn = document.getElementById('wishlistBtn');
        if (btn) {
            btn.classList.toggle('active', isNow);
            btn.querySelector('i').className = isNow ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        }
    },

    renderTabs() {
        const p = this.product;
        const reviews = (HJKUtils.store.get('hjk_reviews') || []).filter(r => r.productId === p.id && r.status === 'approved');

        const container = document.getElementById('productTabs');
        container.innerHTML = `
            <div class="tabs-custom">
                <button class="tab-btn active" onclick="HJKProductDetail.switchTab('description')">Description</button>
                <button class="tab-btn" onclick="HJKProductDetail.switchTab('info')">Additional Info</button>
                <button class="tab-btn" onclick="HJKProductDetail.switchTab('reviews')">Reviews (${reviews.length})</button>
            </div>

            <div class="tab-content active" id="tab-description">
                <div>${p.fullDescription}</div>
            </div>

            <div class="tab-content" id="tab-info">
                <table class="table">
                    <tr><td class="fw-600" style="width:200px">Category</td><td>${HJKApp.getCategory(p.categoryId)?.name || 'N/A'}</td></tr>
                    <tr><td class="fw-600">Available Colors</td><td>${p.variants.map(v => v.color).join(', ')}</td></tr>
                    <tr><td class="fw-600">Available Sizes</td><td>${[...new Set(p.variants.flatMap(v => v.sizes.map(s => s.size)))].join(', ')}</td></tr>
                    <tr><td class="fw-600">Tags</td><td>${p.tags.map(t => `<span class="chip">${t}</span>`).join(' ')}</td></tr>
                </table>
            </div>

            <div class="tab-content" id="tab-reviews">
                <!-- Rating Summary -->
                <div class="row mb-4">
                    <div class="col-md-4 text-center">
                        <div style="font-size:3rem;font-weight:700;color:var(--text)">${p.averageRating}</div>
                        ${HJKUtils.renderStars(p.averageRating)}
                        <p class="text-muted mt-1">${p.totalReviews} reviews</p>
                    </div>
                    <div class="col-md-8">
                        ${[5,4,3,2,1].map(star => {
                            const count = reviews.filter(r => r.rating === star).length;
                            const pct = reviews.length > 0 ? (count / reviews.length * 100) : 0;
                            return `
                            <div class="d-flex align-items-center gap-2 mb-1">
                                <span style="width:60px;font-size:0.85rem">${star} star</span>
                                <div style="flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden">
                                    <div style="width:${pct}%;height:100%;background:#F59E0B;border-radius:4px"></div>
                                </div>
                                <span style="width:30px;font-size:0.82rem;color:var(--text-muted)">${count}</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>

                <!-- Review List -->
                <div id="reviewsList">
                    ${reviews.length === 0 ? '<p class="text-muted">No reviews yet. Be the first to review!</p>' :
                    reviews.map(r => `
                        <div class="review-card">
                            <div class="review-header">
                                <div class="review-avatar">${r.userName.charAt(0)}</div>
                                <div class="review-meta">
                                    <div class="review-name">${r.userName}</div>
                                    <div class="review-date">${HJKUtils.formatDate(r.createdAt)}</div>
                                </div>
                                <div class="ms-auto">${HJKUtils.renderStars(r.rating)}</div>
                            </div>
                            <div class="review-title">${r.title}</div>
                            <div class="review-text">${r.comment}</div>
                            ${r.adminReply ? `
                                <div class="review-admin-reply">
                                    <div class="reply-label">HJKCollections replied:</div>
                                    <p>${r.adminReply}</p>
                                </div>` : ''}
                        </div>
                    `).join('')}
                </div>

                <!-- Write Review Form -->
                <div class="mt-4 p-4" style="background:var(--bg-alt);border-radius:var(--radius-md)">
                    <h5 class="font-heading mb-3">Write a Review</h5>
                    ${HJKApp.isLoggedIn() ? `
                    <form onsubmit="HJKProductDetail.submitReview(event)">
                        <div class="mb-3">
                            <label class="form-label-custom">Rating</label>
                            <div class="star-rating-input" id="ratingInput">
                                ${[1,2,3,4,5].map(i => `<i class="fa-regular fa-star" data-rating="${i}" style="font-size:1.5rem;cursor:pointer;color:#E5E7EB" onmouseover="HJKProductDetail.hoverStar(${i})" onmouseout="HJKProductDetail.resetStars()" onclick="HJKProductDetail.setStar(${i})"></i>`).join('')}
                            </div>
                            <input type="hidden" id="reviewRating" value="0">
                        </div>
                        <div class="mb-3">
                            <label class="form-label-custom">Review Title</label>
                            <input type="text" class="form-control-custom" id="reviewTitle" required placeholder="Sum it up in a few words">
                        </div>
                        <div class="mb-3">
                            <label class="form-label-custom">Your Review</label>
                            <textarea class="form-control-custom" id="reviewComment" rows="3" required placeholder="Share your experience with this product"></textarea>
                        </div>
                        <button type="submit" class="btn-primary-custom">Submit Review</button>
                    </form>
                    ` : '<p class="text-muted">Please <a href="login.html">login</a> to write a review.</p>'}
                </div>
            </div>
        `;
    },

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach((btn, i) => {
            btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab.substring(0, 4)));
        });
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const el = document.getElementById('tab-' + tab);
        if (el) el.classList.add('active');
    },

    selectedRating: 0,
    hoverStar(n) {
        document.querySelectorAll('#ratingInput i').forEach((star, i) => {
            star.className = i < n ? 'fa-solid fa-star' : 'fa-regular fa-star';
            star.style.color = i < n ? '#F59E0B' : '#E5E7EB';
        });
    },
    resetStars() {
        this.hoverStar(this.selectedRating);
    },
    setStar(n) {
        this.selectedRating = n;
        document.getElementById('reviewRating').value = n;
        this.hoverStar(n);
    },

    submitReview(e) {
        e.preventDefault();
        const rating = parseInt(document.getElementById('reviewRating').value);
        const title = document.getElementById('reviewTitle').value.trim();
        const comment = document.getElementById('reviewComment').value.trim();

        if (!rating) { HJKComponents.showToast('Please select a rating', 'error'); return; }

        const user = HJKApp.getCurrentUser();
        const reviews = HJKUtils.store.get('hjk_reviews') || [];
        reviews.push({
            id: HJKUtils.generateId('rev'),
            productId: this.product.id,
            userId: user.id,
            userName: user.firstName + ' ' + user.lastName.charAt(0) + '.',
            rating, title, comment,
            status: 'pending',
            adminReply: '',
            createdAt: new Date().toISOString()
        });
        HJKUtils.store.set('hjk_reviews', reviews);
        HJKComponents.showToast('Review submitted! It will appear after admin approval.', 'success');
        this.renderTabs();
    },

    renderRelated() {
        const products = (HJKUtils.store.get('hjk_products') || [])
            .filter(p => p.isActive && p.categoryId === this.product.categoryId && p.id !== this.product.id)
            .slice(0, 4);

        const container = document.getElementById('relatedProducts');
        if (!container || products.length === 0) return;

        container.innerHTML = `
            <div class="section-title"><h2>Related Products</h2></div>
            <div class="products-grid">
                ${products.map(p => HJKComponents.renderProductCard(p)).join('')}
            </div>`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => HJKProductDetail.init(), 100);
});
