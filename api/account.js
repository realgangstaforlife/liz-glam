/**
 * Consolidated API Router for Vercel Hobby Plan (Max 12 Serverless Functions)
 * LizGlam Beauty Platform - api/account.js
 */

// Initialize Firebase Admin dynamically if module and environment key are available
let db = null;
try {
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    if (!getApps().length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    db = getFirestore();
  }
} catch (e) {
  console.warn('Firebase Admin module notice (running in client/standalone mode):', e.message);
}

// In-Memory Seed Fallback Data (when DB is empty or during local dev before credentials)
const SEED_PRODUCTS = [
  {
    id: "prod_1",
    name: "Base Aurélia Sélection Nude",
    category: "bases",
    price: 68000,
    description: "Base de maquillaje con acabado luminoso y cobertura construible. Fórmula hidratante de larga duración.",
    image_url: "/assets/foundation.jpg",
    stock: 15,
    rating: 4.9,
    reviewsCount: 28,
    active: true
  },
  {
    id: "prod_2",
    name: "Labial Velvet Rose Mat",
    category: "labiales",
    price: 38000,
    description: "Labial mate cremoso en tono rosa suave. Alta pigmentación sin resecar los labios.",
    image_url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80",
    stock: 22,
    rating: 4.8,
    reviewsCount: 42,
    active: true
  },
  {
    id: "prod_3",
    name: "Paleta de Sombras Rosé Romance",
    category: "sombras",
    price: 95000,
    description: "Paleta con 10 tonos sedosos entre mates elegantes y destellos deslumbrantes.",
    image_url: "/assets/hero-banner.jpg",
    stock: 10,
    rating: 5.0,
    reviewsCount: 35,
    active: true
  },
  {
    id: "prod_4",
    name: "Rubor Sedoso Glow & Pink",
    category: "rubores",
    price: 42000,
    description: "Rubor compacto ultra fino con destellos dorados sutiles para mejillas radiantes.",
    image_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80",
    stock: 18,
    rating: 4.7,
    reviewsCount: 19,
    active: true
  },
  {
    id: "prod_5",
    name: "Set Profesional de Brochas LizGlam",
    category: "brochas",
    price: 110000,
    description: "8 brochas ultra suaves de pelo sintético premiun con mango de madera rosada.",
    image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
    stock: 8,
    rating: 4.9,
    reviewsCount: 50,
    active: true
  }
];

const SEED_SERVICES = [
  {
    id: "serv_1",
    name: "Maquillaje Social & Fiesta",
    duration: "60 min",
    price: 90000,
    description: "Maquillaje profesional personalizado para eventos sociales, incluye pestañas de tira y sellado de larga duración.",
    image_url: "/assets/service-makeup.jpg",
    availability: "Lunes a Sábado",
    active: true
  },
  {
    id: "serv_2",
    name: "Maquillaje Novia Glam Premier",
    duration: "90 min",
    price: 180000,
    description: "Experiencia de lujo para novias: prueba previa, preparación de piel con sueros botánicos, peinado glam y fijación resistente a lágrimas.",
    image_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80",
    availability: "Previa Cita",
    active: true
  },
  {
    id: "serv_3",
    name: "Lifting & Laminado de Pestañas",
    duration: "45 min",
    price: 65000,
    description: "Rizado natural y tinte de pestañas efecto rímel por 4 a 6 semanas.",
    image_url: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=600&q=80",
    availability: "Martes a Sábado",
    active: true
  }
];

const SEED_COMBOS = [
  {
    id: "combo_1",
    name: "Combo Glam Total: Maquillaje Social + Labial Velvet",
    price: 115000,
    original_price: 128000,
    description: "Obtén el servicio de maquillaje social completo y llévate el Labial Velvet Rose a un precio preferencial.",
    items: ["Maquillaje Social & Fiesta", "Labial Velvet Rose Mat"],
    active: true
  }
];

