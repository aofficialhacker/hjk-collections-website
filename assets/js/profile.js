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

    async saveProfile(e) {
        e.preventDefault();
        const firstName = document.getElementById('profFirstName').value.trim();
        const lastName = document.getElementById('profLastName').value.trim();
        const phone = document.getElementById('profPhone').value.trim();

        try {
            const res = await HJKAPI.post('/auth/update-profile.php', { firstName, lastName, phone });
            if (res.success) {
                // Update cached session
                if (HJKApp._session) {
                    HJKApp._session.firstName = firstName;
                    HJKApp._session.lastName = lastName;
                    HJKApp._session.phone = phone;
                }
                HJKComponents.showToast('Profile updated!', 'success');
            } else {
                HJKComponents.showToast(res.message || 'Failed to update profile', 'error');
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to update profile', 'error');
        }
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

    async changePassword(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPwd').value;

        if (newPassword.length < 8) { HJKComponents.showToast('Password must be at least 8 characters', 'error'); return; }
        if (newPassword !== confirmPassword) { HJKComponents.showToast('Passwords do not match', 'error'); return; }

        try {
            const res = await HJKAPI.post('/auth/change-password.php', { currentPassword, newPassword });
            if (res.success) {
                HJKComponents.showToast('Password updated!', 'success');
                e.target.reset();
            } else {
                HJKComponents.showToast(res.message || 'Failed to change password', 'error');
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to change password', 'error');
        }
    },

    async initAddressesPage() {
        const content = document.getElementById('profileContent');
        let addresses = [];

        try {
            const res = await HJKAPI.addresses.list();
            if (res.success) {
                addresses = res.data || [];
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to load addresses', 'error');
        }

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

    async showAddressModal(editId) {
        let addr = null;
        if (editId) {
            try {
                const res = await HJKAPI.addresses.list();
                if (res.success) {
                    addr = (res.data || []).find(a => a.id === editId);
                }
            } catch (err) {
                HJKComponents.showToast(err.message || 'Failed to load address', 'error');
                return;
            }
        }

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

    async saveAddress(e, editId) {
        e.preventDefault();

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
            data.id = editId;
        }

        try {
            const res = await HJKAPI.addresses.save(data);
            if (res.success) {
                document.getElementById('addressModal')?.remove();
                HJKComponents.showToast('Address saved!', 'success');
                await this.initAddressesPage();
            } else {
                HJKComponents.showToast(res.message || 'Failed to save address', 'error');
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to save address', 'error');
        }
    },

    async setDefaultAddress(id) {
        try {
            const res = await HJKAPI.addresses.setDefault(id);
            if (res.success) {
                HJKComponents.showToast('Default address updated', 'success');
                await this.initAddressesPage();
            } else {
                HJKComponents.showToast(res.message || 'Failed to set default address', 'error');
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to set default address', 'error');
        }
    },

    deleteAddress(id) {
        HJKComponents.showConfirm('Delete Address', 'Are you sure you want to delete this address?', async () => {
            try {
                const res = await HJKAPI.addresses.delete(id);
                if (res.success) {
                    HJKComponents.showToast('Address deleted', 'info');
                    await this.initAddressesPage();
                } else {
                    HJKComponents.showToast(res.message || 'Failed to delete address', 'error');
                }
            } catch (err) {
                HJKComponents.showToast(err.message || 'Failed to delete address', 'error');
            }
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

    async saveNotifPref(key, value) {
        try {
            const res = await HJKAPI.post('/auth/update-profile.php', { notificationPrefs: { [key]: value } });
            if (res.success) {
                // Update cached session
                if (HJKApp._session) {
                    if (!HJKApp._session.notificationPrefs) HJKApp._session.notificationPrefs = {};
                    HJKApp._session.notificationPrefs[key] = value;
                }
                HJKComponents.showToast('Preference saved!', 'success');
            } else {
                HJKComponents.showToast(res.message || 'Failed to save preference', 'error');
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to save preference', 'error');
        }
    }
};
