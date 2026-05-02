
base_dir = "/mnt/agents/output/vezaraa"

# Create the main app.js - Part 1
app_js_part1 = '''// Vezaraa - Ultra-Premium Luxury Fashion E-Commerce SPA
// Complete Frontend Application

import { 
    PRODUCTS, COLLECTIONS, HERO_SLIDES, INFLUENCERS, 
    REVIEWS, BLOG_POSTS, FAQS, CATEGORIES, 
    SHIPPING_OPTIONS, PAYMENT_METHODS, COUNTRIES, 
    CURRENCIES, LANGUAGES 
} from './data/products.js';

// ============================================
// STATE MANAGEMENT
// ============================================
const State = {
    cart: JSON.parse(localStorage.getItem('vezaraa_cart')) || [],
    wishlist: JSON.parse(localStorage.getItem('vezaraa_wishlist')) || [],
    user: JSON.parse(localStorage.getItem('vezaraa_user')) || null,
    orders: JSON.parse(localStorage.getItem('vezaraa_orders')) || [],
    addresses: JSON.parse(localStorage.getItem('vezaraa_addresses')) || [],
    darkMode: localStorage.getItem('vezaraa_darkMode') === 'true',
    currency: JSON.parse(localStorage.getItem('vezaraa_currency')) || CURRENCIES[0],
    language: JSON.parse(localStorage.getItem('vezaraa_language')) || LANGUAGES[0],
    currentPage: 'home',
    currentProduct: null,
    searchQuery: '',
    searchResults: [],
    filters: {
        category: 'all',
        priceRange: [0, 5000],
        sizes: [],
        colors: [],
        sortBy: 'featured',
    },
    toast: null,
    isCartOpen: false,
    isSearchOpen: false,
    isMegaMenuOpen: false,
    megaMenuCategory: null,
    isLoginOpen: false,
    isNewsletterOpen: false,
    isCheckoutOpen: false,
    checkoutStep: 1,
    couponCode: '',
    couponApplied: false,
    couponDiscount: 0,
    shippingMethod: 'standard',
    paymentMethod: 'card',
    heroSlide: 0,
    productImageIndex: 0,
    selectedColor: null,
    selectedSize: null,
    is360View: false,
    isZoomed: false,
    zoomPosition: { x: 0, y: 0 },
    activeTab: 'description',
    mobileMenuOpen: false,
    isLoading: false,
    scrollY: 0,
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatPrice = (price) => {
    return `${State.currency.symbol}${price.toLocaleString()}`;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const showToast = (message, type = 'success') => {
    State.toast = { message, type, id: generateId() };
    renderToast();
    setTimeout(() => {
        State.toast = null;
        renderToast();
    }, 3000);
};

const saveState = () => {
    localStorage.setItem('vezaraa_cart', JSON.stringify(State.cart));
    localStorage.setItem('vezaraa_wishlist', JSON.stringify(State.wishlist));
    localStorage.setItem('vezaraa_user', JSON.stringify(State.user));
    localStorage.setItem('vezaraa_orders', JSON.stringify(State.orders));
    localStorage.setItem('vezaraa_addresses', JSON.stringify(State.addresses));
    localStorage.setItem('vezaraa_darkMode', State.darkMode);
    localStorage.setItem('vezaraa_currency', JSON.stringify(State.currency));
    localStorage.setItem('vezaraa_language', JSON.stringify(State.language));
};

const getCartTotal = () => {
    return State.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

const getCartCount = () => {
    return State.cart.reduce((count, item) => count + item.quantity, 0);
};

const getDiscountedTotal = () => {
    const total = getCartTotal();
    if (State.couponApplied) {
        return total * (1 - State.couponDiscount);
    }
    return total;
};

const getShippingCost = () => {
    const method = SHIPPING_OPTIONS.find(s => s.id === State.shippingMethod);
    if (!method) return 0;
    if (getCartTotal() >= method.minOrder && method.price === 0) return 0;
    return method.price;
};

const getFinalTotal = () => {
    return getDiscountedTotal() + getShippingCost();
};

const getTax = () => {
    return getDiscountedTotal() * 0.08;
};

const isInWishlist = (productId) => {
    return State.wishlist.some(item => item.id === productId);
};

const getProductById = (id) => PRODUCTS.find(p => p.id === id);

const getFilteredProducts = () => {
    let filtered = [...PRODUCTS];
    
    if (State.filters.category !== 'all') {
        if (['men', 'women'].includes(State.filters.category)) {
            filtered = filtered.filter(p => p.category === State.filters.category);
        } else if (State.filters.category === 'new-arrivals') {
            filtered = filtered.filter(p => p.isNew);
        } else if (State.filters.category === 'limited') {
            filtered = filtered.filter(p => p.isLimited);
        }
    }
    
    if (State.searchQuery) {
        const query = State.searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            p.subcategory.toLowerCase().includes(query)
        );
    }
    
    filtered = filtered.filter(p => 
        p.price >= State.filters.priceRange[0] && 
        p.price <= State.filters.priceRange[1]
    );
    
    if (State.filters.sizes.length > 0) {
        filtered = filtered.filter(p => 
            p.sizesAvailable.some(s => State.filters.sizes.includes(s))
        );
    }
    
    switch (State.filters.sortBy) {
        case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
        case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
        case 'rating': filtered.sort((a, b) => b.rating - a.rating); break;
        case 'newest': filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
        default: break;
    }
    
    return filtered;
};

const getRecommendedProducts = (currentProductId, count = 4) => {
    const current = getProductById(currentProductId);
    if (!current) return PRODUCTS.slice(0, count);
    
    return PRODUCTS
        .filter(p => p.id !== currentProductId && p.category === current.category)
        .slice(0, count);
};

// ============================================
// CART OPERATIONS
// ============================================
const addToCart = (product, color, size, quantity = 1) => {
    const existingItem = State.cart.find(item => 
        item.id === product.id && item.color === color && item.size === size
    );
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        State.cart.push({
            cartId: generateId(),
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0],
            color,
            size,
            quantity,
        });
    }
    
    saveState();
    showToast(`${product.name} added to cart`);
    renderCart();
    renderCartIcon();
};

const removeFromCart = (cartId) => {
    State.cart = State.cart.filter(item => item.cartId !== cartId);
    saveState();
    renderCart();
    renderCartIcon();
};

const updateCartQuantity = (cartId, quantity) => {
    const item = State.cart.find(item => item.cartId === cartId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(cartId);
        } else {
            item.quantity = quantity;
            saveState();
            renderCart();
            renderCartIcon();
        }
    }
};

// ============================================
// WISHLIST OPERATIONS
// ============================================
const toggleWishlist = (product) => {
    const index = State.wishlist.findIndex(item => item.id === product.id);
    if (index >= 0) {
        State.wishlist.splice(index, 1);
        showToast('Removed from wishlist', 'info');
    } else {
        State.wishlist.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0],
            category: product.category,
        });
        showToast('Added to wishlist', 'success');
    }
    saveState();
    renderWishlistIcon();
    if (State.currentPage === 'wishlist') renderWishlistPage();
};

// ============================================
// COUPON SYSTEM
// ============================================
const applyCoupon = (code) => {
    const coupons = {
        'VEZARA20': 0.20,
        'LUXURY15': 0.15,
        'WELCOME10': 0.10,
        'VIP25': 0.25,
    };
    
    if (coupons[code.toUpperCase()]) {
        State.couponCode = code.toUpperCase();
        State.couponApplied = true;
        State.couponDiscount = coupons[code.toUpperCase()];
        showToast(`Coupon applied! ${Math.round(State.couponDiscount * 100)}% off`);
        return true;
    } else {
        showToast('Invalid coupon code', 'error');
        return false;
    }
};

const removeCoupon = () => {
    State.couponCode = '';
    State.couponApplied = false;
    State.couponDiscount = 0;
};

// ============================================
// ORDER SIMULATION
// ============================================
const placeOrder = (shippingDetails) => {
    const order = {
        id: `VZR-${Date.now()}`,
        date: new Date().toISOString(),
        items: [...State.cart],
        total: getFinalTotal(),
        shipping: getShippingCost(),
        tax: getTax(),
        discount: State.couponApplied ? getCartTotal() * State.couponDiscount : 0,
        status: 'confirmed',
        shippingDetails,
        trackingNumber: `TRK${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
    };
    
    State.orders.unshift(order);
    State.cart = [];
    removeCoupon();
    saveState();
    
    return order;
};

// ============================================
// RENDER FUNCTIONS
// ============================================
const app = document.getElementById('app');

const renderApp = () => {
    if (State.darkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    app.innerHTML = `
        ${renderNavbar()}
        ${renderMegaMenu()}
        ${renderSearchOverlay()}
        ${renderCartDrawer()}
        ${renderLoginModal()}
        ${renderNewsletterPopup()}
        ${renderToast()}
        ${renderMobileMenu()}
        <main id="main-content" class="min-h-screen">
            ${renderCurrentPage()}
        </main>
        ${renderFooter()}
    `;
    
    attachEventListeners();
    initAnimations();
    lucide.createIcons();
};

const renderNavbar = () => {
    const isScrolled = State.scrollY > 50;
    
    return `
        <nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-midnight-navy/95 backdrop-blur-xl shadow-lg' : 'bg-transparent'}">
            <div class="w-full px-4 sm:px-6 lg:px-12">
                <div class="flex items-center justify-between h-16 lg:h-20">
                    <button id="mobile-menu-btn" class="lg:hidden text-white/90 hover:text-gold transition-colors">
                        <i data-lucide="menu" class="w-6 h-6"></i>
                    </button>
                    
                    <a href="#" class="flex items-center gap-2 group" onclick="navigateTo('home'); return false;">
                        <div class="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                            <span class="font-display font-bold text-midnight-navy text-sm lg:text-base">V</span>
                        </div>
                        <span class="font-display text-xl lg:text-2xl font-bold text-white tracking-wider group-hover:text-gold transition-colors">VEZARAA</span>
                    </a>
                    
                    <div class="hidden lg:flex items-center gap-8">
                        <div class="relative group">
                            <button class="nav-link text-white/80 hover:text-gold font-medium text-sm tracking-wide transition-colors flex items-center gap-1 py-2"
                                    onmouseenter="showMegaMenu('clothing')" onmouseleave="hideMegaMenu()">
                                CLOTHING
                                <i data-lucide="chevron-down" class="w-3 h-3"></i>
                            </button>
                        </div>
                        <div class="relative group">
                            <button class="nav-link text-white/80 hover:text-gold font-medium text-sm tracking-wide transition-colors flex items-center gap-1 py-2"
                                    onmouseenter="showMegaMenu('footwear')" onmouseleave="hideMegaMenu()">
                                FOOTWEAR
                                <i data-lucide="chevron-down" class="w-3 h-3"></i>
                            </button>
                        </div>
                        <div class="relative group">
                            <button class="nav-link text-white/80 hover:text-gold font-medium text-sm tracking-wide transition-colors flex items-center gap-1 py-2"
                                    onmouseenter="showMegaMenu('accessories')" onmouseleave="hideMegaMenu()">
                                ACCESSORIES
                                <i data-lucide="chevron-down" class="w-3 h-3"></i>
                            </button>
                        </div>
                        <a href="#" class="nav-link text-white/80 hover:text-gold font-medium text-sm tracking-wide transition-colors py-2"
                           onclick="navigateTo('shop', {category:'new-arrivals'}); return false;">
                            NEW ARRIVALS
                        </a>
                        <a href="#" class="nav-link text-white/80 hover:text-gold font-medium text-sm tracking-wide transition-colors py-2"
                           onclick="navigateTo('shop', {category:'limited'}); return false;">
                            LIMITED EDITION
                        </a>
                    </div>
                    
                    <div class="flex items-center gap-3 lg:gap-5">
                        <button id="search-btn" class="text-white/80 hover:text-gold transition-colors p-2" onclick="toggleSearch()">
                            <i data-lucide="search" class="w-5 h-5"></i>
                        </button>
                        
                        <button id="wishlist-btn" class="text-white/80 hover:text-gold transition-colors p-2 relative" onclick="navigateTo('wishlist'); return false;">
                            <i data-lucide="heart" class="w-5 h-5"></i>
                            ${State.wishlist.length > 0 ? `<span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold text-midnight-navy text-[10px] font-bold rounded-full flex items-center justify-center">${State.wishlist.length}</span>` : ''}
                        </button>
                        
                        <button id="cart-btn" class="text-white/80 hover:text-gold transition-colors p-2 relative" onclick="toggleCart()">
                            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                            ${getCartCount() > 0 ? `<span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold text-midnight-navy text-[10px] font-bold rounded-full flex items-center justify-center">${getCartCount()}</span>` : ''}
                        </button>
                        
                        <button id="account-btn" class="text-white/80 hover:text-gold transition-colors p-2" onclick="toggleLogin()">
                            <i data-lucide="user" class="w-5 h-5"></i>
                        </button>
                        
                        <button id="theme-btn" class="text-white/80 hover:text-gold transition-colors p-2 hidden lg:block" onclick="toggleDarkMode()">
                            <i data-lucide="${State.darkMode ? 'sun' : 'moon'}" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    `;
};

const renderMegaMenu = () => {
    const category = CATEGORIES.find(c => c.id === State.megaMenuCategory);
    if (!category) return '';
    
    return `
        <div id="mega-menu" class="mega-menu ${State.isMegaMenuOpen ? 'visible-menu' : 'hidden-menu'} fixed top-16 lg:top-20 left-0 right-0 z-40 bg-midnight-navy/95 backdrop-blur-xl border-t border-white/5"
             onmouseenter="keepMegaMenuOpen()" onmouseleave="hideMegaMenu()">
            <div class="w-full px-4 sm:px-6 lg:px-12 py-8">
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    <div class="col-span-2 lg:col-span-1">
                        <h3 class="font-display text-lg font-semibold text-white mb-4">${category.name}</h3>
                        <ul class="space-y-3">
                            ${category.subcategories.map(sub => `
                                <li>
                                    <a href="#" class="text-white/60 hover:text-gold transition-colors text-sm"
                                       onclick="navigateTo('shop', {subcategory:'${sub.id}'}); hideMegaMenu(); return false;">
                                        ${sub.name}
                                    </a>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="col-span-2 lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4">
                        ${PRODUCTS.filter(p => p.subcategory === category.subcategories[0]?.id).slice(0, 3).map(product => `
                            <a href="#" class="group flex gap-3 items-center p-3 rounded-lg hover:bg-white/5 transition-colors"
                               onclick="navigateTo('product', {id:'${product.id}'}); hideMegaMenu(); return false;">
                                <img src="${product.images[0]}" alt="${product.name}" class="w-16 h-20 object-cover rounded-md">
                                <div>
                                    <p class="text-white text-sm font-medium group-hover:text-gold transition-colors">${product.name}</p>
                                    <p class="text-gold text-sm">${formatPrice(product.price)}</p>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
};

const renderSearchOverlay = () => {
    return `
        <div id="search-overlay" class="search-overlay ${State.isSearchOpen ? 'visible-search' : 'hidden-search'} fixed inset-0 z-[60] bg-midnight-navy/98 backdrop-blur-xl flex flex-col">
            <div class="w-full px-4 sm:px-6 lg:px-12 pt-6">
                <div class="flex items-center justify-between mb-8">
                    <div class="flex-1 max-w-2xl">
                        <div class="relative">
                            <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"></i>
                            <input type="text" id="search-input" 
                                   class="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors text-lg"
                                   placeholder="Search for products, collections, styles..."
                                   value="${State.searchQuery}"
                                   oninput="handleSearch(this.value)">
                        </div>
                    </div>
                    <button class="ml-4 text-white/60 hover:text-white transition-colors p-2" onclick="toggleSearch()">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                
                <div id="search-results" class="pb-8">
                    ${State.searchQuery ? renderSearchResults() : renderSearchSuggestions()}
                </div>
            </div>
        </div>
    `;
};

const renderSearchSuggestions = () => {
    return `
        <div class="animate-fade-in">
            <h3 class="text-white/40 text-sm uppercase tracking-wider mb-4">Popular Searches</h3>
            <div class="flex flex-wrap gap-2">
                ${['Velvet Blazer', 'Silk Dress', 'Sneakers', 'Handbag', 'Overcoat', 'Watch', 'Cashmere', 'Evening Gown'].map(term => `
                    <button class="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full text-sm transition-colors"
                            onclick="document.getElementById('search-input').value='${term}'; handleSearch('${term}')">
                        ${term}
                    </button>
                `).join('')}
            </div>
            
            <h3 class="text-white/40 text-sm uppercase tracking-wider mt-8 mb-4">Trending Now</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                ${PRODUCTS.slice(0, 4).map(product => `
                    <a href="#" class="group" onclick="navigateTo('product', {id:'${product.id}'}); toggleSearch(); return false;">
                        <div class="img-zoom-container rounded-lg overflow-hidden mb-2">
                            <img src="${product.images[0]}" alt="${product.name}" class="w-full h-48 object-cover">
                        </div>
                        <p class="text-white text-sm group-hover:text-gold transition-colors">${product.name}</p>
                        <p class="text-gold text-sm">${formatPrice(product.price)}</p>
                    </a>
                `).join('')}
            </div>
        </div>
    `;
};

const renderSearchResults = () => {
    const results = getFilteredProducts();
    
    if (results.length === 0) {
        return `
            <div class="text-center py-12">
                <i data-lucide="search-x" class="w-12 h-12 text-white/20 mx-auto mb-4"></i>
                <p class="text-white/40 text-lg">No products found for "${State.searchQuery}"</p>
                <p class="text-white/30 text-sm mt-2">Try different keywords or browse our collections</p>
            </div>
        `;
    }
    
    return `
        <div class="animate-fade-in">
            <p class="text-white/40 text-sm mb-4">${results.length} results found</p>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                ${results.map(product => renderProductCard(product)).join('')}
            </div>
        </div>
    `;
};
'''

