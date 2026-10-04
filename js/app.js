/**
 * LizGlam Beauty Platform - Main Frontend App Controller
 */

class LizGlamApp {
  constructor() {
    this.products = [];
    this.services = [];
    this.combos = [];
    this.banners = [];
    this.selectedShades = {};
    this.currentCategory = 'all';
    this.init();
  }

  async init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.bindEvents();
      this.loadCatalogData();
      this.loadHeroBanner();
    });
  }

  bindEvents() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    if (mobileToggle && navLinks) {
      mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
      });
    }

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

  async loadHeroBanner() {
    try {
      const res = await fetch(`${API_URL}?action=getBanners`).then(r => r.json());
      if (res.success && res.banners && res.banners.length > 0) {
        const banner = res.banners[0];
        const heroSection = document.querySelector('.hero');
        const heroTitle = document.querySelector('.hero-title');
        const heroDesc = document.querySelector('.hero-desc');
        const heroTag = document.querySelector('.hero-tag');

        if (banner.image_url && heroSection) {
          heroSection.style.background = `linear-gradient(135deg, rgba(91,86,77,0.7) 0%, rgba(138,68,53,0.4) 100%), url('${banner.image_url}') center/cover no-repeat`;
        }
        if (banner.title && heroTitle) heroTitle.textContent = banner.title;
        if (banner.desc && heroDesc) heroDesc.textContent = banner.desc;
        if (banner.subtitle && heroTag) heroTag.textContent = banner.subtitle;
      }
    } catch (e) {
      console.warn('Hero banner load notice:', e);
    }
  }

  setCategory(category) {
    this.currentCategory = category;
    
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
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }

    this.renderProducts(filtered);
  }

  selectShade(productId, shadeName) {
    this.selectedShades[productId] = shadeName;
    
    // Update active UI dot
    const dots = document.querySelectorAll(`.shade-dot-${productId}`);
    dots.forEach(dot => {
      if (dot.dataset.shade === shadeName) {
        dot.style.border = '2px solid #5B564D';
        dot.style.transform = 'scale(1.2)';
      } else {
        dot.style.border = '1px solid #E2DFDC';
        dot.style.transform = 'scale(1)';
      }
    });

    const shadeLabel = document.getElementById(`selectedShadeLabel_${productId}`);
    if (shadeLabel) shadeLabel.textContent = `Tono: ${shadeName}`;
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

    grid.innerHTML = list.map(product => {
      const shades = product.shades || [];
      const hasShades = shades.length > 0;
      const currentShade = this.selectedShades[product.id] || (hasShades ? shades[0].name : '');

      return `
        <div class="product-card">
          <div class="product-img-wrapper">
            <img src="${product.image_url}" alt="${product.name}" class="product-img" loading="lazy">
            <span class="product-badge">${product.category}</span>
          </div>
          <div class="product-content">
            <div class="product-category">LIZGLAM BEAUTY</div>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-desc">${product.description || ''}</p>

            ${hasShades ? `
              <div style="margin-bottom: 0.85rem;">
                <div id="selectedShadeLabel_${product.id}" style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem; font-weight: 500;">
                  Tono: ${currentShade}
                </div>
                <div style="display: flex; gap: 0.4rem; align-items: center;">
                  ${shades.map(s => `
                    <button type="button" 
                      onclick="window.lizGlamApp.selectShade('${product.id}', '${s.name}')" 
                      class="shade-dot-${product.id}"
                      data-shade="${s.name}"
                      title="${s.name}"
                      style="width: 20px; height: 20px; border-radius: 50%; background-color: ${s.hex || '#C77B89'}; border: ${s.name === currentShade ? '2px solid #5B564D' : '1px solid #E2DFDC'}; cursor: pointer; transition: transform 0.2s;">
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div class="product-price-row">
              <div class="product-price">${formatCOP(product.price)}</div>
              <button onclick="window.lizGlamApp.addToCart('${product.id}', 'product')" class="btn btn-sm btn-primary">
                <i class="bi bi-bag-plus"></i> Agregar
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
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
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">${service.description}</p>
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
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${combo.description}</p>
        <div style="display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1.25rem;">
          <span style="font-family: var(--font-serif); font-size: 1.5rem; font-weight: 700; color: var(--rose-gold-dark);">${formatCOP(combo.price)}</span>
          ${combo.original_price ? `<span style="font-size: 0.85rem; text-decoration: line-through; color: var(--text-muted);">${formatCOP(combo.original_price)}</span>` : ''}
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
      const selectedShade = this.selectedShades[id] || (item.shades && item.shades.length > 0 ? item.shades[0].name : null);
      const displayName = selectedShade ? `${item.name} (${selectedShade})` : item.name;

      window.cartManager.addItem({
        id: selectedShade ? `${item.id}_${selectedShade.replace(/\s+/g, '_')}` : item.id,
        name: displayName,
        price: item.price,
        image_url: item.image_url,
        category: item.category || type
      });
    }
  }
}

window.lizGlamApp = new LizGlamApp();
