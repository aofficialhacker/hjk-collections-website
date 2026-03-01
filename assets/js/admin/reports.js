/* ============================================
   HJKCollections - Admin Reports
   ============================================ */

const AdminReports = {
    reportType: 'sales',
    dateFrom: '',
    dateTo: '',

    init() {
        if (!AdminComponents.getAdminPageShell('reports', 'Reports')) return;
        this.render();
    },

    render() {
        const content = document.getElementById('adminContent');

        content.innerHTML = `
            <div class="admin-toolbar">
                <div class="toolbar-left">
                    <select class="admin-filter-select" onchange="AdminReports.reportType=this.value;AdminReports.generateReport()">
                        <option value="sales" ${this.reportType === 'sales' ? 'selected' : ''}>Sales Report</option>
                        <option value="products" ${this.reportType === 'products' ? 'selected' : ''}>Product Report</option>
                        <option value="customers" ${this.reportType === 'customers' ? 'selected' : ''}>Customer Report</option>
                    </select>
                    <input type="date" class="admin-filter-select" id="dateFrom" value="${this.dateFrom}" onchange="AdminReports.dateFrom=this.value">
                    <input type="date" class="admin-filter-select" id="dateTo" value="${this.dateTo}" onchange="AdminReports.dateTo=this.value">
                    <button class="btn-primary-custom btn-sm" onclick="AdminReports.generateReport()"><i class="fa-solid fa-chart-bar me-1"></i>Generate</button>
                </div>
                <div class="toolbar-right">
                    <button class="btn-outline-custom btn-sm" onclick="AdminReports.exportReport()"><i class="fa-solid fa-download me-1"></i>Export CSV</button>
                </div>
            </div>

            <div id="reportContent"></div>`;

        this.generateReport();
    },

    generateReport() {
        const reportDiv = document.getElementById('reportContent');
        const orders = HJKUtils.store.get('hjk_orders') || [];
        const products = HJKUtils.store.get('hjk_products') || [];
        const users = (HJKUtils.store.get('hjk_users') || []).filter(u => u.role === 'customer');

        let filteredOrders = orders;
        if (this.dateFrom) filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) >= new Date(this.dateFrom));
        if (this.dateTo) filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) <= new Date(this.dateTo + 'T23:59:59'));

        if (this.reportType === 'sales') {
            const totalRevenue = filteredOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0);
            const totalOrders = filteredOrders.length;
            const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
            const cancelledOrders = filteredOrders.filter(o => o.orderStatus === 'cancelled').length;

            reportDiv.innerHTML = `
                <div class="stats-grid mb-4">
                    <div class="stat-card"><div class="stat-icon blue"><i class="fa-solid fa-indian-rupee-sign"></i></div><div class="stat-info"><h3>${HJKUtils.formatPrice(totalRevenue)}</h3><p>Total Revenue</p></div></div>
                    <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-shopping-cart"></i></div><div class="stat-info"><h3>${totalOrders}</h3><p>Total Orders</p></div></div>
                    <div class="stat-card"><div class="stat-icon purple"><i class="fa-solid fa-chart-line"></i></div><div class="stat-info"><h3>${HJKUtils.formatPrice(avgOrder)}</h3><p>Avg Order Value</p></div></div>
                    <div class="stat-card"><div class="stat-icon red"><i class="fa-solid fa-xmark"></i></div><div class="stat-info"><h3>${cancelledOrders}</h3><p>Cancelled</p></div></div>
                </div>

                <div class="admin-card">
                    <div class="admin-card-header"><h5>Orders Summary</h5></div>
                    <div class="admin-card-body" style="padding:0;overflow-x:auto">
                        <table class="admin-table" id="reportTable">
                            <thead><tr><th>Order #</th><th>Date</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Payment</th></tr></thead>
                            <tbody>
                                ${filteredOrders.map(o => {
                                    const c = users.find(u => u.id === o.userId);
                                    return `<tr><td>${o.orderNumber}</td><td>${HJKUtils.formatDate(o.createdAt)}</td><td>${c ? c.firstName + ' ' + c.lastName : '-'}</td><td>${o.items.length}</td><td>${HJKUtils.formatPrice(o.totalAmount)}</td><td>${HJKUtils.getStatusBadge(o.orderStatus)}</td><td>${HJKUtils.getStatusBadge(o.paymentStatus)}</td></tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>`;
        } else if (this.reportType === 'products') {
            // Product performance
            const productStats = {};
            filteredOrders.forEach(o => {
                o.items.forEach(item => {
                    if (!productStats[item.productId]) productStats[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
                    productStats[item.productId].qty += item.quantity;
                    productStats[item.productId].revenue += item.totalPrice;
                });
            });
            const sorted = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);

            reportDiv.innerHTML = `
                <div class="admin-card">
                    <div class="admin-card-header"><h5>Product Performance</h5></div>
                    <div class="admin-card-body" style="padding:0;overflow-x:auto">
                        <table class="admin-table" id="reportTable">
                            <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
                            <tbody>
                                ${sorted.map((p, i) => `<tr><td>${i + 1}</td><td style="font-weight:600">${p.name}</td><td>${p.qty}</td><td>${HJKUtils.formatPrice(p.revenue)}</td></tr>`).join('')}
                                ${sorted.length === 0 ? '<tr><td colspan="4" class="text-center text-muted py-4">No data</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>`;
        } else {
            // Customer report
            const customerStats = users.map(u => {
                const uo = filteredOrders.filter(o => o.userId === u.id);
                return { name: u.firstName + ' ' + u.lastName, email: u.email, orders: uo.length, spent: uo.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0) };
            }).sort((a, b) => b.spent - a.spent);

            reportDiv.innerHTML = `
                <div class="admin-card">
                    <div class="admin-card-header"><h5>Customer Report</h5></div>
                    <div class="admin-card-body" style="padding:0;overflow-x:auto">
                        <table class="admin-table" id="reportTable">
                            <thead><tr><th>#</th><th>Customer</th><th>Email</th><th>Orders</th><th>Total Spent</th></tr></thead>
                            <tbody>
                                ${customerStats.map((c, i) => `<tr><td>${i + 1}</td><td style="font-weight:600">${c.name}</td><td>${c.email}</td><td>${c.orders}</td><td>${HJKUtils.formatPrice(c.spent)}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>`;
        }
    },

    exportReport() {
        const table = document.getElementById('reportTable');
        if (!table) return;
        const rows = [];
        table.querySelectorAll('tr').forEach(tr => {
            const row = [];
            tr.querySelectorAll('th, td').forEach(cell => row.push(cell.textContent.trim()));
            rows.push(row);
        });
        HJKUtils.exportCSV(rows, `${this.reportType}-report.csv`);
    }
};
