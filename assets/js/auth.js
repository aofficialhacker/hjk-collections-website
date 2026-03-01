/* ============================================
   HJKCollections - Authentication Logic
   ============================================ */

const HJKAuth = {
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            HJKComponents.showToast('Please fill in all fields', 'error');
            return;
        }

        const users = HJKUtils.store.get('hjk_users') || [];
        const user = users.find(u => u.email === email && u.password === password && u.role === 'customer');

        if (!user) {
            HJKComponents.showToast('Invalid email or password', 'error');
            return;
        }

        if (!user.isActive) {
            HJKComponents.showToast('Your account has been disabled. Please contact support.', 'error');
            return;
        }

        HJKUtils.store.set('hjk_session', {
            isLoggedIn: true,
            userId: user.id,
            role: 'customer',
            loginAt: new Date().toISOString()
        });

        HJKComponents.showToast('Login successful!', 'success');

        const redirect = sessionStorage.getItem('hjk_redirect');
        sessionStorage.removeItem('hjk_redirect');
        setTimeout(() => {
            window.location.href = redirect || 'index.html';
        }, 500);
    },

    handleRegister(e) {
        e.preventDefault();
        const firstName = document.getElementById('regFirstName').value.trim();
        const lastName = document.getElementById('regLastName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const termsAccepted = document.getElementById('regTerms').checked;

        // Validation
        if (!firstName || !lastName || !email || !phone || !password) {
            HJKComponents.showToast('Please fill in all fields', 'error');
            return;
        }

        if (!HJKUtils.isValidEmail(email)) {
            HJKComponents.showToast('Please enter a valid email address', 'error');
            return;
        }

        if (!HJKUtils.isValidPhone(phone)) {
            HJKComponents.showToast('Please enter a valid 10-digit phone number', 'error');
            return;
        }

        if (password.length < 8) {
            HJKComponents.showToast('Password must be at least 8 characters', 'error');
            return;
        }

        if (password !== confirmPassword) {
            HJKComponents.showToast('Passwords do not match', 'error');
            return;
        }

        if (!termsAccepted) {
            HJKComponents.showToast('Please accept the Terms & Conditions', 'error');
            return;
        }

        const users = HJKUtils.store.get('hjk_users') || [];
        if (users.find(u => u.email === email)) {
            HJKComponents.showToast('An account with this email already exists', 'error');
            return;
        }

        const newUser = {
            id: HJKUtils.generateId('usr'),
            firstName,
            lastName,
            email,
            phone,
            password,
            avatar: '',
            role: 'customer',
            isActive: true,
            notificationPrefs: { orderUpdates: true, promotions: true, newsletter: true },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        users.push(newUser);
        HJKUtils.store.set('hjk_users', users);

        // Auto login
        HJKUtils.store.set('hjk_session', {
            isLoggedIn: true,
            userId: newUser.id,
            role: 'customer',
            loginAt: new Date().toISOString()
        });

        HJKComponents.showToast('Account created successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    },

    handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value.trim();

        if (!HJKUtils.isValidEmail(email)) {
            HJKComponents.showToast('Please enter a valid email address', 'error');
            return;
        }

        const users = HJKUtils.store.get('hjk_users') || [];
        if (!users.find(u => u.email === email)) {
            HJKComponents.showToast('No account found with this email', 'error');
            return;
        }

        document.getElementById('forgotForm').style.display = 'none';
        document.getElementById('resetForm').style.display = 'block';
        HJKComponents.showToast('Password reset link sent! (Mock: use the form below)', 'success');
    },

    handleResetPassword(e) {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value.trim();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword.length < 8) {
            HJKComponents.showToast('Password must be at least 8 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            HJKComponents.showToast('Passwords do not match', 'error');
            return;
        }

        const users = HJKUtils.store.get('hjk_users') || [];
        const user = users.find(u => u.email === email);
        if (user) {
            user.password = newPassword;
            user.updatedAt = new Date().toISOString();
            HJKUtils.store.set('hjk_users', users);
        }

        HJKComponents.showToast('Password reset successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    },

    handleAdminLogin(e) {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        const users = HJKUtils.store.get('hjk_users') || [];
        const admin = users.find(u => u.email === email && u.password === password && u.role === 'superadmin');

        if (!admin) {
            HJKComponents.showToast('Invalid admin credentials', 'error');
            return;
        }

        HJKUtils.store.set('hjk_admin_session', {
            isLoggedIn: true,
            userId: admin.id,
            role: 'superadmin',
            loginAt: new Date().toISOString()
        });

        HJKComponents.showToast('Welcome back, Admin!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    },

    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const btn = input.nextElementSibling || input.parentElement.querySelector('.toggle-password');
        if (input.type === 'password') {
            input.type = 'text';
            if (btn) btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
        } else {
            input.type = 'password';
            if (btn) btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
        }
    },

    updatePasswordStrength(password) {
        const strength = HJKUtils.getPasswordStrength(password);
        const bar = document.querySelector('.password-strength-bar .bar');
        const label = document.querySelector('.password-strength-label');
        if (bar) {
            bar.style.width = strength.percent + '%';
            bar.style.background = strength.color;
        }
        if (label) {
            label.textContent = strength.label;
            label.style.color = strength.color;
        }
    }
};
