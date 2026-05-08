// main.js - Common utility functions

const API_URL = '/api';

// Auth State Management
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    const loggedInElements = document.querySelectorAll('.logged-in-only');
    const loggedOutElements = document.querySelectorAll('.logged-out-only');
    const usernameDisplay = document.getElementById('nav-username');

    if (token && user) {
        loggedInElements.forEach(el => el.classList.remove('auth-hidden'));
        loggedOutElements.forEach(el => el.classList.add('auth-hidden'));
        if (usernameDisplay) usernameDisplay.textContent = `Hi, ${user.username}`;
    } else {
        loggedInElements.forEach(el => el.classList.add('auth-hidden'));
        loggedOutElements.forEach(el => el.classList.remove('auth-hidden'));
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Cart Management
function getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product, quantity = 1) {
    const cart = getCart();
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: quantity
        });
    }
    
    saveCart(cart);
    alert('Item added to cart!');
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElements = document.querySelectorAll('.cart-count');
    countElements.forEach(el => el.textContent = count);
}

// Formatting
function formatPrice(price) {
    return '$' + parseFloat(price).toFixed(2);
}

// Initialize common UI
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateCartCount();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});