with open(f"{base_dir}/app.js", "w") as f:
    f.write(app_js_part1)

print("app.js Part 1 created successfully!")
print(f"Size: {len(app_js_part1)} characters")
base_dir = "/mnt/agents/output/vezaraa"

# Part 2: Cart Drawer, Login Modal, Newsletter, Toast, Mobile Menu
app_js_part2 = '''
const renderCartDrawer = () => {
    return `
        <div id="cart-overlay" class="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm transition-opacity ${State.isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}" onclick="toggleCart()"></div>
        <div id="cart-drawer" class="cart-drawer ${State.isCartOpen ? 'open' : 'closed'} fixed top-0 right-0 bottom-0 w-full max-w-md z-[56] bg-midnight-navy shadow-2xl flex flex-col">
            <div class="flex items-center justify-between p-6 border-b border-white/10">
                <h2 class="font-display text-xl font-semibold text-white">Your Cart (${getCartCount()})</h2>
                <button class="text-white/60 hover:text-white transition-colors" onclick="toggleCart()">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                ${State.cart.length === 0 ? `
                    <div class="text-center py-12">
                        <i data-lucide="shopping-bag" class="w-16 h-16 text-white/10 mx-auto mb-4"></i>
                        <p class="text-white/40 text-lg mb-2">Your cart is empty</p>
                        <p class="text-white/30 text-sm mb-6">Discover our exclusive collections</p>
                        <button class="px-8 py-3 bg-gold text-midnight-navy font-semibold rounded-full hover:bg-gold-light transition-colors"
                                onclick="toggleCart(); navigateTo('shop');">
                            Start Shopping
                        </button>
                    </div>
                ` : `
                    <div class="space-y-6">
                        ${State.cart.map(item => `
                            <div class="flex gap-4 animate-fade-in">
                                <div class="w-20 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="text-white font-medium text-sm truncate">${item.name}</h4>
                                    <p class="text-white/50 text-xs mt-1">${item.color} / ${item.size}</p>
                                    <p class="text-gold text-sm font-semibold mt-1">${formatPrice(item.price)}</p>
                                    <div class="flex items-center gap-3 mt-2">
                                        <button class="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-gold hover:text-gold transition-colors"
                                                onclick="updateCartQuantity('${item.cartId}', ${item.quantity - 1})">
                                            <i data-lucide="minus" class="w-3 h-3"></i>
                                        </button>
                                        <span class="text-white text-sm w-6 text-center">${item.quantity}</span>
                                        <button class="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-gold hover:text-gold transition-colors"
                                                onclick="updateCartQuantity('${item.cartId}', ${item.quantity + 1})">
                                            <i data-lucide="plus" class="w-3 h-3"></i>
                                        </button>
                                        <button class="ml-auto text-white/30 hover:text-red-400 transition-colors" onclick="removeFromCart('${item.cartId}')">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
            
            ${State.cart.length > 0 ? `
                <div class="p-6 border-t border-white/10 space-y-4">
                    <div class="flex items-center gap-2">
                        <input type="text" id="cart-coupon" placeholder="Enter coupon code"
                               class="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold/50"
                               value="${State.couponCode}">
                        <button class="px-4 py-2.5 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors"
                                onclick="const code=document.getElementById('cart-coupon').value; if(code) applyCoupon(code); renderCart();">
                            Apply
                        </button>
                    </div>
                    ${State.couponApplied ? `
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gold">Discount (${Math.round(State.couponDiscount * 100)}%)</span>
                            <span class="text-gold">-${formatPrice(getCartTotal() * State.couponDiscount)}</span>
                        </div>
                    ` : ''}
                    <div class="flex items-center justify-between">
                        <span class="text-white/60 text-sm">Subtotal</span>
                        <span class="text-white font-semibold">${formatPrice(getCartTotal())}</span>
                    </div>
                    <button class="w-full py-4 bg-gold text-midnight-navy font-bold rounded-full hover:bg-gold-light transition-colors flex items-center justify-center gap-2"
                            onclick="toggleCart(); navigateTo('checkout');">
                        Checkout
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                    <button class="w-full py-3 text-white/60 text-sm hover:text-white transition-colors" onclick="toggleCart()">
                        Continue Shopping
                    </button>
                </div>
            ` : ''}
        </div>
    `;
};

const renderLoginModal = () => {
    return `
        <div id="login-overlay" class="modal-overlay fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm ${State.isLoginOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}" onclick="toggleLogin()"></div>
        <div id="login-modal" class="modal-content fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-full max-w-md ${State.isLoginOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}">
            <div class="bg-midnight-navy border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="font-display text-2xl font-bold text-white">${State.user ? 'Account' : 'Welcome Back'}</h2>
                    <button class="text-white/40 hover:text-white transition-colors" onclick="toggleLogin()">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                ${State.user ? `
                    <div class="space-y-4">
                        <div class="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                            <div class="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                                <i data-lucide="user" class="w-6 h-6 text-gold"></i>
                            </div>
                            <div>
                                <p class="text-white font-medium">${State.user.name}</p>
                                <p class="text-white/50 text-sm">${State.user.email}</p>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <button class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors text-left"
                                    onclick="toggleLogin(); navigateTo('account');">
                                <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                                Dashboard
                            </button>
                            <button class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors text-left"
                                    onclick="toggleLogin(); navigateTo('orders');">
                                <i data-lucide="package" class="w-5 h-5"></i>
                                Order History
                            </button>
                            <button class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors text-left"
                                    onclick="toggleLogin(); navigateTo('wishlist');">
                                <i data-lucide="heart" class="w-5 h-5"></i>
                                Wishlist
                            </button>
                            <button class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors text-left"
                                    onclick="toggleLogin(); navigateTo('addresses');">
                                <i data-lucide="map-pin" class="w-5 h-5"></i>
                                Addresses
                            </button>
                        </div>
                        <button class="w-full py-3 border border-white/20 text-white rounded-full hover:bg-white/5 transition-colors mt-4"
                                onclick="logout()">
                            Sign Out
                        </button>
                    </div>
                ` : `
                    <div id="login-form-container">
                        <div class="space-y-4">
                            <div>
                                <label class="text-white/60 text-sm mb-1 block">Email</label>
                                <input type="email" id="login-email" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/50"
                                       placeholder="your@email.com">
                            </div>
                            <div>
                                <label class="text-white/60 text-sm mb-1 block">Password</label>
                                <input type="password" id="login-password" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/50"
                                       placeholder="••••••••">
                            </div>
                            <button class="w-full py-3 bg-gold text-midnight-navy font-bold rounded-full hover:bg-gold-light transition-colors"
                                    onclick="handleLogin()">
                                Sign In
                            </button>
                            <div class="flex items-center justify-between text-sm">
                                <button class="text-white/50 hover:text-gold transition-colors">Forgot Password?</button>
                                <button class="text-gold hover:text-gold-light transition-colors" onclick="showSignupForm()">Create Account</button>
                            </div>
                        </div>
                        
                        <div class="mt-6 pt-6 border-t border-white/10">
                            <p class="text-white/40 text-sm text-center mb-4">Or continue with</p>
                            <div class="flex gap-3">
                                <button class="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                                    <i data-lucide="chrome" class="w-4 h-4"></i>
                                    Google
                                </button>
                                <button class="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                                    <i data-lucide="apple" class="w-4 h-4"></i>
                                    Apple
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div id="signup-form-container" class="hidden">
                        <div class="space-y-4">
                            <div>
                                <label class="text-white/60 text-sm mb-1 block">Full Name</label>
                                <input type="text" id="signup-name" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/50"
                                       placeholder="John Doe">
                            </div>
                            <div>
                                <label class="text-white/60 text-sm mb-1 block">Email</label>
                                <input type="email" id="signup-email" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/50"
                                       placeholder="your@email.com">
                            </div>
                            <div>
                                <label class="text-white/60 text-sm mb-1 block">Password</label>
                                <input type="password" id="signup-password" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/50"
                                       placeholder="••••••••">
                            </div>
                            <button class="w-full py-3 bg-gold text-midnight-navy font-bold rounded-full hover:bg-gold-light transition-colors"
                                    onclick="handleSignup()">
                                Create Account
                            </button>
                            <button class="w-full text-white/50 hover:text-gold text-sm transition-colors" onclick="showLoginForm()">
                                Already have an account? Sign In
                            </button>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;
};

const renderNewsletterPopup = () => {
    if (localStorage.getItem('vezaraa_newsletter_closed')) return '';
    
    return `
        <div id="newsletter-overlay" class="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm ${State.isNewsletterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity" onclick="closeNewsletter()"></div>
        <div id="newsletter-popup" class="newsletter-popup fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-full max-w-lg ${State.isNewsletterOpen ? 'visible-popup' : 'hidden-popup'}">
            <div class="relative bg-midnight-navy border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <button class="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-10" onclick="closeNewsletter()">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
                <div class="grid md:grid-cols-2">
                    <div class="hidden md:block">
                        <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80" alt="Fashion" class="w-full h-full object-cover">
                    </div>
                    <div class="p-8">
                        <div class="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mb-4">
                            <i data-lucide="mail" class="w-6 h-6 text-gold"></i>
                        </div>
                        <h3 class="font-display text-2xl font-bold text-white mb-2">Join the Inner Circle</h3>
                        <p class="text-white/60 text-sm mb-6">Subscribe for exclusive access to new collections, private sales, and VIP events.</p>
                        <div class="space-y-3">
                            <input type="email" id="newsletter-email" placeholder="Enter your email"
                                   class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/50">
                            <button class="w-full py-3 bg-gold text-midnight-navy font-bold rounded-full hover:bg-gold-light transition-colors"
                                    onclick="handleNewsletterSignup()">
                                Subscribe
                            </button>
                        </div>
                        <p class="text-white/30 text-xs mt-4">Get 15% off your first order. Unsubscribe anytime.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const renderToast = () => {
    if (!State.toast) return '<div id="toast-container"></div>';
    
    const colors = {
        success: 'bg-gold text-midnight-navy',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white',
    };
    
    const icons = {
        success: 'check-circle',
        error: 'alert-circle',
        info: 'info',
    };
    
    return `
        <div id="toast-container" class="fixed top-24 right-4 z-[80]">
            <div class="toast visible-toast ${colors[State.toast.type]} px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]">
                <i data-lucide="${icons[State.toast.type]}" class="w-5 h-5 flex-shrink-0"></i>
                <p class="font-medium text-sm">${State.toast.message}</p>
            </div>
        </div>
    `;
};

const renderMobileMenu = () => {
    return `
        <div id="mobile-menu-overlay" class="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm ${State.mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity lg:hidden" onclick="toggleMobileMenu()"></div>
        <div id="mobile-menu" class="fixed top-0 left-0 bottom-0 w-80 z-[46] bg-midnight-navy shadow-2xl transform transition-transform duration-300 lg:hidden ${State.mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}">
            <div class="p-6">
                <div class="flex items-center justify-between mb-8">
                    <span class="font-display text-xl font-bold text-white">Menu</span>
                    <button class="text-white/60 hover:text-white transition-colors" onclick="toggleMobileMenu()">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                
                <div class="space-y-1">
                    <a href="#" class="flex items-center gap-3 p-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-gold transition-colors"
                       onclick="navigateTo('shop', {category:'men'}); toggleMobileMenu(); return false;">
                        <i data-lucide="shirt" class="w-5 h-5"></i>
                        Men
                    </a>
                    <a href="#" class="flex items-center gap-3 p-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-gold transition-colors"
                       onclick="navigateTo('shop', {category:'women'}); toggleMobileMenu(); return false;">
                        <i data-lucide="sparkles" class="w-5 h-5"></i>
                        Women
                    </a>
                    <a href="#" class="flex items-center gap-3 p-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-gold transition-colors"
                       onclick="navigateTo('shop', {category:'new-arrivals'}); toggleMobileMenu(); return false;">
                        <i data-lucide="zap" class="w-5 h-5"></i>
                        New Arrivals
                    </a>
                    <a href="#" class="flex items-center gap-3 p-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-gold transition-colors"
                       onclick="navigateTo('shop', {category:'limited'}); toggleMobileMenu(); return false;">
                        <i data-lucide="crown" class="w-5 h-5"></i>
                        Limited Edition
                    </a>
                    <a href="#" class="flex items-center gap-3 p-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-gold transition-colors"
                       onclick="navigateTo('about'); toggleMobileMenu(); return false;">
                        <i data-lucide="info" class="w-5 h-5"></i>
                        About Us
                    </a>
                    <a href="#" class="flex items-center gap-3 p-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-gold transition-colors"
                       onclick="navigateTo('blog'); toggleMobileMenu(); return false;">
                        <i data-lucide="book-open" class="w-5 h-5"></i>
                        Journal
                    </a>
                    <a href="#" class="flex items-center gap-3 p-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-gold transition-colors"
                       onclick="navigateTo('contact'); toggleMobileMenu(); return false;">
                        <i data-lucide="mail" class="w-5 h-5"></i>
                        Contact
                    </a>
                </div>
                
                <div class="mt-8 pt-8 border-t border-white/10">
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-white/60 text-sm">Dark Mode</span>
                        <button class="w-12 h-6 rounded-full ${State.darkMode ? 'bg-gold' : 'bg-white/20'} relative transition-colors" onclick="toggleDarkMode()">
                            <div class="absolute top-0.5 ${State.darkMode ? 'right-0.5' : 'left-0.5'} w-5 h-5 rounded-full bg-white transition-all"></div>
                        </button>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-white/60 text-sm">Currency</span>
                        <select class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                                onchange="changeCurrency(this.value)">
                            ${CURRENCIES.map(c => `<option value="${c.code}" ${State.currency.code === c.code ? 'selected' : ''}>${c.code}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    `;
};
'''

