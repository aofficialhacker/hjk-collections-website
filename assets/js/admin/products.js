/* ============================================
   HJKCollections - Admin Products Management
   ============================================ */

const AdminProducts = {
    currentPage: 1,
    perPage: 10,
    searchQuery: '',
    filterCategory: '',
    variantCount: 0,

    init() {
        if (!AdminComponents.getAdminPageShell('products', 'Products')) return;
        this.render();
    },

    render() {
        const content = document.getElementById('adminContent');
        let products = HJKUtils.store.get('hjk_products') || [];
        const categories = HJKUtils.store.get('hjk_categories') || [];

        if (this.searchQuery) products = products.filter(p => p.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
        if (this.filterCategory) products = products.filter(p => p.categoryId === this.filterCategory);

        const total = products.length;
        const totalPages = Math.ceil(total / this.perPage);
        const start = (this.currentPage - 1) * this.perPage;
        const pageProducts = products.slice(start, start + this.perPage);

        content.innerHTML = `
            <div class="admin-toolbar">
                <div class="toolbar-left">
                    <div class="admin-search">
                        <i class="fa-solid fa-search"></i>
                        <input type="text" placeholder="Search products..." value="${this.searchQuery}" oninput="AdminProducts.searchQuery=this.value;AdminProducts.currentPage=1;AdminProducts.render()">
                    </div>
                    <select class="admin-filter-select" onchange="AdminProducts.filterCategory=this.value;AdminProducts.currentPage=1;AdminProducts.render()">
                        <option value="">All Categories</option>
                        ${categories.map(c => `<option value="${c.id}" ${this.filterCategory === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="toolbar-right">
                    <button class="btn-outline-custom btn-sm" onclick="AdminProducts.exportCSV()"><i class="fa-solid fa-download me-1"></i>Export</button>
                    <a href="form.html" class="btn-primary-custom btn-sm"><i class="fa-solid fa-plus me-1"></i>Add Product</a>
                </div>
            </div>

            <div class="admin-card">
                <div class="admin-card-body" style="padding:0;overflow-x:auto">
                    <table class="admin-table">
                        <thead>
                            <tr><th style="width:50px">#</th><th style="width:60px">Image</th><th>Name</th><th>Category</th><th>Variants</th><th>Price Range</th><th>Stock</th><th>Status</th><th style="width:140px">Actions</th></tr>
                        </thead>
                        <tbody>
                            ${pageProducts.map((p, i) => {
                                const cat = categories.find(c => c.id === p.categoryId);
                                const firstImg = p.variants[0]?.images?.[0] || '';
                                const priceInfo = HJKUtils.getLowestPrice(p);
                                const totalStock = HJKUtils.getTotalStock(p);
                                return `<tr>
                                    <td>${start + i + 1}</td>
                                    <td><img src="${firstImg}" class="table-img" alt="${p.name}"></td>
                                    <td><div style="font-weight:600">${p.name}</div><div style="font-size:0.75rem;color:var(--text-muted)">${p.id}</div></td>
                                    <td>${cat?.name || '-'}</td>
                                    <td>${p.variants.length} colors</td>
                                    <td>${HJKUtils.renderPrice(priceInfo.normalPrice, priceInfo.sellingPrice)}</td>
                                    <td><span class="badge" style="background:${totalStock <= 5 ? 'var(--danger)' : totalStock <= 20 ? 'var(--warning)' : 'var(--success)'};color:#fff;padding:4px 10px;border-radius:20px;font-size:0.75rem">${totalStock}</span></td>
                                    <td>
                                        <label class="toggle-switch">
                                            <input type="checkbox" ${p.isActive ? 'checked' : ''} onchange="AdminProducts.toggleStatus('${p.id}',this.checked)">
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <div class="table-actions">
                                            <a href="form.html?id=${p.id}" class="table-action-btn edit" title="Edit"><i class="fa-solid fa-pen"></i></a>
                                            <button class="table-action-btn view" title="Duplicate" onclick="AdminProducts.duplicate('${p.id}')"><i class="fa-solid fa-copy"></i></button>
                                            <button class="table-action-btn delete" title="Delete" onclick="AdminProducts.delete('${p.id}')"><i class="fa-solid fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>`;
                            }).join('')}
                            ${pageProducts.length === 0 ? '<tr><td colspan="9" class="text-center text-muted py-4">No products found</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
                <div class="admin-card-footer">
                    <span style="font-size:0.85rem;color:var(--text-muted)">Showing ${start + 1}-${Math.min(start + this.perPage, total)} of ${total}</span>
                    ${AdminComponents.renderPagination(this.currentPage, totalPages, 'AdminProducts.goToPage')}
                </div>
            </div>`;
    },

    goToPage(page) { this.currentPage = page; this.render(); },

    toggleStatus(id, isActive) {
        const products = HJKUtils.store.get('hjk_products') || [];
        const p = products.find(x => x.id === id);
        if (p) { p.isActive = isActive; HJKUtils.store.set('hjk_products', products); }
    },

    duplicate(id) {
        const products = HJKUtils.store.get('hjk_products') || [];
        const p = products.find(x => x.id === id);
        if (p) {
            const newP = HJKUtils.clone(p);
            newP.id = HJKUtils.generateId('prod');
            newP.name = p.name + ' (Copy)';
            newP.slug = HJKUtils.slugify(newP.name);
            newP.variants.forEach(v => { v.id = HJKUtils.generateId('var'); });
            newP.createdAt = new Date().toISOString();
            products.push(newP);
            HJKUtils.store.set('hjk_products', products);
            AdminComponents.showToast('Product duplicated', 'success');
            this.render();
        }
    },

    delete(id) {
        AdminComponents.showConfirm('Delete Product', 'Are you sure? This will permanently delete this product.', () => {
            let products = HJKUtils.store.get('hjk_products') || [];
            products = products.filter(p => p.id !== id);
            HJKUtils.store.set('hjk_products', products);
            AdminComponents.showToast('Product deleted', 'success');
            this.render();
        });
    },

    exportCSV() {
        const products = HJKUtils.store.get('hjk_products') || [];
        const categories = HJKUtils.store.get('hjk_categories') || [];
        const rows = [['Name', 'Category', 'Variants', 'Total Stock', 'Min Price', 'Status']];
        products.forEach(p => {
            const cat = categories.find(c => c.id === p.categoryId);
            const price = HJKUtils.getLowestPrice(p);
            rows.push([p.name, cat?.name || '', p.variants.length, HJKUtils.getTotalStock(p), price.selling || price.normal, p.isActive ? 'Active' : 'Inactive']);
        });
        HJKUtils.exportCSV(rows, 'products-export.csv');
    },

    // Product Form
    initForm() {
        if (!AdminComponents.getAdminPageShell('products', 'Product Form')) return;
        const id = HJKUtils.getUrlParam('id');
        const products = HJKUtils.store.get('hjk_products') || [];
        const product = id ? products.find(p => p.id === id) : null;
        const categories = HJKUtils.store.get('hjk_categories') || [];
        const content = document.getElementById('adminContent');

        this.variantCount = product ? product.variants.length : 1;

        content.innerHTML = `
            <div class="admin-card">
                <div class="admin-card-header">
                    <h5>${product ? 'Edit' : 'Add'} Product</h5>
                    <a href="index.html" class="btn-outline-custom btn-sm"><i class="fa-solid fa-arrow-left me-1"></i>Back</a>
                </div>
                <div class="admin-card-body">
                    <form class="admin-form" onsubmit="AdminProducts.saveForm(event, '${id || ''}')">
                        <div class="row g-4">
                            <div class="col-md-8">
                                <div class="form-group">
                                    <label>Product Name *</label>
                                    <input type="text" id="prodName" required value="${product?.name || ''}" placeholder="Enter product name">
                                </div>
                                <div class="form-group">
                                    <label>Short Description *</label>
                                    <textarea id="prodShortDesc" rows="2" required placeholder="Brief description">${product?.shortDescription || ''}</textarea>
                                </div>
                                <div class="form-group">
                                    <label>Full Description</label>
                                    <textarea id="prodDesc" rows="5" placeholder="Detailed product description">${product?.description || ''}</textarea>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label>Category *</label>
                                    <select id="prodCategory" required>
                                        <option value="">Select category</option>
                                        ${categories.map(c => `<option value="${c.id}" ${product?.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Material</label>
                                    <input type="text" id="prodMaterial" value="${product?.material || ''}" placeholder="e.g., Leather, Canvas">
                                </div>
                                <div class="form-group">
                                    <label>Dimensions</label>
                                    <input type="text" id="prodDimensions" value="${product?.dimensions || ''}" placeholder="e.g., 40 x 30 x 15 cm">
                                </div>
                                <div class="form-group">
                                    <label>Weight</label>
                                    <input type="text" id="prodWeight" value="${product?.weight || ''}" placeholder="e.g., 1.2 kg">
                                </div>
                                <div class="form-group d-flex gap-3">
                                    <label class="d-flex align-items-center gap-2"><input type="checkbox" id="prodActive" ${product ? (product.isActive ? 'checked' : '') : 'checked'}> Active</label>
                                    <label class="d-flex align-items-center gap-2"><input type="checkbox" id="prodFeatured" ${product?.isFeatured ? 'checked' : ''}> Featured</label>
                                </div>
                            </div>
                        </div>

                        <div class="divider"></div>

                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="font-heading mb-0">Variants</h5>
                            <button type="button" class="btn-outline-custom btn-sm" onclick="AdminProducts.addVariant()"><i class="fa-solid fa-plus me-1"></i>Add Variant</button>
                        </div>

                        <div id="variantsContainer">
                            ${(product ? product.variants : [{ id: '', color: '', colorCode: '#000000', images: [], sizes: [{ size: '', normalPrice: '', sellingPrice: '', stock: '', sku: '' }] }]).map((v, vi) => this.renderVariantBlock(v, vi)).join('')}
                        </div>

                        <div class="mt-4">
                            <button type="submit" class="btn-primary-custom"><i class="fa-solid fa-save me-1"></i>${product ? 'Update' : 'Create'} Product</button>
                        </div>
                    </form>
                </div>
            </div>`;
    },

    renderVariantBlock(variant, index) {
        return `
            <div class="variant-block" id="variant-${index}">
                <div class="variant-block-header">
                    <h6><i class="fa-solid fa-palette me-2"></i>Variant ${index + 1}</h6>
                    ${index > 0 ? `<button type="button" class="table-action-btn delete" onclick="AdminProducts.removeVariant(${index})"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
                <div class="row g-3 mb-3">
                    <div class="col-md-4">
                        <label>Color Name *</label>
                        <input type="text" class="var-color" value="${variant.color || ''}" required placeholder="e.g., Black">
                    </div>
                    <div class="col-md-2">
                        <label>Color Code</label>
                        <input type="color" class="var-colorCode" value="${variant.colorCode || '#000000'}" style="width:100%;height:40px;padding:4px;border:1px solid var(--border);border-radius:var(--radius-sm)">
                    </div>
                    <div class="col-md-6">
                        <label>Image URLs (comma separated) *</label>
                        <input type="text" class="var-images" value="${(variant.images || []).join(', ')}" required placeholder="https://img1.jpg, https://img2.jpg">
                    </div>
                </div>
                <div class="mb-2 d-flex justify-content-between align-items-center">
                    <label style="font-weight:600;font-size:0.85rem">Sizes & Pricing</label>
                    <button type="button" class="btn-outline-custom btn-sm" style="font-size:0.75rem;padding:4px 10px" onclick="AdminProducts.addSizeRow(${index})"><i class="fa-solid fa-plus"></i> Size</button>
                </div>
                <div class="size-rows" id="sizeRows-${index}">
                    <div class="size-row" style="margin-bottom:4px">
                        <div><label>Size</label></div><div><label>Normal Price</label></div><div><label>Selling Price</label></div><div><label>Stock</label></div><div><label>SKU</label></div><div></div>
                    </div>
                    ${(variant.sizes || [{ size: '', normalPrice: '', sellingPrice: '', stock: '', sku: '' }]).map(s => `
                        <div class="size-row">
                            <div><input type="text" class="sz-size" value="${s.size || ''}" placeholder="e.g., M" required></div>
                            <div><input type="number" class="sz-normal" value="${s.normalPrice || ''}" placeholder="₹" required></div>
                            <div><input type="number" class="sz-selling" value="${s.sellingPrice || ''}" placeholder="₹" required></div>
                            <div><input type="number" class="sz-stock" value="${s.stock || ''}" placeholder="Qty" required></div>
                            <div><input type="text" class="sz-sku" value="${s.sku || ''}" placeholder="SKU"></div>
                            <div><button type="button" class="table-action-btn delete" onclick="this.closest('.size-row').remove()"><i class="fa-solid fa-xmark"></i></button></div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    },

    addVariant() {
        const container = document.getElementById('variantsContainer');
        const div = document.createElement('div');
        div.innerHTML = this.renderVariantBlock({ color: '', colorCode: '#000000', images: [], sizes: [{ size: '', normalPrice: '', sellingPrice: '', stock: '', sku: '' }] }, this.variantCount);
        container.appendChild(div.firstElementChild);
        this.variantCount++;
    },

    removeVariant(index) {
        const el = document.getElementById('variant-' + index);
        if (el) el.remove();
    },

    addSizeRow(variantIndex) {
        const container = document.getElementById('sizeRows-' + variantIndex);
        const div = document.createElement('div');
        div.className = 'size-row';
        div.innerHTML = `
            <div><input type="text" class="sz-size" placeholder="e.g., M" required></div>
            <div><input type="number" class="sz-normal" placeholder="₹" required></div>
            <div><input type="number" class="sz-selling" placeholder="₹" required></div>
            <div><input type="number" class="sz-stock" placeholder="Qty" required></div>
            <div><input type="text" class="sz-sku" placeholder="SKU"></div>
            <div><button type="button" class="table-action-btn delete" onclick="this.closest('.size-row').remove()"><i class="fa-solid fa-xmark"></i></button></div>`;
        container.appendChild(div);
    },

    saveForm(e, id) {
        e.preventDefault();
        const name = document.getElementById('prodName').value.trim();
        const shortDescription = document.getElementById('prodShortDesc').value.trim();
        const description = document.getElementById('prodDesc').value.trim();
        const categoryId = document.getElementById('prodCategory').value;
        const material = document.getElementById('prodMaterial').value.trim();
        const dimensions = document.getElementById('prodDimensions').value.trim();
        const weight = document.getElementById('prodWeight').value.trim();
        const isActive = document.getElementById('prodActive').checked;
        const isFeatured = document.getElementById('prodFeatured').checked;

        if (!name || !categoryId) { AdminComponents.showToast('Please fill required fields', 'error'); return; }

        // Collect variants
        const variantBlocks = document.querySelectorAll('.variant-block');
        const variants = [];
        let valid = true;

        variantBlocks.forEach(block => {
            const color = block.querySelector('.var-color').value.trim();
            const colorCode = block.querySelector('.var-colorCode').value;
            const imagesStr = block.querySelector('.var-images').value.trim();
            const images = imagesStr.split(',').map(s => s.trim()).filter(Boolean);

            if (!color || images.length === 0) { valid = false; return; }

            const sizeRows = block.querySelectorAll('.size-row:not(:first-child)');
            const sizes = [];
            sizeRows.forEach(row => {
                const size = row.querySelector('.sz-size')?.value.trim();
                const normalPrice = parseFloat(row.querySelector('.sz-normal')?.value) || 0;
                const sellingPrice = parseFloat(row.querySelector('.sz-selling')?.value) || 0;
                const stock = parseInt(row.querySelector('.sz-stock')?.value) || 0;
                const sku = row.querySelector('.sz-sku')?.value.trim() || '';
                if (size) sizes.push({ size, normalPrice, sellingPrice, stock, sku });
            });

            if (sizes.length === 0) { valid = false; return; }

            variants.push({ id: HJKUtils.generateId('var'), color, colorCode, images, sizes });
        });

        if (!valid || variants.length === 0) {
            AdminComponents.showToast('Please fill all variant and size fields', 'error');
            return;
        }

        const products = HJKUtils.store.get('hjk_products') || [];
        const slug = HJKUtils.slugify(name);

        if (id) {
            const p = products.find(x => x.id === id);
            if (p) Object.assign(p, { name, slug, shortDescription, description, categoryId, material, dimensions, weight, isActive, isFeatured, variants, updatedAt: new Date().toISOString() });
        } else {
            products.push({ id: HJKUtils.generateId('prod'), name, slug, shortDescription, description, categoryId, material, dimensions, weight, isActive, isFeatured, variants, avgRating: 0, reviewCount: 0, createdAt: new Date().toISOString() });
        }

        HJKUtils.store.set('hjk_products', products);
        AdminComponents.showToast(`Product ${id ? 'updated' : 'created'}!`, 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 500);
    }
};
