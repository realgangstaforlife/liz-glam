/**
 * LizGlam Beauty Platform - Main Frontend App Controller
 */

class LizGlamApp {
  constructor() {
    this.products = [];
    this.services = [];
    this.combos = [];
    this.currentCategory = 'all';
    this.init();
  }

  async init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.bindEvents();
      this.loadCatalogData();
    });
  }

  bindEvents() {
    // Mobile Nav Toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    if (mobileToggle && navLinks) {
      mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
      });
    }

    // Cart Drawer Toggle
    const cartToggleBtns = document.querySelectorAll('.cart-toggle-btn');
    cartToggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.cartManager.openDrawer();
      });
    });

    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartOverlay = document.getElementById('cartOverlay');
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => window.cartManager.closeDrawer());
    if (cartOverlay) cartOverlay.addEventListener('click', () => window.cartManager.closeDrawer());

    // Search Input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterAndRenderProducts(e.target.value);
      });
    }
  }

  async loadCatalogData() {
    try {
      const [prodRes, servRes, comboRes] = await Promise.all([
        fetch(`${API_URL}?action=getProducts`).then(r => r.json()).catch(() => ({ products: [] })),
        fetch(`${API_URL}?action=getServices`).then(r => r.json()).catch(() => ({ services: [] })),
        fetch(`${API_URL}?action=getCombos`).then(r => r.json()).catch(() => ({ combos: [] }))
      ]);

      if (prodRes.products) this.products = prodRes.products;
      if (servRes.services) this.services = servRes.services;
      if (comboRes.combos) this.combos = comboRes.combos;

      this.renderProducts();
      this.renderServices();
      this.renderCombos();
    } catch (err) {
      console.error('Error loading catalog data:', err);
    }
  }

  setCategory(category) {
    this.currentCategory = category;
    
    // Update category pills UI
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
      if (pill.dataset.category === category) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    this.filterAndRenderProducts();
  }

  filterAndRenderProducts(searchQuery = '') {
    let filtered = [...this.products];
    
    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(p => p.category.toLowerCase() === this.currentCategory.toLowerCase());
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    this.renderProducts(filtered);
  }

  renderProducts(list = this.products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <i class="bi bi-search" style="font-size: 2.5rem; color: var(--rose-gold); display: block; margin-bottom: 1rem;"></i>
          <p style="font-size: 1.1rem;">No encontramos productos en esta categoría.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(product => `
      <div class="product-card">
        <div class="product-img-wrapper">
          <img src="${product.image_url}" alt="${product.name}" class="product-img" loading="lazy">
          <span class="product-badge">${product.category}</span>
        </div>
        <div class="product-content">
          <div class="product-category">LIZGLAM BEAUTY</div>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-desc">${product.description}</p>
          <div class="product-price-row">
            <div class="product-price">${formatCOP(product.price)}</div>
            <button onclick="window.lizGlamApp.addToCart('${product.id}', 'product')" class="btn btn-sm btn-primary">
              <i class="bi bi-bag-plus"></i> Agregar
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    if (this.services.length === 0) return;

    grid.innerHTML = this.services.map(service => `
      <div class="service-card">
        <img src="${service.image_url}" alt="${service.name}" class="service-img" loading="lazy">
        <div class="service-content">
          <div class="service-header">
            <h3 class="service-title font-serif">${service.name}</h3>
            <span class="service-price">${formatCOP(service.price)}</span>
          </div>
          <div class="service-duration">
            <i class="bi bi-clock"></i> ${service.duration} &nbsp;|&nbsp; <i class="bi bi-calendar-check"></i> ${service.availability}
          </div>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.25rem;">${service.description}</p>
          <div style="display: flex; gap: 0.75rem;">
            <button onclick="window.lizGlamApp.addToCart('${service.id}', 'service')" class="btn btn-sm btn-outline-rose btn-full">
              <i class="bi bi-calendar-plus"></i> Añadir a Cita
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderCombos() {
    const grid = document.getElementById('combosGrid');
    if (!grid) return;

    if (this.combos.length === 0) return;

    grid.innerHTML = this.combos.map(combo => `
      <div class="combo-card">
        <span class="combo-badge">Combo Especial ✨</span>
        <h3 class="font-serif" style="font-size: 1.35rem; margin-bottom: 0.5rem;">${combo.name}</h3>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">${combo.description}</p>
        <div style="display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1.25rem;">
          <span style="font-family: var(--font-serif); font-size: 1.5rem; font-weight: 700; color: var(--rose-gold-dark);">${formatCOP(combo.price)}</span>
          ${combo.original_price ? `<span style="font-size: 0.9rem; text-decoration: line-through; color: var(--text-muted);">${formatCOP(combo.original_price)}</span>` : ''}
        </div>
        <button onclick="window.lizGlamApp.addToCart('${combo.id}', 'combo')" class="btn btn-sm btn-primary btn-full">
          <i class="bi bi-gift"></i> Añadir Combo Glam
        </button>
      </div>
    `).join('');
  }

  addToCart(id, type = 'product') {
    let item = null;
    if (type === 'product') {
      item = this.products.find(p => p.id === id);
    } else if (type === 'service') {
      item = this.services.find(s => s.id === id);
    } else if (type === 'combo') {
      item = this.combos.find(c => c.id === id);
    }

    if (item) {
      window.cartManager.addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        category: item.category || type
      });
    }
  }
}

window.lizGlamApp = new LizGlamApp();