module.exports = async function handler(req, res) {
  // Enable CORS headers for client requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse Action & Query Parameters
  const urlParams = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let action = urlParams.searchParams.get('action') || (req.body && req.body.action);

  if (!action && req.url.includes('/api/')) {
    const parts = req.url.split('?')[0].split('/');
    action = parts[parts.length - 1];
  }

  try {
    switch (action) {
      case 'getProducts': {
        const category = urlParams.searchParams.get('category');
        const search = urlParams.searchParams.get('search');
        
        let products = SEED_PRODUCTS;
        if (db) {
          try {
            const snapshot = await db.collection('products').where('active', '==', true).get();
            if (!snapshot.empty) {
              products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
          } catch (e) {
            console.error('Firestore getProducts error, falling back to seed data:', e);
          }
        }

        if (category && category !== 'all') {
          products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }
        if (search) {
          const q = search.toLowerCase();
          products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
        }

        return res.status(200).json({ success: true, products });
      }

      case 'getServices': {
        let services = SEED_SERVICES;
        if (db) {
          try {
            const snapshot = await db.collection('services').where('active', '==', true).get();
            if (!snapshot.empty) {
              services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
          } catch (e) {
            console.error('Firestore getServices error:', e);
          }
        }
        return res.status(200).json({ success: true, services });
      }

      case 'getCombos': {
        let combos = SEED_COMBOS;
        if (db) {
          try {
            const snapshot = await db.collection('combos').where('active', '==', true).get();
            if (!snapshot.empty) {
              combos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
          } catch (e) {
            console.error('Firestore getCombos error:', e);
          }
        }
        return res.status(200).json({ success: true, combos });
      }

      case 'saveCart': {
        const { userId, items } = req.body || {};
        if (!userId) {
          return res.status(400).json({ success: false, error: 'User ID required' });
        }
        if (db) {
          await db.collection('saved_carts').doc(userId).set({
            user_id: userId,
            items: items || [],
            updated_at: new Date().toISOString()
          }, { merge: true });
        }
        return res.status(200).json({ success: true, message: 'Cart saved successfully' });
      }

      case 'getUserCart': {
        const userId = urlParams.searchParams.get('userId');
        if (!userId) {
          return res.status(400).json({ success: false, error: 'User ID required' });
        }
        let cart = { items: [] };
        if (db) {
          const doc = await db.collection('saved_carts').doc(userId).get();
          if (doc.exists) {
            cart = doc.data();
          }
        }
        return res.status(200).json({ success: true, cart });
      }

      case 'logOrder': {
        const { items, total, customer, channel } = req.body || {};
        const orderData = {
          items: items || [],
          total: total || 0,
          customer: customer || { name: 'Cliente Anónimo' },
          channel: channel || 'Instagram',
          created_at: new Date().toISOString(),
          status: 'pending_dm'
        };

        if (db) {
          const ref = await db.collection('orders').add(orderData);
          orderData.id = ref.id;
        } else {
          orderData.id = "ord_" + Date.now();
        }
        return res.status(200).json({ success: true, order: orderData });
      }

      case 'getOrders': {
        let orders = [];
        if (db) {
          const snapshot = await db.collection('orders').orderBy('created_at', 'desc').get();
          orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return res.status(200).json({ success: true, orders });
      }

      case 'getAnalytics': {
        let productsCount = SEED_PRODUCTS.length;
        let servicesCount = SEED_SERVICES.length;
        let ordersCount = 0;
        let totalRevenueEst = 0;

        if (db) {
          const pSnap = await db.collection('products').get();
          const sSnap = await db.collection('services').get();
          const oSnap = await db.collection('orders').get();
          productsCount = pSnap.size;
          servicesCount = sSnap.size;
          ordersCount = oSnap.size;
          oSnap.docs.forEach(doc => {
            totalRevenueEst += (doc.data().total || 0);
          });
        }

        return res.status(200).json({
          success: true,
          analytics: {
            productsCount,
            servicesCount,
            ordersCount,
            totalRevenueEst
          }
        });
      }

      case 'saveProduct': {
        const productData = req.body;
        if (!productData || !productData.name) {
          return res.status(400).json({ success: false, error: 'Invalid product data' });
        }
        if (db) {
          const docRef = productData.id ? db.collection('products').doc(productData.id) : db.collection('products').doc();
          await docRef.set({
            ...productData,
            updated_at: new Date().toISOString()
          }, { merge: true });
        }
        return res.status(200).json({ success: true, message: 'Producto guardado' });
      }

      case 'deleteProduct': {
        const { id } = req.body || {};
        if (db && id) {
          await db.collection('products').doc(id).delete();
        }
        return res.status(200).json({ success: true, message: 'Producto eliminado' });
      }

      default:
        return res.status(200).json({
          success: true,
          name: "LizGlam API",
          status: "online",
          actions: ["getProducts", "getServices", "getCombos", "saveCart", "getUserCart", "logOrder", "getOrders", "getAnalytics", "saveProduct", "deleteProduct"]
        });
    }
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
