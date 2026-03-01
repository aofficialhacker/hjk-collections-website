/* ============================================
   HJKCollections - Profile Pages Logic
   ============================================ */

const HJKProfile = {
    renderSidebar(activePage) {
        const user = HJKApp.getCurrentUser();
        if (!user) return;
        const sidebar = document.getElementById('profileSidebar');
        if (!sidebar) return;

        const links = [
            { href: 'index.html', icon: 'fa-user', label: 'My Profile', page: 'profile' },
            { href: 'orders.html', icon: 'fa-box', label: 'My Orders', page: 'orders' },
            { href: 'addresses.html', icon: 'fa-location-dot', label: 'Addresses', page: 'addresses' },
            { href: 'change-password.html', icon: 'fa-lock', label: 'Change Password', page: 'password' },
            { href: 'notifications.html', icon: 'fa-bell', label: 'Notifications', page: 'notifications' },
            { href: '../wishlist.html', icon: 'fa-heart', label: 'Wishlist', page: 'wishlist' }
        ];

        sidebar.innerHTML = `
            <div class="sidebar-card">
                <div class="sidebar-user">
                    <div class="sidebar-avatar">${user.firstName.charAt(0)}${user.lastName.charAt(0)}</div>
                    <h5>${user.firstName} ${user.lastName}</h5>
                    <p>${user.email}</p>
                </div>
                <nav class="sidebar-nav">
                    ${links.map(l => `<a href="${l.href}" class="${activePage === l.page ? 'active' : ''}"><i class="fa-solid ${l.icon}"></i>${l.label}</a>`).join('')}
                    <a href="#" onclick="HJKApp.logout();return false;" style="color:var(--danger)"><i class="fa-solid fa-right-from-bracket"></i>Logout</a>
                </nav>
            </div>`;
    },

    initProfilePage() {
        const user = HJKApp.getCurrentUser();
        if (!user) return;
        const content = document.getElementById('profileContent');
        content.innerHTML = `
            <div class="content-card">
                <div class="content-header"><h4>Personal Information</h4></div>
                <form onsubmit="HJKProfile.saveProfile(event)">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label-custom">First Name</label>
                            <input type="text" class="form-control-custom" id="profFirstName" value="${user.firstName}" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label-custom">Last Name</label>
                            <input type="text" class="form-control-custom" id="profLastName" value="${user.lastName}" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label-custom">Email</label>
                            <input type="email" class="form-control-custom" value="${user.email}" readonly style="background:var(--bg-alt)">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label-custom">Phone</label>
                            <input type="text" class="form-control-custom" id="profPhone" value="${user.phone}" required>
                        </div>
                        <div class="col-12"><button type="submit" class="btn-primary-custom">Save Changes</button></div>
                    </div>
                </form>
            </div>`;
    },

    saveProfile(e) {
        e.preventDefault();
        const users = HJKUtils.store.get('hjk_users') || [];
        const session = HJKUtils.store.get('hjk_session');
        const user = users.find(u => u.id === session.userId);
        if (!user) return;

        user.firstName = document.getElementById('profFirstName').value.trim();
        user.lastName = document.getElementById('profLastName').value.trim();
        user.phone = document.getElementById('profPhone').value.trim();
        user.updatedAt = new Date().toISOString();
        HJKUtils.store.set('hjk_users', users);
        HJKComponents.showToast('Profile updated!', 'success');
    },

    initChangePasswordPage() {
        const content = document.getElementById('profileContent');
        content.innerHTML = `
            <div class="content-card">
                <div class="content-header"><h4>Change Password</h4></div>
                <form onsubmit="HJKProfile.changePassword(event)" style="max-width:500px">
                    <div class="form-group">
                        <label class="form-label-custom">Current Password</label>
                        <input type="password" class="form-control-custom" id="currentPassword" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label-custom">New Password</label>
                        <input type="password" class="form-control-custom" id="newPassword" required oninput="HJKAuth.updatePasswordStrength(this.value)">
                        <div class="password-strength-bar"><div class="bar"></div></div>
                        <div class="password-strength-label"></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label-custom">Confirm New Password</label>
                        <input type="password" class="form-control-custom" id="confirmNewPwd" required>
                    </div>
                    <button type="submit" class="btn-primary-custom">Update Password</button>
                </form>
            </div>`;
    },

    changePassword(e) {
        e.preventDefault();
        const current = document.getElementById('currentPassword').value;
        const newPwd = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmNewPwd').value;

        const users = HJKUtils.store.get('hjk_users') || [];
        const session = HJKUtils.store.get('hjk_session');
        const user = users.find(u => u.id === session.userId);

        if (user.password !== current) { HJKComponents.showToast('Current password is incorrect', 'error'); return; }
        if (newPwd.length < 8) { HJKComponents.showToast('Password must be at least 8 characters', 'error'); return; }
        if (newPwd !== confirm) { HJKComponents.showToast('Passwords do not match', 'error'); return; }

        user.password = newPwd;
        user.updatedAt = new Date().toISOString();
        HJKUtils.store.set('hjk_users', users);
        HJKComponents.showToast('Password updated!', 'success');
        e.target.reset();
    },

    initAddressesPage() {
        const user = HJKApp.getCurrentUser();
        const addresses = (HJKUtils.store.get('hjk_addresses') || []).filter(a => a.userId === user.id);
        const content = document.getElementById('profileContent');

        content.innerHTML = `
            <div class="content-card">
                <div class="content-header">
                    <h4>My Addresses</h4>
                    <button class="btn-primary-custom btn-sm" onclick="HJKProfile.showAddressModal()"><i class="fa-solid fa-plus"></i> Add Address</button>
                </div>
                <div class="row g-3" id="addressList">
                    ${addresses.length === 0 ? '<div class="col-12"><p class="text-muted">No addresses saved yet.</p></div>' :
                    addresses.map(addr => `
                        <div class="col-md-6">
                            <div class="address-card">
                                <span class="address-label">${addr.label}</span>
                                ${addr.isDefault ? '<span class="address-default"><i class="fa-solid fa-check-circle"></i> Default</span>' : ''}
                                <div class="address-name">${addr.fullName}</div>
                                <div class="address-text">${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}<br>${addr.city}, ${addr.state} - ${addr.pincode}</div>
                                <div class="address-phone"><i class="fa-solid fa-phone me-1"></i>${addr.phone}</div>
                                <div class="address-actions">
                                    <button onclick="HJKProfile.editAddress('${addr.id}')"><i class="fa-solid fa-pen me-1"></i>Edit</button>
                                    ${!addr.isDefault ? `<button onclick="HJKProfile.setDefaultAddress('${addr.id}')"><i class="fa-solid fa-star me-1"></i>Set Default</button>` : ''}
                                    <button class="delete-btn" onclick="HJKProfile.deleteAddress('${addr.id}')"><i class="fa-solid fa-trash me-1"></i>Delete</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    },

    showAddressModal(editId) {
        const addresses = HJKUtils.store.get('hjk_addresses') || [];
        const addr = editId ? addresses.find(a => a.id === editId) : null;

        const html = `
        <div class="modal-overlay" id="addressModal" onclick="if(event.target===this)this.remove()">
            <div class="modal-content-custom">
                <div class="modal-header-custom">
                    <h5>${addr ? 'Edit Address' : 'Add New Address'}</h5>
                    <button class="modal-close" onclick="document.getElementById('addressModal').remove()">&times;</button>
                </div>
                <div class="modal-body-custom">
                    <form onsubmit="HJKProfile.saveAddress(event, '${editId || ''}')">
                        <div class="row g-3">
                            <div class="col-md-6"><label class="form-label-custom">Full Name</label><input type="text" class="form-control-custom" id="mAddrName" value="${addr?.fullName || ''}" required></div>
                            <div class="col-md-6"><label class="form-label-custom">Phone</label><input type="text" class="form-control-custom" id="mAddrPhone" value="${addr?.phone || ''}" required></div>
                            <div class="col-12"><label class="form-label-custom">Address Line 1</label><input type="text" class="form-control-custom" id="mAddrLine1" value="${addr?.addressLine1 || ''}" required></div>
                            <div class="col-12"><label class="form-label-custom">Address Line 2</label><input type="text" class="form-control-custom" id="mAddrLine2" value="${addr?.addressLine2 || ''}"></div>
                            <div class="col-md-4"><label class="form-label-custom">City</label><input type="text" class="form-control-custom" id="mAddrCity" value="${addr?.city || ''}" required></div>
                            <div class="col-md-4"><label class="form-label-custom">State</label><input type="text" class="form-control-custom" id="mAddrState" value="${addr?.state || ''}" required></div>
                            <div class="col-md-4"><label class="form-label-custom">Pincode</label><input type="text" class="form-control-custom" id="mAddrPincode" value="${addr?.pincode || ''}" required></div>
                            <div class="col-md-6">
                                <label class="form-label-custom">Label</label>
                                <select class="form-control-custom" id="mAddrLabel">
                                    <option value="Home" ${addr?.label==='Home'?'selected':''}>Home</option>
                                    <option value="Work" ${addr?.label==='Work'?'selected':''}>Work</option>
                                    <option value="Other" ${addr?.label==='Other'?'selected':''}>Other</option>
                                </select>
                            </div>
                            <div class="col-12"><button type="submit" class="btn-primary-custom w-100 justify-content-center">Save Address</button></div>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    editAddress(id) { this.showAddressModal(id); },

    saveAddress(e, editId) {
        e.preventDefault();
        const user = HJKApp.getCurrentUser();
        const addresses = HJKUtils.store.get('hjk_addresses') || [];

        const data = {
            fullName: document.getElementById('mAddrName').value.trim(),
            phone: document.getElementById('mAddrPhone').value.trim(),
            addressLine1: document.getElementById('mAddrLine1').value.trim(),
            addressLine2: document.getElementById('mAddrLine2').value.trim(),
            city: document.getElementById('mAddrCity').value.trim(),
            state: document.getElementById('mAddrState').value.trim(),
            pincode: document.getElementById('mAddrPincode').value.trim(),
            label: document.getElementById('mAddrLabel').value
        };

        if (editId) {
            const addr = addresses.find(a => a.id === editId);
            if (addr) Object.assign(addr, data);
        } else {
            addresses.push({
                id: HJKUtils.generateId('addr'), userId: user.id, ...data,
                isDefault: addresses.filter(a => a.userId === user.id).length === 0,
                createdAt: new Date().toISOString()
            });
        }

        HJKUtils.store.set('hjk_addresses', addresses);
        document.getElementById('addressModal')?.remove();
        HJKComponents.showToast('Address saved!', 'success');
        this.initAddressesPage();
    },

    setDefaultAddress(id) {
        const user = HJKApp.getCurrentUser();
        const addresses = HJKUtils.store.get('hjk_addresses') || [];
        addresses.filter(a => a.userId === user.id).forEach(a => a.isDefault = a.id === id);
        HJKUtils.store.set('hjk_addresses', addresses);
        this.initAddressesPage();
    },

    deleteAddress(id) {
        HJKComponents.showConfirm('Delete Address', 'Are you sure you want to delete this address?', () => {
            let addresses = HJKUtils.store.get('hjk_addresses') || [];
            addresses = addresses.filter(a => a.id !== id);
            HJKUtils.store.set('hjk_addresses', addresses);
            HJKComponents.showToast('Address deleted', 'info');
            this.initAddressesPage();
        });
    },

    initNotificationsPage() {
        const user = HJKApp.getCurrentUser();
        const prefs = user.notificationPrefs || {};
        const content = document.getElementById('profileContent');

        content.innerHTML = `
            <div class="content-card">
                <div class="content-header"><h4>Notification Preferences</h4></div>
                <div class="d-flex flex-column gap-4" style="max-width:500px">
                    ${[
                        { key: 'orderUpdates', label: 'Order Updates', desc: 'Get notified about your order status changes' },
                        { key: 'promotions', label: 'Promotions & Offers', desc: 'Receive promotional emails and special offers' },
                        { key: 'newsletter', label: 'Newsletter', desc: 'Subscribe to our weekly newsletter' }
                    ].map(item => `
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <div style="font-weight:600;font-size:0.92rem">${item.label}</div>
                                <div style="font-size:0.82rem;color:var(--text-muted)">${item.desc}</div>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch" id="notif_${item.key}"
                                    ${prefs[item.key] ? 'checked' : ''} onchange="HJKProfile.saveNotifPref('${item.key}', this.checked)"
                                    style="width:3rem;height:1.5rem;cursor:pointer">
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    },

    saveNotifPref(key, value) {
        const users = HJKUtils.store.get('hjk_users') || [];
        const session = HJKUtils.store.get('hjk_session');
        const user = users.find(u => u.id === session.userId);
        if (user) {
            user.notificationPrefs[key] = value;
            HJKUtils.store.set('hjk_users', users);
            HJKComponents.showToast('Preference saved!', 'success');
        }
    }
};
