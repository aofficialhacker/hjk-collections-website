/* ============================================
   HJKCollections - Authentication Logic
   ============================================ */

const HJKAuth = {
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            HJKComponents.showToast('Please fill in all fields', 'error');
            return;
        }

        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn ? btn.innerHTML : '';
        if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';

        try {
            const res = await HJKAPI.auth.login(email, password);
            if (res.success) {
                HJKComponents.showToast('Login successful!', 'success');
                const redirect = sessionStorage.getItem('hjk_redirect');
                sessionStorage.removeItem('hjk_redirect');
                setTimeout(() => {
                    window.location.href = redirect || 'index.html';
                }, 500);
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Invalid email or password', 'error');
            if (btn) btn.innerHTML = originalText;
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const firstName = document.getElementById('regFirstName').value.trim();
        const lastName = document.getElementById('regLastName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const termsAccepted = document.getElementById('regTerms').checked;

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

        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn ? btn.innerHTML : '';
        if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating account...';

        try {
            const res = await HJKAPI.auth.register({ firstName, lastName, email, phone, password });
            if (res.success) {
                HJKComponents.showToast('Account created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Registration failed', 'error');
            if (btn) btn.innerHTML = originalText;
        }
    },

    async handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value.trim();

        if (!HJKUtils.isValidEmail(email)) {
            HJKComponents.showToast('Please enter a valid email address', 'error');
            return;
        }

        try {
            const res = await HJKAPI.auth.forgotPassword(email);
            document.getElementById('forgotForm').style.display = 'none';
            document.getElementById('resetForm').style.display = 'block';
            HJKComponents.showToast(res.message || 'Password reset link sent!', 'success');
        } catch (err) {
            HJKComponents.showToast(err.message || 'Failed to send reset link', 'error');
        }
    },

    async handleResetPassword(e) {
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

        try {
            const res = await HJKAPI.auth.resetPassword(email, newPassword);
            HJKComponents.showToast(res.message || 'Password reset successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        } catch (err) {
            HJKComponents.showToast(err.message || 'Password reset failed', 'error');
        }
    },

    async handleAdminLogin(e) {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn ? btn.innerHTML : '';
        if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';

        try {
            const res = await HJKAPI.auth.adminLogin(email, password);
            if (res.success) {
                HJKComponents.showToast('Welcome back, Admin!', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            }
        } catch (err) {
            HJKComponents.showToast(err.message || 'Invalid admin credentials', 'error');
            if (btn) btn.innerHTML = originalText;
        }
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
