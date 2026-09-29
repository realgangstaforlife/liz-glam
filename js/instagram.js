/**
 * LizGlam Beauty Platform - Instagram & Clipboard Order Manager
 */

class InstagramOrderManager {
  constructor() {
    this.instagramHandle = "@lizglamstore";
    this.instagramUrl = "https://instagram.com/lizglamstore";
  }

  generateOrderText(items, total) {
    const userName = (window.authManager && window.authManager.currentUser)
      ? window.authManager.currentUser.displayName
      : "Cliente";

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
    const orderText = this.generateOrderText(items, total);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(orderText);
      } else {
        // Fallback for older browsers
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
    // Copy order text first so user has it ready to paste in DM
    await this.copyOrderText(items, total);

    // Log order in backend
    await this.logOrderToBackend(items, total, 'InstagramRedirect');

    // Open Instagram Profile / DM in new tab
    setTimeout(() => {
      window.open(this.instagramUrl, '_blank');
    }, 600);
  }

  async logOrderToBackend(items, total, channel) {
    try {
      const customer = (window.authManager && window.authManager.currentUser)
        ? { name: window.authManager.currentUser.displayName, email: window.authManager.currentUser.email }
        : { name: 'Cliente Anónimo' };

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
