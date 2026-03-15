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
                    </select>
                    <input type="date" class="admin-filter-select" id="dateFrom" value="${this.dateFrom}" onchange="AdminReports.dateFrom=this.value">
                    <input type="date" class="admin-filter-select" id="dateTo" value="${this.dateTo}" onchange="AdminReports.dateTo=this.value">
                    <button class="btn-primary-custom btn-sm" onclick="AdminReports.generateReport()"><i class="fa-solid fa-chart-bar me-1"></i>Generate</button>
                </div>
                <div class="toolbar-right">
                    <button class="btn-outline-custom btn-sm" onclick="AdminReports.exportReport()"><i class="fa-solid fa-download me-1"></i>Export CSV</button>
                </div>
            </div>

            <div id="reportContent"><div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div></div>`;

        this.generateReport();
    },

    async generateReport() {
        const reportDiv = document.getElementById('reportContent');
        reportDiv.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

        try {
            if (this.reportType === 'sales') {
                const params = {};
                if (this.dateFrom) params.dateFrom = this.dateFrom;
                if (this.dateTo) params.dateTo = this.dateTo;

                const response = await HJKAPI.admin.reports.sales(params);
                if (!response.success) throw new Error(response.message || 'Failed to load report');

                const data = response.data || {};
                const totalRevenue = data.totalRevenue || 0;
                const totalOrders = data.totalOrders || 0;
                const avgOrderValue = data.avgOrderValue || 0;
                const daily = data.daily || [];

                reportDiv.innerHTML = `
                    <div class="stats-grid mb-4">
                        <div class="stat-card"><div class="stat-icon blue"><i class="fa-solid fa-indian-rupee-sign"></i></div><div class="stat-info"><h3>${HJKUtils.formatPrice(totalRevenue)}</h3><p>Total Revenue</p></div></div>
                        <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-shopping-cart"></i></div><div class="stat-info"><h3>${totalOrders}</h3><p>Total Orders</p></div></div>
                        <div class="stat-card"><div class="stat-icon purple"><i class="fa-solid fa-chart-line"></i></div><div class="stat-info"><h3>${HJKUtils.formatPrice(avgOrderValue)}</h3><p>Avg Order Value</p></div></div>
                    </div>

                    <div class="admin-card">
                        <div class="admin-card-header"><h5>Daily Breakdown</h5></div>
                        <div class="admin-card-body" style="padding:0;overflow-x:auto">
                            <table class="admin-table" id="reportTable">
                                <thead><tr><th>Date</th><th>Orders</th><th>Revenue</th></tr></thead>
                                <tbody>
                                    ${daily.map(d => `<tr><td>${HJKUtils.formatDate(d.date)}</td><td>${d.orders}</td><td>${HJKUtils.formatPrice(d.revenue)}</td></tr>`).join('')}
                                    ${daily.length === 0 ? '<tr><td colspan="3" class="text-center text-muted py-4">No data for selected period</td></tr>' : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>`;

            } else if (this.reportType === 'products') {
                const params = { limit: 50 };
                const response = await HJKAPI.admin.reports.products(params);
                if (!response.success) throw new Error(response.message || 'Failed to load report');

                const products = response.data || [];

                reportDiv.innerHTML = `
                    <div class="admin-card">
                        <div class="admin-card-header"><h5>Product Performance</h5></div>
                        <div class="admin-card-body" style="padding:0;overflow-x:auto">
                            <table class="admin-table" id="reportTable">
                                <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
                                <tbody>
                                    ${products.map((p, i) => `<tr><td>${i + 1}</td><td style="font-weight:600">${p.name}</td><td>${p.totalSold}</td><td>${HJKUtils.formatPrice(p.revenue)}</td></tr>`).join('')}
                                    ${products.length === 0 ? '<tr><td colspan="4" class="text-center text-muted py-4">No data</td></tr>' : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>`;
            }
        } catch (err) {
            reportDiv.innerHTML = `<div class="text-center py-5 text-danger">${err.message}</div>`;
            AdminComponents.showToast(err.message, 'error');
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
