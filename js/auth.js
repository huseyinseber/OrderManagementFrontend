// Authentication management
class AuthManager {
    static isAuthenticated() {
        return localStorage.getItem('isAuthenticated') === 'true';
    }

    static login(username, password) {
        // Simple authentication - In real app, this would call your API
        if (username && password) {
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('username', username);
            return true;
        }
        return false;
    }

    static logout() {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    }

    static getUsername() {
        return localStorage.getItem('username') || 'Kullanıcı';
    }

    static checkAuth() {
        if (!this.isAuthenticated() && !window.location.href.includes('login.html') && !window.location.href.includes('index.html')) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
}

// Initialize authentication check
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication for protected pages
    if (window.location.href.includes('orders.html')) {
        if (!AuthManager.checkAuth()) {
            return;
        }
        
        // Display username
        const usernameDisplay = document.getElementById('usernameDisplay');
        if (usernameDisplay) {
            usernameDisplay.textContent = AuthManager.getUsername();
        }
    }

    // Login form handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (AuthManager.login(username, password)) {
                window.location.href = 'orders.html';
            } else {
                alert('Lütfen kullanıcı adı ve şifre girin!');
            }
        });
    }
});

// Global logout function
function logout() {
    AuthManager.logout();
}