/**
 * LUMINA E-COMMERCE SCRIPT
 * This script handles all the dynamic functionality of the store.
 * Designed for beginners with detailed comments.
 */

// --- 1. STATE & GLOBAL VARIABLES ---
let allProducts = []; // Stores all products fetched from JSON
let cart = []; // Stores items currently in the cart

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const cartSidebar = document.getElementById('cart-sidebar');
const cartBtn = document.getElementById('cart-btn');
const cartClose = document.getElementById('cart-close');
const overlay = document.getElementById('overlay');
const cartCount = document.getElementById('cart-count');
const cartItemsList = document.getElementById('cart-items-list');
const cartTotalPrice = document.getElementById('cart-total-price');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const loader = document.getElementById('loader');
const toastContainer = document.getElementById('toast-container');

// --- 2. INITIALIZATION ---

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide icons
    lucide.createIcons();

    // 2. Fetch products from JSON file
    fetchProducts();

    // 3. Load cart from Local Storage
    loadCartFromStorage();

    // 4. Setup Event Listeners
    setupEventListeners();

    // 5. Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // 6. Hide loader after a short delay
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }, 1000);
});

// --- 3. CORE FUNCTIONS ---

/**
 * Fetches product data from the products.json file
 */
async function fetchProducts() {
    try {
        const response = await fetch('products.json');
        allProducts = await response.json();
        renderProducts(allProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        productsGrid.innerHTML = '<p class="error">Failed to load products. Please try again later.</p>';
    }
}

/**
 * Renders the product cards to the grid
 * @param {Array} productsToRender - Array of product objects
 */
function renderProducts(productsToRender) {
    // Clear the grid first
    productsGrid.innerHTML = '';

    if (productsToRender.length === 0) {
        productsGrid.innerHTML = '<p class="no-results">No products found matching your criteria.</p>';
        return;
    }

    // Create a card for each product
    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        productCard.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${product.image}" alt="${product.name}" class="product-image">
            </div>
            <span class="product-category">${product.category}</span>
            <h3 class="product-title">${product.name}</h3>
            <div class="product-info">
                <span class="product-price">$${product.price.toFixed(2)}</span>
                <span class="product-rating">
                    <i data-lucide="star" size="16" fill="currentColor"></i>
                    ${product.rating}
                </span>
            </div>
            <button class="btn-add-cart" onclick="addToCart(${product.id})">
                <i data-lucide="shopping-basket"></i>
                Add to Cart
            </button>
        `;
        
        productsGrid.appendChild(productCard);
    });

    // Re-initialize icons for newly added elements
    lucide.createIcons();
}

/**
 * Adds a product to the cart or increases its quantity
 * @param {number} productId - The ID of the product to add
 */
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCart();
    saveCartToStorage();
    showToast(`Added ${product.name} to cart!`);
}

/**
 * Updates the cart UI, count, and total price
 */
function updateCart() {
    // Update count badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update cart sidebar items
    renderCartItems();

    // Update total price
    const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalPrice.textContent = `$${totalValue.toFixed(2)}`;
}

/**
 * Renders items in the shopping cart sidebar
 */
function renderCartItems() {
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<div class="empty-cart-msg"><p>Your cart is empty.</p></div>';
        return;
    }

    cartItemsList.innerHTML = '';
    cart.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        
        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <h4 class="cart-item-title">${item.name}</h4>
                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})" style="margin-left: auto; color: var(--danger)">
                        <i data-lucide="trash-2" size="18"></i>
                    </button>
                </div>
            </div>
        `;
        cartItemsList.appendChild(itemEl);
    });

    lucide.createIcons();
}

/**
 * Changes the quantity of an item in the cart
 */
function changeQuantity(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += delta;

    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCart();
        saveCartToStorage();
    }
}

/**
 * Removes an item from the cart
 */
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    saveCartToStorage();
}

/**
 * Filters and searches products
 */
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filtered = allProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    renderProducts(filtered);
}

/**
 * Shows a temporary toast notification
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i data-lucide="check-circle" style="color: var(--success)"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    lucide.createIcons();

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- 4. UTILITIES ---

function setupEventListeners() {
    // Cart open/close
    cartBtn.addEventListener('click', toggleCart);
    cartClose.addEventListener('click', toggleCart);
    overlay.addEventListener('click', toggleCart);

    // Search and Filter
    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);

    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);
}

function toggleCart() {
    cartSidebar.classList.toggle('open');
    overlay.classList.toggle('show');
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeIcon.setAttribute('data-lucide', 'moon');
    } else {
        themeIcon.setAttribute('data-lucide', 'sun');
    }
    lucide.createIcons();
}

function saveCartToStorage() {
    localStorage.setItem('lumina_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('lumina_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}