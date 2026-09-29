/**
 * LizGlam Beauty Platform - Configuration & Initialization
 */

// Firebase Configuration for LizGlam (Separate Instance from HappyCorner)
const firebaseConfig = {
  apiKey: "AIzaSyLizGlamDefaultApiKeyForTesting12345",
  authDomain: "lizglam-beauty.firebaseapp.com",
  projectId: "lizglam-beauty",
  storageBucket: "lizglam-beauty.appspot.com",
  messagingSenderId: "987654321012",
  appId: "1:987654321012:web:abcdef123456789"
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
