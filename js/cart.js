/**
 * LizGlam Beauty Platform - Persistent Shopping Cart Manager
 */

class CartManager {
  constructor() {
    this.items = [];
    this.init();
  }

  init() {
    // Load local cart
    const saved = localStorage.getItem('lizglam_cart');
    if (saved) {
      try {
        this.items = JSON.parse(saved);
      } catch (e) {
        this.items = [];
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      this.updateCartBadge();
      this.renderCartDrawer();
    });
  }

  addItem(item) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += (item.quantity || 1);
    } else {
      this.items.push({
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url || '/assets/foundation.jpg',
        category: item.category || 'Producto',
        quantity: item.quantity || 1
      });
    }

    this.saveCart();
    showToast(`"${item.name}" agregado al carrito`);
    this.openDrawer();
  }

  removeItem(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.saveCart();
  }

  updateQuantity(id, delta) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeItem(id);
    } else {
      this.saveCart();
    }
  }

  clearCart() {
    this.items = [];
    this.saveCart();
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  saveCart() {
    localStorage.setItem('lizglam_cart', JSON.stringify(this.items));
    this.updateCartBadge();
    this.renderCartDrawer();

    // Sync with Firestore if logged in
    if (window.authManager && window.authManager.currentUser) {
      fetch(`${API_URL}?action=saveCart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: window.authManager.currentUser.uid,
          items: this.items
        })
      }).catch(err => console.warn('Firestore cart sync error:', err));
    }
  }

  async syncWithUser(userId) {
    try {
      const res = await fetch(`${API_URL}?action=getUserCart&userId=${userId}`);
      const data = await res.json();
      if (data.success && data.cart && data.cart.items) {
        if (data.cart.items.length > 0) {
          this.items = data.cart.items;
          this.saveCart();
        }
      }
    } catch (e) {
      console.warn('Could not sync user cart:', e);
    }
  }

  updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = this.getItemCount();
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  openDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer) drawer.classList.add('active');
    if (overlay) overlay.classList.add('active');
  }

  closeDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer) drawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  }

  renderCartDrawer() {
    const body = document.getElementById('cartDrawerBody');
    const totalEl = document.getElementById('cartDrawerTotal');
    if (!body) return;

    if (this.items.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <i class="bi bi-bag-heart" style="font-size: 3rem; color: var(--rose-gold); display: block; margin-bottom: 1rem;"></i>
          <p style="font-size: 1.1rem; font-weight: 500;">Tu carrito está vacío</p>
          <p style="font-size: 0.85rem; margin-top: 0.5rem;">Descubre nuestros maquillajes y servicios de belleza.</p>
          <a href="/productos.html" onclick="window.cartManager.closeDrawer()" class="btn btn-sm btn-primary" style="margin-top: 1.5rem;">Explorar Tienda</a>
        </div>
      `;
      if (totalEl) totalEl.textContent = formatCOP(0);
      return;
    }

    body.innerHTML = this.items.map(item => `
      <div class="cart-item">
        <img src="${item.image_url}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">${formatCOP(item.price)}</div>
          <div class="cart-item-qty">
            <button onclick="window.cartManager.updateQuantity('${item.id}', -1)" class="qty-btn">-</button>
            <span style="font-size: 0.85rem; font-weight: 600;">${item.quantity}</span>
            <button onclick="window.cartManager.updateQuantity('${item.id}', 1)" class="qty-btn">+</button>
            <button onclick="window.cartManager.removeItem('${item.id}')" style="margin-left: auto; color: var(--text-muted); font-size: 0.85rem;" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    if (totalEl) totalEl.textContent = formatCOP(this.getTotal());
  }

  // Action 1: Contact via Instagram
  contactInstagram() {
    if (this.items.length === 0) {
      showToast('Tu carrito está vacío', 'info');
      return;
    }

    window.instagramManager.sendOrderToInstagram(this.items, this.getTotal());
  }

  // Action 2: Copy Order text to Clipboard
  copyOrderToClipboard() {
    if (this.items.length === 0) {
      showToast('Tu carrito está vacío', 'info');
      return;
    }

    window.instagramManager.copyOrderText(this.items, this.getTotal());
  }
}

window.cartManager = new CartManager();
