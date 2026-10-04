/**
 * LizGlam Beauty Platform - Authentication Module (Google Sign-In + Firebase Auth)
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    this.initFirebase();
  }

  initFirebase() {
    // If Firebase SDK script is loaded, initialize app
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
      if (!firebase.apps.length && typeof firebaseConfig !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
      }
      
      if (firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
          if (user) {
            this.currentUser = {
              uid: user.uid,
              displayName: user.displayName || user.email.split('@')[0],
              email: user.email,
              photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              role: (user.email === 'admin@lizglam.happycorner.top' || user.email.includes('admin')) ? 'admin' : 'user'
            };
            localStorage.setItem('lizglam_user', JSON.stringify(this.currentUser));
          } else {
            const saved = localStorage.getItem('lizglam_user');
            this.currentUser = saved ? JSON.parse(saved) : null;
          }
          this.updateUI();
          this.notifyListeners();
        });
        return;
      }
    }

    // Local Storage Fallback
    const savedUser = localStorage.getItem('lizglam_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        localStorage.removeItem('lizglam_user');
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      this.updateUI();
    });
  }

  async signInWithGoogle() {
    try {
      showToast('Conectando con Google...', 'info');

      if (typeof firebase !== 'undefined' && firebase.auth) {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        this.currentUser = {
          uid: user.uid,
          displayName: user.displayName || user.email.split('@')[0],
          email: user.email,
          photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          role: (user.email === 'admin@lizglam.happycorner.top' || user.email.includes('admin')) ? 'admin' : 'user'
        };
        localStorage.setItem('lizglam_user', JSON.stringify(this.currentUser));
      } else {
        // Demo fallback
        const mockGoogleUser = {
          uid: "user_" + Math.random().toString(36).substring(2, 9),
          displayName: "Cliente LizGlam",
          email: "cliente@gmail.com",
          photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          role: "admin"
        };
        this.currentUser = mockGoogleUser;
        localStorage.setItem('lizglam_user', JSON.stringify(mockGoogleUser));
      }

      if (window.cartManager) {
        window.cartManager.syncWithUser(this.currentUser.uid);
      }

      this.updateUI();
      showToast(`¡Bienvenida/o, ${this.currentUser.displayName}!`);
      this.notifyListeners();
      return this.currentUser;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      showToast('Error al iniciar sesión con Google: ' + (error.message || 'Intente nuevamente'), 'error');
    }
  }

  logout() {
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      firebase.auth().signOut();
    }
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
        <a href="/cuenta.html" class="icon-btn" title="Mi Cuenta" style="display: flex; align-items: center; gap: 0.5rem;">
          <img src="${this.currentUser.photoURL}" alt="${this.currentUser.displayName}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--rose-gold);">
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
