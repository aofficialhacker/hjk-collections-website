/* ============================================
   HJKCollections - Admin Dashboard
   ============================================ */

const AdminDashboard = {
    init() {
        if (!AdminComponents.getAdminPageShell('dashboard', 'Dashboard')) return;
        this.render();
    },

    async render() {
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p class="mt-2">Loading dashboard...</p></div>';

        try {
            const response = await HJKAPI.admin.dashboard.stats();
            if (!response.success) throw new Error(response.message || 'Failed to load dashboard');

            const stats = response.data;
            const totalRevenue = stats.totalRevenue || 0;
            const totalOrders = stats.totalOrders || 0;
            const totalCustomers = stats.totalCustomers || 0;
            const totalProducts = stats.totalProducts || 0;
            const pendingOrders = stats.ordersByStatus?.placed || 0;
            const pendingReviews = stats.pendingReviews || 0;
            const pendingReturns = stats.pendingReturns || 0;
            const deliveredOrders = stats.ordersByStatus?.delivered || 0;
            const recentOrders = stats.recentOrders || [];
            const lowStockProducts = stats.lowStockProducts || [];
            const ordersByStatus = stats.ordersByStatus || {};
            const monthlyRevenue = stats.monthlyRevenue || new Array(12).fill(0);

            content.innerHTML = `
                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon blue"><i class="fa-solid fa-indian-rupee-sign"></i></div>
                        <div class="stat-info">
                            <h3>${HJKUtils.formatPrice(totalRevenue)}</h3>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon green"><i class="fa-solid fa-shopping-cart"></i></div>
                        <div class="stat-info">
                            <h3>${totalOrders}</h3>
                            <p>Total Orders</p>
                            ${pendingOrders > 0 ? `<div class="stat-change up">${pendingOrders} pending</div>` : ''}
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon purple"><i class="fa-solid fa-users"></i></div>
                        <div class="stat-info">
                            <h3>${totalCustomers}</h3>
                            <p>Customers</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon orange"><i class="fa-solid fa-box"></i></div>
                        <div class="stat-info">
                            <h3>${totalProducts}</h3>
                            <p>Products</p>
                        </div>
                    </div>
                </div>

                <!-- Charts Row -->
                <div class="row g-4 mb-4">
                    <div class="col-md-8">
                        <div class="admin-card">
                            <div class="admin-card-header"><h5>Revenue Overview</h5></div>
                            <div class="admin-card-body"><div class="chart-container"><canvas id="revenueChart"></canvas></div></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="admin-card">
                            <div class="admin-card-header"><h5>Order Status</h5></div>
                            <div class="admin-card-body"><div class="chart-container"><canvas id="orderStatusChart"></canvas></div></div>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats Row -->
                <div class="row g-4 mb-4">
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon red"><i class="fa-solid fa-rotate-left"></i></div>
                            <div class="stat-info"><h3>${pendingReturns}</h3><p>Pending Returns</p></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon teal"><i class="fa-solid fa-star"></i></div>
                            <div class="stat-info"><h3>${pendingReviews}</h3><p>Pending Reviews</p></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon gold"><i class="fa-solid fa-triangle-exclamation"></i></div>
                            <div class="stat-info"><h3>${lowStockProducts.length}</h3><p>Low Stock Items</p></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon blue"><i class="fa-solid fa-check-circle"></i></div>
                            <div class="stat-info"><h3>${deliveredOrders}</h3><p>Delivered</p></div>
                        </div>
                    </div>
                </div>

                <!-- Tables Row -->
                <div class="row g-4">
                    <div class="col-md-8">
                        <div class="admin-card">
                            <div class="admin-card-header">
                                <h5>Recent Orders</h5>
                                <a href="orders/index.html" class="btn-outline-custom btn-sm">View All</a>
                            </div>
                            <div class="admin-card-body" style="padding:0">
                                <table class="admin-table">
                                    <thead>
                                        <tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                                    </thead>
                                    <tbody>
                                        ${recentOrders.map(o => `<tr>
                                            <td><a href="orders/detail.html?id=${o.id}" style="color:var(--secondary);font-weight:600">${o.orderNumber}</a></td>
                                            <td>${o.customerName || 'Unknown'}</td>
                                            <td>${HJKUtils.formatPrice(o.totalAmount)}</td>
                                            <td>${HJKUtils.getStatusBadge(o.orderStatus)}</td>
                                            <td style="font-size:0.82rem">${HJKUtils.formatDate(o.createdAt)}</td>
                                        </tr>`).join('')}
                                        ${recentOrders.length === 0 ? '<tr><td colspan="5" class="text-center text-muted py-4">No orders yet</td></tr>' : ''}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="admin-card">
                            <div class="admin-card-header"><h5>Low Stock Alert</h5></div>
                            <div class="admin-card-body">
                                ${lowStockProducts.length === 0 ? '<p class="text-muted text-center py-3">All products are well stocked</p>' :
                                lowStockProducts.slice(0, 6).map(p => `
                                    <div class="d-flex justify-content-between align-items-center py-2" style="border-bottom:1px solid var(--border)">
                                        <div>
                                            <div style="font-weight:600;font-size:0.85rem">${p.name}</div>
                                            <div style="font-size:0.75rem;color:var(--text-muted)">${p.color} / ${p.size}</div>
                                        </div>
                                        <span class="badge" style="background:${p.stock === 0 ? 'var(--danger)' : 'var(--warning)'};color:#fff;padding:4px 10px;border-radius:20px;font-size:0.75rem">${p.stock === 0 ? 'Out' : p.stock + ' left'}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>`;

            // Initialize charts
            this.initCharts(ordersByStatus, monthlyRevenue);
        } catch (err) {
            content.innerHTML = `<div class="text-center py-5 text-danger"><i class="fa-solid fa-exclamation-triangle fa-2x mb-2"></i><p>${err.message}</p></div>`;
            AdminComponents.showToast(err.message, 'error');
        }
    },

    initCharts(ordersByStatus, monthlyRevenue) {
        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx && typeof Chart !== 'undefined') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const revenueData = Array.isArray(monthlyRevenue) ? monthlyRevenue : new Array(12).fill(0);

            new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Revenue',
                        data: revenueData,
                        borderColor: '#C9A96E',
                        backgroundColor: 'rgba(201,169,110,0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#C9A96E',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { callback: v => '₹' + (v / 1000) + 'K' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // Order Status Chart
        const statusCtx = document.getElementById('orderStatusChart');
        if (statusCtx && typeof Chart !== 'undefined') {
            const statusLabels = Object.keys(ordersByStatus).map(s => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
            const statusData = Object.values(ordersByStatus);

            if (statusLabels.length > 0) {
                new Chart(statusCtx, {
                    type: 'doughnut',
                    data: {
                        labels: statusLabels,
                        datasets: [{
                            data: statusData,
                            backgroundColor: ['#4285f4', '#34a853', '#fbbc05', '#ea4335', '#9c27b0', '#00897b', '#ff9800'],
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 11 } } } }
                    }
                });
            }
        }
    }
};
