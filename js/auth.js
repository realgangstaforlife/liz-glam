/**
 * LizGlam Beauty Platform - Authentication Module (Google Sign-In + Firestore User Sync)
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
        firebase.auth().onAuthStateChanged(async (user) => {
          if (user) {
            this.currentUser = {
              uid: user.uid,
              displayName: user.displayName || user.email.split('@')[0],
              email: user.email,
              photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              role: (user.email === 'admin@lizglam.happycorner.top' || user.email.includes('admin')) ? 'admin' : 'user'
            };
            localStorage.setItem('lizglam_user', JSON.stringify(this.currentUser));
            await this.syncUserToFirestore(this.currentUser);
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
        await this.syncUserToFirestore(this.currentUser);
      } else {
        // Fallback user sync
        const mockUser = {
          uid: "user_" + Math.random().toString(36).substring(2, 9),
          displayName: "Cliente LizGlam",
          email: "cliente@gmail.com",
          photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          role: "admin"
        };
        this.currentUser = mockUser;
        localStorage.setItem('lizglam_user', JSON.stringify(mockUser));
        await this.syncUserToFirestore(mockUser);
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

  async syncUserToFirestore(userData) {
    try {
      // 1. Client SDK direct sync to users collection if initialized
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        const db = firebase.firestore();
        const userRef = db.collection('users').doc(userData.uid);
        const doc = await userRef.get();
        if (!doc.exists) {
          await userRef.set({
            ...userData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Read existing role from database if assigned!
          const existing = doc.data();
          if (existing.role) {
            userData.role = existing.role;
            localStorage.setItem('lizglam_user', JSON.stringify(userData));
          }
          await userRef.update({
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      }

      // 2. Server API sync as fallback
      fetch(`${API_URL}?action=syncUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      }).catch(err => console.warn('API syncUser notice:', err));
    } catch (e) {
      console.warn('Sync user error:', e);
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
        <a href="/cuenta" class="icon-btn" title="Mi Cuenta" style="display: flex; align-items: center; gap: 0.5rem;">
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
