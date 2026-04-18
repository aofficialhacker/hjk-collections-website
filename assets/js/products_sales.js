/* ============================================
   HJKCollections - Product Listing Page Logic
   (ONLY SALES CATEGORY VERSION)
   ============================================ */

const HJKProducts = {
    state: {
        products: [],
        categories: [],
        currentPage: 1,
        perPage: 12,
        totalProducts: 0,
        totalPages: 0,
        viewMode: 'grid',
        filters: {
            category: ['sales'], // ✅ fixed
            search: '',
            sort: 'newest',
            minPrice: '',
            maxPrice: '',
            colors: [],
            rating: 0
        }
    },

    async initProductsPage() {
        this.state.categories = HJKApp.getCategories() || [];
        this.renderFilterSidebar();
        this.bindEvents();
        await this.fetchProducts();
    },

    readUrlParams() {
        const search = HJKUtils.getUrlParam('search');
        const sort = HJKUtils.getUrlParam('sort');
        const minPrice = HJKUtils.getUrlParam('minPrice');
        const maxPrice = HJKUtils.getUrlParam('maxPrice');
        const page = HJKUtils.getUrlParam('page');

        if (search) this.state.filters.search = search;
        if (sort) this.state.filters.sort = sort;
        if (minPrice) this.state.filters.minPrice = minPrice;
        if (maxPrice) this.state.filters.maxPrice = maxPrice;
        if (page) this.state.currentPage = parseInt(page) || 1;
    },

    updateUrlParams() {
        const f = this.state.filters;
        HJKUtils.setUrlParams({
            category: 'sales', // ✅ always sales
            search: f.search || null,
            sort: f.sort !== 'newest' ? f.sort : null,
            minPrice: f.minPrice || null,
            maxPrice: f.maxPrice || null,
            page: this.state.currentPage > 1 ? this.state.currentPage : null
        });
    },

    async fetchProducts() {
        const f = this.state.filters;

        const params = {
            page: this.state.currentPage,
            per_page: this.state.perPage,
            category: 'sales' // ✅ FORCE SALES
        };

        if (f.search) params.search = f.search;
        if (f.minPrice) params.min_price = f.minPrice;
        if (f.maxPrice) params.max_price = f.maxPrice;
        if (f.rating > 0) params.rating = f.rating;

        const sortMap = {
            'newest': 'newest',
            'price_asc': 'price_low',
            'price_desc': 'price_high',
            'popularity': 'popular',
            'rating': 'rating',
        };
        params.sort = sortMap[f.sort] || 'newest';

        const container = document.getElementById('productsGrid');
        if (container) {
            container.innerHTML = '<div class="text-center py-5"><div class="spinner"></div></div>';
        }

        try {
            const res = await HJKAPI.products.list(params);
            if (res.success) {
                this.state.products = res.data;
                this.state.totalProducts = res.pagination.total;
                this.state.totalPages = res.pagination.totalPages;
                this.state.currentPage = res.pagination.page;
            }
        } catch (err) {
            this.state.products = [];
            this.state.totalProducts = 0;
        }

        this.updateUrlParams();
        this.renderProducts();
        this.renderPagination();
        this.updateResultCount();
        this.updatePageTitle();
    },

    renderFilterSidebar() {
        const sidebar = document.getElementById('filterSidebar');
        if (!sidebar) return;

        sidebar.innerHTML = `
            <div class="filter-section">
                <h5><i class="fa-solid fa-magnifying-glass me-2"></i>Search</h5>
                <input type="text" class="form-control-custom" id="filterSearch"
                    placeholder="Search products..." value="${this.state.filters.search}">
            </div>

            <div class="filter-section">
                <h5><i class="fa-solid fa-indian-rupee-sign me-2"></i>Price Range</h5>
                <div class="price-range-inputs">
                    <input type="number" id="filterMinPrice" placeholder="Min"
                        value="${this.state.filters.minPrice}" min="0">
                    <span>to</span>
                    <input type="number" id="filterMaxPrice" placeholder="Max"
                        value="${this.state.filters.maxPrice}" min="0">
                </div>
                <button class="btn-outline-custom btn-sm w-100 mt-2"
                    onclick="HJKProducts.applyPriceFilter()">
                    Apply Price
                </button>
            </div>

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
                    </label>
                    <label class="filter-option">
                        <input type="radio" name="rating" value="3"
                            ${this.state.filters.rating === 3 ? 'checked' : ''}>
                        <span>3 Stars & Above</span>
                    </label>
                </div>
            </div>

            <button class="btn-outline-custom w-100"
                onclick="HJKProducts.clearAllFilters()">
                <i class="fa-solid fa-filter-circle-xmark"></i> Clear Filters
            </button>
        `;
    },

    bindEvents() {
        const searchInput = document.getElementById('filterSearch');
        if (searchInput) {
            searchInput.addEventListener('input', HJKUtils.debounce((e) => {
                this.state.filters.search = e.target.value.trim();
                this.state.currentPage = 1;
                this.fetchProducts();
            }, 300));
        }

        document.querySelectorAll('input[name="rating"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.state.filters.rating = parseInt(e.target.value) || 0;
                this.state.currentPage = 1;
                this.fetchProducts();
            });
        });

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.value = this.state.filters.sort;
            sortSelect.addEventListener('change', (e) => {
                this.state.filters.sort = e.target.value;
                this.state.currentPage = 1;
                this.fetchProducts();
            });
        }

        document.querySelectorAll('.view-toggle button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.viewMode = btn.dataset.view;
                document.querySelectorAll('.view-toggle button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateGridView();
            });
        });
    },

    applyPriceFilter() {
        this.state.filters.minPrice = document.getElementById('filterMinPrice')?.value || '';
        this.state.filters.maxPrice = document.getElementById('filterMaxPrice')?.value || '';
        this.state.currentPage = 1;
        this.fetchProducts();
    },

    clearAllFilters() {
        this.state.filters = {
            category: ['sales'], // ✅ keep sales
            search: '',
            sort: 'newest',
            minPrice: '',
            maxPrice: '',
            colors: [],
            rating: 0
        };
        this.state.currentPage = 1;
        this.renderFilterSidebar();
        this.bindEvents();
        this.fetchProducts();
    },

    renderProducts() {
        const container = document.getElementById('productsGrid');
        if (!container) return;

        if (this.state.products.length === 0) {
            container.innerHTML = `<div class="text-center py-5">No Products Found</div>`;
            return;
        }

        container.innerHTML = this.state.products.map(p =>
            HJKComponents.renderProductCard(p)
        ).join('');

        this.updateGridView();
    },

    updateGridView() {
        const container = document.getElementById('productsGrid');
        if (!container) return;
        container.classList.toggle('list-view', this.state.viewMode === 'list');
    },

    renderPagination() {
        const container = document.getElementById('productsPagination');
        if (!container) return;

        container.innerHTML = HJKComponents.renderPagination(
            this.state.currentPage,
            this.state.totalPages,
            'HJKProducts.goToPage'
        );
    },

    updateResultCount() {
        const el = document.getElementById('resultCount');
        if (!el) return;

        const total = this.state.totalProducts;

        if (total === 0) {
            el.textContent = 'No products found';
            return;
        }

        const start = (this.state.currentPage - 1) * this.state.perPage + 1;
        const end = Math.min(start + this.state.products.length - 1, total);

        el.textContent = `Showing ${start}-${end} of ${total} products`;
    },

    goToPage(page) {
        this.state.currentPage = page;
        this.fetchProducts();
        HJKUtils.scrollToTop();
    },

    updatePageTitle() {
        const breadcrumbContainer = document.getElementById('breadcrumbContainer');
        if (!breadcrumbContainer) return;

        breadcrumbContainer.innerHTML =
            HJKComponents.renderBreadcrumbs([{ label: 'Sale' }]);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productsGrid')) {
        const checkReady = setInterval(() => {
            if (HJKApp._ready) {
                clearInterval(checkReady);
                HJKProducts.initProductsPage();
            }
        }, 50);
    }
});