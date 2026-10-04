/**
 * LizGlam Beauty Platform - Configuration & Initialization
 */

// Firebase Configuration for LizGlam (Separate Instance from HappyCorner)
const firebaseConfig = {
  apiKey: "AIzaSyCm6ynzGPfVJJDw4izYi308mA0MiNnsV4E",
  authDomain: "lizglam-store.firebaseapp.com",
  projectId: "lizglam-store",
  storageBucket: "lizglam-store.firebasestorage.app",
  messagingSenderId: "767126841599",
  appId: "1:767126841599:web:ae6bf5719931e6e03d84ca",
  measurementId: "G-49MMQGG4W7"
};

// API Endpoint Helper
const API_URL = '/api/account';

// Helper to format currency in COP ($ 45.000)
function formatCOP(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
}

// Global Toast Notification Helper
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-info-circle-fill'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
