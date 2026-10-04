/**
 * LizGlam Beauty Platform - Instagram & Clipboard Order Manager
 */

class InstagramOrderManager {
  constructor() {
    this.instagramHandle = "@lizglamstore";
    this.instagramUrl = "https://instagram.com/lizglamstore";
  }

  getUserName() {
    if (window.authManager && window.authManager.currentUser) {
      return window.authManager.currentUser.displayName;
    }
    const savedName = localStorage.getItem('lizglam_guest_name');
    return savedName || null;
  }

  async promptCustomerNameIfNeeded() {
    let name = this.getUserName();
    if (name) return name;

    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(28,23,24,0.7); backdrop-filter: blur(6px);
        z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 1rem;
      `;
      modal.innerHTML = `
        <div style="background: #FFF; border-radius: 12px; padding: 2rem; max-width: 420px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
          <h3 class="font-serif" style="font-size: 1.5rem; margin-bottom: 0.5rem; text-align: center;">¿Cómo te llamas? 💕</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem; text-align: center;">
            Ingresa tu nombre para personalizar tu pedido antes de ir a Instagram:
          </p>
          <input type="text" id="guestNameInput" class="form-control" placeholder="Ej: María Paula" style="margin-bottom: 1.25rem;">
          <button id="submitGuestNameBtn" class="btn btn-primary btn-full">Continuar a Instagram</button>
        </div>
      `;
      document.body.appendChild(modal);

      const input = modal.querySelector('#guestNameInput');
      const btn = modal.querySelector('#submitGuestNameBtn');
      input.focus();

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