with open(f"{base_dir}/app.js", "a") as f:
    f.write(app_js_part2)

print("app.js Part 2 created successfully!")
print(f"Size: {len(app_js_part2)} characters")
base_dir = "/mnt/agents/output/vezaraa"

# Part 3: Footer and Page Renderers (Home, Shop, Product)
app_js_part3 = '''
const renderFooter = () => {
    return `
        <footer class="bg-midnight-navy-dark border-t border-white/5">
            <div class="w-full px-4 sm:px-6 lg:px-12 py-16">
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
                    <div class="col-span-2 md:col-span-4 lg:col-span-1">
                        <div class="flex items-center gap-2 mb-4">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                                <span class="font-display font-bold text-midnight-navy text-sm">V</span>
                            </div>
                            <span class="font-display text-xl font-bold text-white tracking-wider">VEZARAA</span>
                        </div>
                        <p class="text-white/40 text-sm leading-relaxed mb-6">Redefining luxury fashion for the modern era. Where street culture meets haute couture.</p>
                        <div class="flex gap-3">
                            <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-gold hover:bg-white/10 transition-all">
                                <i data-lucide="instagram" class="w-4 h-4"></i>
                            </a>
                            <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-gold hover:bg-white/10 transition-all">
                                <i data-lucide="twitter" class="w-4 h-4"></i>
                            </a>
                            <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-gold hover:bg-white/10 transition-all">
                                <i data-lucide="facebook" class="w-4 h-4"></i>
                            </a>
                            <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-gold hover:bg-white/10 transition-all">
                                <i data-lucide="youtube" class="w-4 h-4"></i>
                            </a>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Shop</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('shop', {category:'men'}); return false;">Men</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('shop', {category:'women'}); return false;">Women</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('shop', {category:'new-arrivals'}); return false;">New Arrivals</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('shop', {category:'limited'}); return false;">Limited Edition</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('shop'); return false;">Sale</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Company</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('about'); return false;">About Us</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('careers'); return false;">Careers</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('press'); return false;">Press</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('sustainability'); return false;">Sustainability</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('blog'); return false;">Journal</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Support</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('contact'); return false;">Contact Us</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('faq'); return false;">FAQ</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('shipping'); return false;">Shipping</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('returns'); return false;">Returns</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('size-guide'); return false;">Size Guide</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Legal</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('privacy'); return false;">Privacy Policy</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('terms'); return false;">Terms of Service</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('cookies'); return false;">Cookie Policy</a></li>
                            <li><a href="#" class="text-white/40 hover:text-gold text-sm transition-colors" onclick="navigateTo('accessibility'); return false;">Accessibility</a></li>
                        </ul>
                    </div>
                </div>
                
                <div class="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p class="text-white/30 text-sm">© 2026 Vezaraa. All rights reserved.</p>
                    <div class="flex items-center gap-4">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" class="h-6 opacity-40">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" class="h-6 opacity-40">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" class="h-6 opacity-40">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple Pay" class="h-5 opacity-40 invert">
                    </div>
                </div>
            </div>
        </footer>
    `;
};

const renderCurrentPage = () => {
    switch (State.currentPage) {
        case 'home': return renderHomePage();
        case 'shop': return renderShopPage();
        case 'product': return renderProductPage();
        case 'cart': return renderCartPage();
        case 'checkout': return renderCheckoutPage();
        case 'wishlist': return renderWishlistPage();
        case 'account': return renderAccountPage();
        case 'orders': return renderOrdersPage();
        case 'about': return renderAboutPage();
        case 'blog': return renderBlogPage();
        case 'contact': return renderContactPage();
        case 'faq': return renderFaqPage();
        case 'returns': return renderReturnsPage();
        default: return renderHomePage();
    }
};

// ============================================
// HOME PAGE
// ============================================
const renderHomePage = () => {
    const slide = HERO_SLIDES[State.heroSlide];
    
    return `
        <div class="page-transition page-active">
            <!-- Hero Section -->
            <section class="relative h-screen min-h-[600px] overflow-hidden">
                <div class="absolute inset-0">
                    <img src="${slide.image}" alt="${slide.title}" class="w-full h-full object-cover scale-105 animate-[pulse_20s_ease-in-out_infinite]">
                    <div class="hero-overlay absolute inset-0"></div>
                </div>
                
                <div class="relative z-10 h-full flex items-center">
                    <div class="w-full px-4 sm:px-6 lg:px-12">
                        <div class="max-w-3xl">
                            <p class="text-gold text-sm uppercase tracking-[0.3em] mb-4 animate-slide-down" style="animation-delay: 0.2s">${slide.subtitle}</p>
                            <h1 class="font-display text-5xl sm:text-6xl lg:text-8xl font-bold text-white leading-tight mb-6 animate-slide-up" style="animation-delay: 0.4s">
                                ${slide.title}
                            </h1>
                            <p class="text-white/70 text-lg mb-8 max-w-lg animate-slide-up" style="animation-delay: 0.6s">
                                Experience the pinnacle of luxury streetwear. Crafted for those who demand excellence.
                            </p>
                            <div class="flex flex-wrap gap-4 animate-slide-up" style="animation-delay: 0.8s">
                                <button class="px-8 py-4 bg-gold text-midnight-navy font-bold rounded-full hover:bg-gold-light transition-all hover:scale-105 flex items-center gap-2"
                                        onclick="navigateTo('shop')">
                                    ${slide.cta}
                                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                                </button>
                                <button class="px-8 py-4 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all"
                                        onclick="navigateTo('shop', {category:'new-arrivals'})">
                                    View Lookbook
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Slide Indicators -->
                <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-3">
                    ${HERO_SLIDES.map((_, i) => `
                        <button class="w-12 h-1 rounded-full transition-all ${i === State.heroSlide ? 'bg-gold' : 'bg-white/30 hover:bg-white/50'}"
                                onclick="setHeroSlide(${i})"></button>
                    `).join('')}
                </div>
                
                <!-- Scroll Indicator -->
                <div class="absolute bottom-8 right-8 z-10 hidden lg:block">
                    <div class="flex flex-col items-center gap-2 text-white/40">
                        <span class="text-xs uppercase tracking-widest rotate-90 origin-center translate-y-8">Scroll</span>
                        <div class="w-px h-16 bg-white/20 relative overflow-hidden">
                            <div class="w-full h-4 bg-gold absolute animate-[slideDown_2s_ease-in-out_infinite]"></div>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- Featured Collections -->
            <section class="py-20 lg:py-32 bg-platinum dark:bg-midnight-navy-dark">
                <div class="w-full px-4 sm:px-6 lg:px-12">
                    <div class="text-center mb-16">
                        <p class="text-gold text-sm uppercase tracking-[0.3em] mb-3">Collections</p>
                        <h2 class="font-display text-4xl lg:text-5xl font-bold text-midnight-navy dark:text-white mb-4">Curated For You</h2>
                        <p class="text-midnight-navy/60 dark:text-white/60 max-w-xl mx-auto">Explore our carefully curated collections, each designed to elevate your personal style.</p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        ${COLLECTIONS.map((collection, i) => `
                            <a href="#" class="collection-card group relative h-[500px] lg:h-[600px] rounded-2xl overflow-hidden"
                               onclick="navigateTo('shop', {category:'${collection.id}'}); return false;">
                                <img src="${collection.image}" alt="${collection.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                                <div class="absolute inset-0 bg-gradient-to-t from-midnight-navy/90 via-midnight-navy/30 to-transparent"></div>
                                <div class="card-overlay absolute inset-0 bg-gold/10"></div>
                                <div class="absolute bottom-0 left-0 right-0 p-6">
                                    <p class="text-gold text-xs uppercase tracking-widest mb-2">${collection.subtitle}</p>
                                    <h3 class="font-display text-2xl lg:text-3xl font-bold text-white mb-2">${collection.name}</h3>
                                    <p class="text-white/60 text-sm mb-4 line-clamp-2">${collection.description}</p>
                                    <div class="flex items-center gap-2 text-white group-hover:text-gold transition-colors">
                                        <span class="text-sm font-medium">Explore ${collection.itemCount} Items</span>
                                        <i data-lucide="arrow-right" class="w-4 h-4 transform group-hover:translate-x-1 transition-transform"></i>
                                    </div>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </section>
            
            <!-- Featured Products -->
            <section class="py-20 lg:py-32 bg-white dark:bg-midnight-navy">
                <div class="w-full px-4 sm:px-6 lg:px-12">
                    <div class="flex items-end justify-between mb-12">
                        <div>
                            <p class="text-gold text-sm uppercase tracking-[0.3em] mb-3">Trending Now</p>
                            <h2 class="font-display text-4xl lg:text-5xl font-bold text-midnight-navy dark:text-white">Best Sellers</h2>
                        </div>
                        <a href="#" class="hidden md:flex items-center gap-2 text-midnight-navy dark:text-white hover:text-gold transition-colors"
                           onclick="navigateTo('shop'); return false;">
                            View All
                            <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </a>
                    </div>
                    
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        ${PRODUCTS.filter(p => p.tags.includes('bestseller')).slice(0, 4).map(product => renderProductCard(product)).join('')}
                    </div>
                </div>
            </section>
            
            <!-- Brand Story -->
            <section class="py-20 lg:py-32 bg-midnight-navy relative overflow-hidden">
                <div class="absolute top-0 right-0 w-1/2 h-full opacity-10">
                    <img src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&q=80" alt="Atelier" class="w-full h-full object-cover">
                </div>
                <div class="w-full px-4 sm:px-6 lg:px-12 relative z-10">
                    <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div>
                            <p class="text-gold text-sm uppercase tracking-[0.3em] mb-3">Our Story</p>
                            <h2 class="font-display text-4xl lg:text-5xl font-bold text-white mb-6">Where Milan Meets the Streets</h2>
                            <p class="text-white/60 text-lg leading-relaxed mb-6">
                                Founded in the heart of Milan, Vezaraa was born from a vision to bridge the gap between haute couture and urban street culture. 
                                Every piece is a testament to Italian craftsmanship, modern innovation, and uncompromising quality.
                            </p>
                            <p class="text-white/60 text-lg leading-relaxed mb-8">
                                Our atelier brings together master artisans and forward-thinking designers to create fashion that transcends trends and defines eras.
                            </p>
                            <div class="flex gap-8 mb-8">
                                <div>
                                    <p class="font-display text-3xl font-bold text-gold">120+</p>
                                    <p class="text-white/40 text-sm">Countries</p>
                                </div>
                                <div>
                                    <p class="font-display text-3xl font-bold text-gold">50K+</p>
                                    <p class="text-white/40 text-sm">Happy Clients</p>
                                </div>
                                <div>
                                    <p class="font-display text-3xl font-bold text-gold">15</p>
                                    <p class="text-white/40 text-sm">Design Awards</p>
                                </div>
                            </div>
                            <button class="px-8 py-4 border border-gold text-gold font-semibold rounded-full hover:bg-gold hover:text-midnight-navy transition-all"
                                    onclick="navigateTo('about')">
                                Discover Our Story
                            </button>
                        </div>
                        <div class="relative">
                            <div class="grid grid-cols-2 gap-4">
                                <img src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80" alt="Fashion" class="rounded-2xl w-full h-64 object-cover">
                                <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80" alt="Fashion" class="rounded-2xl w-full h-64 object-cover mt-8">
                                <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80" alt="Fashion" class="rounded-2xl w-full h-64 object-cover -mt-8">
                                <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80" alt="Fashion" class="rounded-2xl w-full h-64 object-cover">
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- Influencer Showcase -->
            <section class="py-20 lg:py-32 bg-platinum dark:bg-midnight-navy-dark">
                <div class="w-full px-4 sm:px-6 lg:px-12">
                    <div class="text-center mb-16">
                        <p class="text-gold text-sm uppercase tracking-[0.3em] mb-3">Voices</p>
                        <h2 class="font-display text-4xl lg:text-5xl font-bold text-midnight-navy dark:text-white mb-4">What They Say</h2>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-8">
                        ${INFLUENCERS.map(influencer => `
                            <div class="bg-white dark:bg-midnight-navy rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                                <div class="flex items-center gap-4 mb-6">
                                    <img src="${influencer.image}" alt="${influencer.name}" class="w-14 h-14 rounded-full object-cover">
                                    <div>
                                        <h4 class="text-midnight-navy dark:text-white font-semibold">${influencer.name}</h4>
                                        <p class="text-midnight-navy/50 dark:text-white/50 text-sm">${influencer.role}</p>
                                    </div>
                                </div>
                                <div class="relative">
                                    <i data-lucide="quote" class="w-8 h-8 text-gold/20 absolute -top-2 -left-2"></i>
                                    <p class="text-midnight-navy/70 dark:text-white/70 text-sm leading-relaxed pl-4">${influencer.quote}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
            
            <!-- New Arrivals -->
            <section class="py-20 lg:py-32 bg-white dark:bg-midnight-navy">
                <div class="w-full px-4 sm:px-6 lg:px-12">
                    <div class="flex items-end justify-between mb-12">
                        <div>
                            <p class="text-gold text-sm uppercase tracking-[0.3em] mb-3">Just Dropped</p>
                            <h2 class="font-display text-4xl lg:text-5xl font-bold text-midnight-navy dark:text-white">New Arrivals</h2>
                        </div>
                        <a href="#" class="hidden md:flex items-center gap-2 text-midnight-navy dark:text-white hover:text-gold transition-colors"
                           onclick="navigateTo('shop', {category:'new-arrivals'}); return false;">
                            View All
                            <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </a>
                    </div>
                    
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        ${PRODUCTS.filter(p => p.isNew).slice(0, 4).map(product => renderProductCard(product)).join('')}
                    </div>
                </div>
            </section>
            
            <!-- Journal Section -->
            <section class="py-20 lg:py-32 bg-platinum dark:bg-midnight-navy-dark">
                <div class="w-full px-4 sm:px-6 lg:px-12">
                    <div class="flex items-end justify-between mb-12">
                        <div>
                            <p class="text-gold text-sm uppercase tracking-[0.3em] mb-3">Journal</p>
                            <h2 class="font-display text-4xl lg:text-5xl font-bold text-midnight-navy dark:text-white">Latest Stories</h2>
                        </div>
                        <a href="#" class="hidden md:flex items-center gap-2 text-midnight-navy dark:text-white hover:text-gold transition-colors"
                           onclick="navigateTo('blog'); return false;">
                            View All
                            <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </a>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-8">
                        ${BLOG_POSTS.map(post => `
                            <a href="#" class="group" onclick="navigateTo('blog'); return false;">
                                <div class="img-zoom-container rounded-2xl overflow-hidden mb-4">
                                    <img src="${post.image}" alt="${post.title}" class="w-full h-64 object-cover">
                                </div>
                                <div class="flex items-center gap-3 mb-2">
                                    <span class="text-gold text-xs uppercase tracking-wider font-medium">${post.category}</span>
                                    <span class="text-midnight-navy/30 dark:text-white/30">|</span>
                                    <span class="text-midnight-navy/40 dark:text-white/40 text-xs">${post.date}</span>
                                </div>
                                <h3 class="font-display text-xl font-semibold text-midnight-navy dark:text-white group-hover:text-gold transition-colors mb-2">${post.title}</h3>
                                <p class="text-midnight-navy/60 dark:text-white/60 text-sm line-clamp-2">${post.excerpt}</p>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </section>
            
            <!-- Newsletter Section -->
            <section class="py-20 lg:py-32 bg-midnight-navy relative overflow-hidden">
                <div class="absolute inset-0 opacity-20">
                    <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&q=80" alt="" class="w-full h-full object-cover">
                </div>
                <div class="w-full px-4 sm:px-6 lg:px-12 relative z-10">
                    <div class="max-w-2xl mx-auto text-center">
                        <p class="text-gold text-sm uppercase tracking-[0.3em] mb-3">Stay Connected</p>
                        <h2 class="font-display text-4xl lg:text-5xl font-bold text-white mb-4">Join the Inner Circle</h2>
                        <p class="text-white/60 mb-8">Subscribe for exclusive access to new collections, private sales, and VIP events. Get 15% off your first order.</p>
                        <div class="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <input type="email" placeholder="Enter your email" 
                                   class="flex-1 bg-white/10 border border-white/20 rounded-full px-6 py-4 text-white placeholder-white/40 focus:outline-none focus:border-gold/50">
                            <button class="px-8 py-4 bg-gold text-midnight-navy font-bold rounded-full hover:bg-gold-light transition-colors whitespace-nowrap"
                                    onclick="handleNewsletterSignup()">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `;
};

const renderProductCard = (product) => {
    const inWishlist = isInWishlist(product.id);
    
    return `
        <div class="product-card group">
            <div class="relative rounded-xl overflow-hidden bg-platinum dark:bg-midnight-navy-light mb-3">
                <a href="#" onclick="navigateTo('product', {id:'${product.id}'}); return false;">
                    <div class="img-zoom-container">
                        <img src="${product.images[0]}" alt="${product.name}" class="w-full h-72 lg:h-80 object-cover">
                    </div>
                </a>
                
                ${product.badge ? `
                    <div class="absolute top-3 left-3">
                        <span class="px-3 py-1 bg-gold text-midnight-navy text-xs font-bold rounded-full">${product.badge}</span>
                    </div>
                ` : ''}
                
                ${product.originalPrice ? `
                    <div class="absolute top-3 right-3">
                        <span class="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">-${Math.round((1 - product.price/product.originalPrice) * 100)}%</span>
                    </div>
                ` : ''}
                
                <div class="quick-actions absolute bottom-3 left-3 right-3 flex gap-2">
                    <button class="flex-1 py-2.5 bg-white/90 backdrop-blur-sm text-midnight-navy text-sm font-medium rounded-lg hover:bg-gold hover:text-midnight-navy transition-colors"
                            onclick="navigateTo('product', {id:'${product.id}'})">
                        Quick View
                    </button>
                    <button class="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-midnight-navy hover:bg-gold hover:text-midnight-navy transition-colors"
                            onclick="toggleWishlist(getProductById('${product.id}'))">
                        <i data-lucide="${inWishlist ? 'heart' : 'heart'}" class="w-4 h-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}"></i>
                    </button>
                </div>
            </div>
            
            <a href="#" onclick="navigateTo('product', {id:'${product.id}'}); return false;">
                <h3 class="text-midnight-navy dark:text-white font-medium text-sm group-hover:text-gold transition-colors mb-1">${product.name}</h3>
            </a>
            <div class="flex items-center gap-2">
                <span class="text-gold font-semibold">${formatPrice(product.price)}</span>
                ${product.originalPrice ? `<span class="text-midnight-navy/40 dark:text-white/40 text-sm line-through">${formatPrice(product.originalPrice)}</span>` : ''}
            </div>
            <div class="flex items-center gap-1 mt-1">
                ${Array(5).fill(0).map((_, i) => `
                    <i data-lucide="star" class="w-3 h-3 ${i < Math.floor(product.rating) ? 'text-gold fill-gold' : 'text-midnight-navy/20 dark:text-white/20'}"></i>
                `).join('')}
                <span class="text-midnight-navy/40 dark:text-white/40 text-xs ml-1">(${product.reviewCount})</span>
            </div>
        </div>
    `;
};
'''

with open(f"{base_dir}/app.js", "a") as f:
    f.write(app_js_part3)

print("app.js Part 3 created successfully!")
print(f"Size: {len(app_js_part3)} characters")
