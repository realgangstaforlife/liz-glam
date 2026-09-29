/**
 * LizGlam Beauty Platform - Authentication Module (Google Sign-In)
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    this.init();
  }

  init() {
    // Check local session state
    const savedUser = localStorage.getItem('lizglam_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        localStorage.removeItem('lizglam_user');
      }
    }
    
    // Auto sync header UI on load
    document.addEventListener('DOMContentLoaded', () => {
      this.updateUI();
    });
  }

  // Google Sign-In Simulation & Firebase Auth Hook
  async signInWithGoogle() {
    try {
      showToast('Conectando con Google...', 'info');
      
      // Simulated Google OAuth response when testing without live backend key
      const mockGoogleUser = {
        uid: "user_" + Math.random().toString(36).substring(2, 9),
        displayName: "Cliente LizGlam",
        email: "cliente@gmail.com",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        role: "user"
      };

      this.currentUser = mockGoogleUser;
      localStorage.setItem('lizglam_user', JSON.stringify(mockGoogleUser));

      // Sync user cart from Firestore if available
      if (window.cartManager) {
        window.cartManager.syncWithUser(mockGoogleUser.uid);
      }

      this.updateUI();
      showToast(`¡Bienvenida/o, ${mockGoogleUser.displayName}!`);
      this.notifyListeners();
      return mockGoogleUser;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      showToast('Error al iniciar sesión con Google', 'error');
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('lizglam_user');
    this.updateUI();
    showToast('Sesión cerrada correctamente');
    this.notifyListeners();
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    callback(this.currentUser);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }

  updateUI() {
    const authBtnContainer = document.getElementById('navAuthContainer');
    if (!authBtnContainer) return;

    if (this.currentUser) {
      authBtnContainer.innerHTML = `
        <a href="/cuenta.html" class="icon-btn" title="Mi Cuenta">
          <img src="${this.currentUser.photoURL}" alt="${this.currentUser.displayName}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--rose-gold);">
        </a>
      `;
    } else {
      authBtnContainer.innerHTML = `
        <button onclick="window.authManager.signInWithGoogle()" class="btn btn-sm btn-outline-rose">
          <i class="bi bi-google"></i> Ingresar
        </button>
      `;
    }
  }
}

window.authManager = new AuthManager();
