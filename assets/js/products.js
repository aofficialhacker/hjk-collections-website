/* ============================================
   HJKCollections - Product Listing Page Logic
   ============================================ */

const HJKProducts = {
    state: {
        allProducts: [],
        filteredProducts: [],
        categories: [],
        currentPage: 1,
        perPage: 12,
        viewMode: 'grid',
        filters: {
            category: [],
            search: '',
            sort: 'newest',
            minPrice: '',
            maxPrice: '',
            colors: [],
            rating: 0
        }
    },

    initProductsPage() {
        this.state.allProducts = (HJKUtils.store.get('hjk_products') || []).filter(p => p.isActive);
        this.state.categories = (HJKUtils.store.get('hjk_categories') || []).filter(c => c.isActive);

        this.readUrlParams();
        this.renderFilterSidebar();
        this.applyFilters();
        this.bindEvents();
    },

    // ---- URL Params ----
    readUrlParams() {
        const category = HJKUtils.getUrlParam('category');
        const search = HJKUtils.getUrlParam('search');
        const sort = HJKUtils.getUrlParam('sort');
        const minPrice = HJKUtils.getUrlParam('minPrice');
        const maxPrice = HJKUtils.getUrlParam('maxPrice');
        const page = HJKUtils.getUrlParam('page');

        if (category) this.state.filters.category = category.split(',');
        if (search) this.state.filters.search = search;
        if (sort) this.state.filters.sort = sort;
        if (minPrice) this.state.filters.minPrice = minPrice;
        if (maxPrice) this.state.filters.maxPrice = maxPrice;
        if (page) this.state.currentPage = parseInt(page) || 1;
    },

    updateUrlParams() {
        const f = this.state.filters;
        HJKUtils.setUrlParams({
            category: f.category.length > 0 ? f.category.join(',') : null,
            search: f.search || null,
            sort: f.sort !== 'newest' ? f.sort : null,
            minPrice: f.minPrice || null,
            maxPrice: f.maxPrice || null,
            page: this.state.currentPage > 1 ? this.state.currentPage : null
        });
    },

    // ---- Filter Sidebar Rendering ----
    renderFilterSidebar() {
        const sidebar = document.getElementById('filterSidebar');
        if (!sidebar) return;

        // Collect all unique colors from products
        const colorMap = {};
        this.state.allProducts.forEach(p => {
            p.variants.forEach(v => {
                if (!colorMap[v.colorHex]) {
                    colorMap[v.colorHex] = v.color;
                }
            });
        });

        // Count products per category
        const categoryCounts = {};
        this.state.allProducts.forEach(p => {
            categoryCounts[p.categoryId] = (categoryCounts[p.categoryId] || 0) + 1;
        });

        sidebar.innerHTML = `
            <!-- Search within results -->
            <div class="filter-section">
                <h5><i class="fa-solid fa-magnifying-glass me-2"></i>Search</h5>
                <input type="text" class="form-control-custom" id="filterSearch"
                    placeholder="Search products..." value="${this.state.filters.search}">
            </div>

            <!-- Categories -->
            <div class="filter-section">
                <h5><i class="fa-solid fa-tags me-2"></i>Categories</h5>
                <div class="filter-options">
                    ${this.state.categories.map(cat => `
                        <label class="filter-option">
                            <input type="checkbox" name="category" value="${cat.slug}"
                                ${this.state.filters.category.includes(cat.slug) ? 'checked' : ''}>
                            <span>${cat.name}</span>
                            <span class="count">(${categoryCounts[cat.id] || 0})</span>
                        </label>
                    `).join('')}
                </div>
            </div>

            <!-- Price Range -->
            <div class="filter-section">
                <h5><i class="fa-solid fa-indian-rupee-sign me-2"></i>Price Range</h5>
                <div class="price-range-inputs">
                    <input type="number" id="filterMinPrice" placeholder="Min"
                        value="${this.state.filters.minPrice}" min="0">
                    <span>to</span>
                    <input type="number" id="filterMaxPrice" placeholder="Max"
                        value="${this.state.filters.maxPrice}" min="0">
                </div>
                <button class="btn-outline-custom btn-sm w-100 mt-2 justify-content-center"
                    onclick="HJKProducts.applyPriceFilter()">
                    Apply Price
                </button>
            </div>

            <!-- Colors -->
            <div class="filter-section">
                <h5><i class="fa-solid fa-palette me-2"></i>Colors</h5>
                <div class="filter-color-options">
                    ${Object.entries(colorMap).map(([hex, name]) => `
                        <button class="filter-color ${this.state.filters.colors.includes(hex) ? 'active' : ''}"
                            style="background:${hex}"
                            title="${name}"
                            data-color="${hex}"
                            onclick="HJKProducts.toggleColorFilter('${hex}')">
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Rating -->
            <div class="filter-section">
                <h5><i class="fa-solid fa-star me-2"></i>Rating</h5>
                <div class="filter-options">
                    <label class="filter-option">
                        <input type="radio" name="rating" value="0"
                            ${this.state.filters.rating === 0 ? 'checked' : ''}>
                        <span>All Ratings</span>
                    </label>
                    <label class="filter-option">
                        <input type="radio" name="rating" value="4"
                            ${this.state.filters.rating === 4 ? 'checked' : ''}>
                        <span>4 Stars & Above</span>
                        <span class="ms-1">${HJKUtils.renderStars(4)}</span>
                    </label>
                    <label class="filter-option">
                        <input type="radio" name="rating" value="3"
                            ${this.state.filters.rating === 3 ? 'checked' : ''}>
                        <span>3 Stars & Above</span>
                        <span class="ms-1">${HJKUtils.renderStars(3)}</span>
                    </label>
                </div>
            </div>

            <!-- Clear Filters -->
            <button class="btn-outline-custom w-100 justify-content-center" onclick="HJKProducts.clearAllFilters()">
                <i class="fa-solid fa-filter-circle-xmark"></i> Clear All Filters
            </button>
        `;

        // Pre-fill search input from URL
        const searchInput = document.getElementById('filterSearch');
        if (searchInput && this.state.filters.search) {
            searchInput.value = this.state.filters.search;
        }
    },

    // ---- Event Bindings ----
    bindEvents() {
        // Search input
        const searchInput = document.getElementById('filterSearch');
        if (searchInput) {
            searchInput.addEventListener('input', HJKUtils.debounce((e) => {
                this.state.filters.search = e.target.value.trim();
                this.state.currentPage = 1;
                this.applyFilters();
            }, 300));
        }

        // Category checkboxes
        document.querySelectorAll('input[name="category"]').forEach(cb => {
            cb.addEventListener('change', () => {
                this.state.filters.category = Array.from(
                    document.querySelectorAll('input[name="category"]:checked')
                ).map(el => el.value);
                this.state.currentPage = 1;
                this.applyFilters();
            });
        });

        // Rating radios
        document.querySelectorAll('input[name="rating"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.state.filters.rating = parseInt(e.target.value) || 0;
                this.state.currentPage = 1;
                this.applyFilters();
            });
        });

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.value = this.state.filters.sort;
            sortSelect.addEventListener('change', (e) => {
                this.state.filters.sort = e.target.value;
                this.state.currentPage = 1;
                this.applyFilters();
            });
        }

        // View mode toggles
        document.querySelectorAll('.view-toggle button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.viewMode = btn.dataset.view;
                document.querySelectorAll('.view-toggle button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateGridView();
            });
        });

        // Mobile filter toggle
        const filterToggle = document.getElementById('filterToggleBtn');
        if (filterToggle) {
            filterToggle.addEventListener('click', () => {
                const sidebar = document.getElementById('filterSidebar');
                if (sidebar) sidebar.classList.toggle('show-mobile');
            });
        }
    },

    // ---- Filter Logic ----
    applyPriceFilter() {
        this.state.filters.minPrice = document.getElementById('filterMinPrice')?.value || '';
        this.state.filters.maxPrice = document.getElementById('filterMaxPrice')?.value || '';
        this.state.currentPage = 1;
        this.applyFilters();
    },

    toggleColorFilter(hex) {
        const idx = this.state.filters.colors.indexOf(hex);
        if (idx > -1) {
            this.state.filters.colors.splice(idx, 1);
        } else {
            this.state.filters.colors.push(hex);
        }
        // Update active state on UI
        document.querySelectorAll('.filter-color').forEach(el => {
            el.classList.toggle('active', this.state.filters.colors.includes(el.dataset.color));
        });
        this.state.currentPage = 1;
        this.applyFilters();
    },

    clearAllFilters() {
        this.state.filters = {
            category: [],
            search: '',
            sort: 'newest',
            minPrice: '',
            maxPrice: '',
            colors: [],
            rating: 0
        };
        this.state.currentPage = 1;
        this.renderFilterSidebar();
        this.applyFilters();
        this.bindEvents();
    },

    applyFilters() {
        const f = this.state.filters;
        let products = [...this.state.allProducts];

        // Filter by search
        if (f.search) {
            const q = f.search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.shortDescription.toLowerCase().includes(q) ||
                (p.fullDescription && p.fullDescription.toLowerCase().includes(q)) ||
                p.tags.some(t => t.toLowerCase().includes(q))
            );
        }

        // Filter by category
        if (f.category.length > 0) {
            const categoryIds = this.state.categories
                .filter(c => f.category.includes(c.slug))
                .map(c => c.id);
            products = products.filter(p => categoryIds.includes(p.categoryId));
        }

        // Filter by price range
        if (f.minPrice || f.maxPrice) {
            const min = parseFloat(f.minPrice) || 0;
            const max = parseFloat(f.maxPrice) || Infinity;
            products = products.filter(p => {
                const price = HJKUtils.getLowestPrice(p);
                return price.sellingPrice >= min && price.sellingPrice <= max;
            });
        }

        // Filter by color
        if (f.colors.length > 0) {
            products = products.filter(p =>
                p.variants.some(v => f.colors.includes(v.colorHex))
            );
        }

        // Filter by rating
        if (f.rating > 0) {
            products = products.filter(p => p.averageRating >= f.rating);
        }

        // Sort
        switch (f.sort) {
            case 'price_asc':
                products.sort((a, b) => HJKUtils.getLowestPrice(a).sellingPrice - HJKUtils.getLowestPrice(b).sellingPrice);
                break;
            case 'price_desc':
                products.sort((a, b) => HJKUtils.getLowestPrice(b).sellingPrice - HJKUtils.getLowestPrice(a).sellingPrice);
                break;
            case 'newest':
                products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'popularity':
                products.sort((a, b) => b.totalSold - a.totalSold);
                break;
            case 'rating':
                products.sort((a, b) => b.averageRating - a.averageRating);
                break;
        }

        this.state.filteredProducts = products;
        this.updateUrlParams();
        this.renderProducts();
        this.renderPagination();
        this.updateResultCount();
    },

    // ---- Rendering ----
    renderProducts() {
        const container = document.getElementById('productsGrid');
        if (!container) return;

        const start = (this.state.currentPage - 1) * this.state.perPage;
        const end = start + this.state.perPage;
        const pageProducts = this.state.filteredProducts.slice(start, end);

        if (pageProducts.length === 0) {
            container.innerHTML = HJKComponents.renderEmptyState(
                'fa-bag-shopping',
                'No Products Found',
                'Try adjusting your filters or search query to find what you are looking for.',
                'Clear Filters',
                '#'
            );
            // Override button to clear filters
            const emptyBtn = container.querySelector('.btn-primary-custom');
            if (emptyBtn) {
                emptyBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.clearAllFilters();
                });
            }
            return;
        }

        container.innerHTML = pageProducts.map(p => HJKComponents.renderProductCard(p)).join('');
        this.updateGridView();
    },

    updateGridView() {
        const container = document.getElementById('productsGrid');
        if (!container) return;
        if (this.state.viewMode === 'list') {
            container.classList.add('list-view');
        } else {
            container.classList.remove('list-view');
        }
    },

    renderPagination() {
        const container = document.getElementById('productsPagination');
        if (!container) return;

        const totalPages = Math.ceil(this.state.filteredProducts.length / this.state.perPage);
        container.innerHTML = HJKComponents.renderPagination(
            this.state.currentPage,
            totalPages,
            'HJKProducts.goToPage'
        );
    },

    updateResultCount() {
        const el = document.getElementById('resultCount');
        if (!el) return;

        const total = this.state.filteredProducts.length;
        if (total === 0) {
            el.textContent = 'No products found';
            return;
        }

        const start = (this.state.currentPage - 1) * this.state.perPage + 1;
        const end = Math.min(this.state.currentPage * this.state.perPage, total);
        el.textContent = `Showing ${start}-${end} of ${total} products`;
    },

    goToPage(page) {
        this.state.currentPage = page;
        this.updateUrlParams();
        this.renderProducts();
        this.renderPagination();
        this.updateResultCount();
        HJKUtils.scrollToTop();
    },

    // ---- Page Title / Breadcrumb update ----
    updatePageTitle() {
        const breadcrumbContainer = document.getElementById('breadcrumbContainer');
        if (!breadcrumbContainer) return;

        const crumbs = [];
        if (this.state.filters.category.length === 1) {
            const cat = this.state.categories.find(c => c.slug === this.state.filters.category[0]);
            if (cat) {
                crumbs.push({ label: cat.name });
            } else {
                crumbs.push({ label: 'Shop' });
            }
        } else if (this.state.filters.search) {
            crumbs.push({ label: `Search: "${this.state.filters.search}"` });
        } else {
            crumbs.push({ label: 'Shop' });
        }

        breadcrumbContainer.innerHTML = HJKComponents.renderBreadcrumbs(crumbs);
    }
};

// Page initialization
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (document.getElementById('productsGrid')) {
            HJKProducts.initProductsPage();
        }
    }, 100);
});
