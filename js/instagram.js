/**
 * LizGlam Beauty Platform - Instagram & Clipboard Order Manager
 */

class InstagramOrderManager {
  constructor() {
    this.instagramHandle = "@lizglamstore";
    this.instagramUrl = "https://instagram.com/lizglamstore";
  }

  getUserName() {
    if (window.authManager && window.authManager.currentUser && window.authManager.currentUser.displayName) {
      return window.authManager.currentUser.displayName;
    }
    const savedName = localStorage.getItem('lizglam_guest_name');
    return savedName || '';
  }

  async promptCustomerNameIfNeeded() {
    const existingName = this.getUserName();

    return new Promise((resolve) => {
      // Remove any existing name modal
      const existing = document.getElementById('guestNameModal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'guestNameModal';
      modal.style.cssText = `
        position: fixed !important; inset: 0 !important;
        background: rgba(28,23,24,0.75) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        z-index: 999999 !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
        padding: 1rem !important;
      `;

      modal.innerHTML = `
        <div style="background: #FFF; border-radius: 14px; padding: 2.25rem 2rem; max-width: 440px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.25); text-align: center; border: 1px solid var(--border-subtle); animation: modalFadeIn 0.25s ease;">
          <i class="bi bi-person-heart" style="font-size: 3rem; color: var(--rose-gold); display: block; margin-bottom: 0.75rem;"></i>
          <h3 class="font-serif" style="font-size: 1.6rem; margin-bottom: 0.5rem; color: var(--text-main);">¿A nombre de quién es el pedido? 💕</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.5;">
            Ingresa tu nombre para adjuntarlo a tu pedido antes de enviarlo por Instagram:
          </p>
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <input type="text" id="guestNameInput" class="form-control" placeholder="Ej: María Paula" value="${existingName}" style="text-align: center; font-size: 1.05rem; padding: 0.85rem; border-color: var(--rose-gold);">
          </div>
          <button id="submitGuestNameBtn" class="btn btn-primary btn-full" style="font-size: 1rem; padding: 0.85rem;">
            <i class="bi bi-instagram"></i> Confirmar y Continuar
          </button>
        </div>
      `;

      document.body.appendChild(modal);

      const input = modal.querySelector('#guestNameInput');
      const btn = modal.querySelector('#submitGuestNameBtn');
      input.focus();
      if (existingName) input.select();

      const finish = () => {
        const value = input.value.trim() || 'Cliente';
        localStorage.setItem('lizglam_guest_name', value);
        modal.remove();
        resolve(value);
      };

      btn.addEventListener('click', finish);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') finish();
      });
    });
  }

  async generateOrderText(items, total) {
    const userName = await this.promptCustomerNameIfNeeded();

    let text = `✨ ¡Hola ${this.instagramHandle}! Quisiera realizar el siguiente pedido:\n\n`;
    text += `📦 *PRODUCTOS & SERVICIOS:*\n`;
    
    items.forEach(item => {
      text += `• ${item.quantity}x ${item.name} (${formatCOP(item.price * item.quantity)})\n`;
    });

    text += `\n💰 *TOTAL ESTIMADO:* ${formatCOP(total)}\n`;
    text += `👤 *Cliente:* ${userName}\n\n`;
    text += `¡Quedo atenta/o para confirmar la compra/cita! 💕`;

    return text;
  }

  async copyOrderText(items, total) {
    const orderText = await this.generateOrderText(items, total);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(orderText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = orderText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      showToast('✨ ¡Pedido copiado al portapapeles! Ahora envíalo por DM a @lizglamstore');
      this.logOrderToBackend(items, total, 'ClipboardCopy');
    } catch (err) {
      console.error('Copy Error:', err);
      showToast('Error al copiar el pedido. Intenta nuevamente.', 'error');
    }
  }

  async sendOrderToInstagram(items, total) {
    const orderText = await this.generateOrderText(items, total);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(orderText);
      }
    } catch (e) {}

    await this.logOrderToBackend(items, total, 'InstagramRedirect');
    showToast('✨ ¡Pedido copiado! Redirigiendo a @lizglamstore...');

    setTimeout(() => {
      window.open(this.instagramUrl, '_blank');
    }, 600);
  }

  async logOrderToBackend(items, total, channel) {
    try {
      const userName = this.getUserName() || 'Cliente Anónimo';
      const customer = (window.authManager && window.authManager.currentUser)
        ? { name: window.authManager.currentUser.displayName, email: window.authManager.currentUser.email }
        : { name: userName };

      await fetch(`${API_URL}?action=logOrder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          total,
          customer,
          channel
        })
      });
    } catch (e) {
      console.warn('Backend order log notice:', e);
    }
  }
}

window.instagramManager = new InstagramOrderManager();
