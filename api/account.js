/**
 * Consolidated API Router for Vercel Hobby Plan (Max 12 Serverless Functions)
 * LizGlam Beauty Platform - api/account.js
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin dynamically if module and environment key are available
let db = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    if (!getApps().length) {
      const rawAccount = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
      const serviceAccount = JSON.parse(rawAccount);
      if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    db = getFirestore();
  }
} catch (e) {
  console.warn('Firebase Admin module notice (running in client/standalone mode):', e.message);
}

// Optional Cloudflare R2 S3 Client Initialization
let s3Client = null;
let r2Bucket = process.env.R2_BUCKET_NAME || 'lizglam';
let r2PublicDomain = process.env.R2_PUBLIC_DOMAIN || '';

try {
  if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ACCOUNT_ID) {
    const { S3Client } = require('@aws-sdk/client-s3');
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      }
    });
  }
} catch (e) {
  console.warn('R2 Client notice (R2 credentials unconfigured or module missing):', e.message);
}

// In-Memory Seed Fallback Data
const SEED_PRODUCTS = [
  {
    id: "prod_1",
    name: "Base Aurélia Sélection Nude",
    category: "bases",
    price: 68000,
    description: "Base de maquillaje con acabado luminoso y cobertura construible.",
    image_url: "/assets/foundation.jpg",
    shades: [
      { name: "Nude Porcelana", hex: "#F5E0D3" },
      { name: "Beige Natural", hex: "#E8CBB9" },
      { name: "Miel Cálido", hex: "#D6A78B" }
    ],
    stock: 15,
    active: true
  },
  {
    id: "prod_2",
    name: "Labial Velvet Rose Mat",
    category: "labiales",
    price: 38000,
    description: "Labial mate cremoso en tono rosa suave. Alta pigmentación sin resecar.",
    image_url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80",
    shades: [
      { name: "Velvet Rose", hex: "#C77B89" },
      { name: "Ruby Glam", hex: "#8A3535" },
      { name: "Nude Coral", hex: "#D48B8B" }
    ],
    stock: 22,
    active: true
  },
  {
    id: "prod_3",
    name: "Paleta de Sombras Rosé Romance",
    category: "sombras",
    price: 95000,
    description: "Paleta con 10 tonos sedosos entre mates elegantes y destellos deslumbrantes.",
    image_url: "/assets/hero-banner.jpg",
    shades: [],
    stock: 10,
    active: true
  }
];

const SEED_SERVICES = [
  {
    id: "serv_1",
    name: "Maquillaje Social & Fiesta",
    duration: "60 min",
    price: 90000,
    description: "Maquillaje profesional personalizado para eventos sociales con pestañas incluidas.",
    image_url: "/assets/service-makeup.jpg",
    availability: "Lunes a Sábado",
    active: true
  },
  {
    id: "serv_2",
    name: "Maquillaje Novia Glam Premier",
    duration: "90 min",
    price: 180000,
    description: "Experiencia de lujo para novias con prueba previa y peinado glam.",
    image_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80",
    availability: "Previa Cita",
    active: true
  }
];

const SEED_BANNERS = [
  {
    id: "banner_1",
    title: "Resalta tu Belleza Natural con Elegancia",
    subtitle: "COSMÉTICOS & ESTUDIO DE MAQUILLAJE",
    desc: "Explora nuestra colección exclusiva de cosméticos profesionales y reserva experiencias de maquillaje de alto impacto.",
    image_url: "/assets/hero-banner.jpg"
  },
  {
    id: "banner_2",
    title: "Servicios de Maquillaje & Novias Glam",
    subtitle: "EXPERIENCIA EXCLUSIVA EN ESTUDIO",
    desc: "Agenda tu cita para eventos especiales con productos de cobertura profesional de larga duración.",
    image_url: "/assets/service-makeup.jpg"
  }
];

const SEED_REVIEWS = [
  {
    id: "rev_1",
    userName: "Sofía M.",
    rating: 5,
    title: "¡El maquillaje duró toda la noche!",
    content: "Contraté el servicio de Maquillaje Social para mi graduación y quedé enamorada. La atención por Instagram fue súper rápida.",
    status: "approved",
    createdAt: new Date().toISOString()
  },
  {
    id: "rev_2",
    userName: "Valentina G.",
    rating: 5,
    title: "Excelente pigmentación y acabado",
    content: "Compré el labial Velvet Rose y la base Aurélia. La calidad es increíble, 100% recomendado.",
    status: "approved",
    createdAt: new Date().toISOString()
  }
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const urlParams = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let action = urlParams.searchParams.get('action') || (req.body && req.body.action);

  if (!action && req.url.includes('/api/')) {
    const parts = req.url.split('?')[0].split('/');
    action = parts[parts.length - 1];
  }

  try {
    switch (action) {
      // 1. PRODUCTS
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
            console.error('Firestore getProducts error:', e);
          }
        }

        if (category && category !== 'all') {
          products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }
        if (search) {
          const q = search.toLowerCase();
          products = products.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
        }

        return res.status(200).json({ success: true, products });
      }

      case 'saveProduct': {
        try {
          const productData = req.body || {};
          if (!productData || !productData.name) {
            return res.status(400).json({ success: false, error: 'Información de producto incompleta' });
          }

          const cleanShades = Array.isArray(productData.shades)
            ? productData.shades.map(s => ({ name: String(s.name || ''), hex: String(s.hex || '#C77B89') }))
            : [];

          const cleanProduct = {
            name: String(productData.name),
            category: String(productData.category || 'bases'),
            price: Number(productData.price) || 0,
            image_url: String(productData.image_url || '/assets/foundation.jpg'),
            description: String(productData.description || ''),
            shades: cleanShades,
            stock: Number(productData.stock) || 10,
            active: true,
            updatedAt: new Date().toISOString()
          };

          if (db) {
            const targetId = (productData.id && String(productData.id).trim().length > 0) ? String(productData.id).trim() : null;
            const docRef = targetId ? db.collection('products').doc(targetId) : db.collection('products').doc();
            cleanProduct.id = docRef.id;
            await docRef.set(cleanProduct, { merge: true });
          }

          return res.status(200).json({ success: true, message: 'Producto guardado exitosamente', product: cleanProduct });
        } catch (err) {
          console.error('saveProduct inner error:', err);
          return res.status(500).json({ success: false, error: err.message });
        }
      }

      case 'deleteProduct': {
        const { id } = req.body || {};
        if (db && id) {
          await db.collection('products').doc(String(id)).delete();
        }
        return res.status(200).json({ success: true, message: 'Producto eliminado' });
      }

      // 2. SERVICES
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

      case 'saveService': {
        try {
          const serviceData = req.body || {};
          if (!serviceData || !serviceData.name) {
            return res.status(400).json({ success: false, error: 'Información de servicio incompleta' });
          }
          if (db) {
            const targetId = (serviceData.id && String(serviceData.id).trim().length > 0) ? String(serviceData.id).trim() : null;
            const docRef = targetId ? db.collection('services').doc(targetId) : db.collection('services').doc();
            await docRef.set({
              name: String(serviceData.name),
              duration: String(serviceData.duration || '60 min'),
              price: Number(serviceData.price) || 0,
              description: String(serviceData.description || ''),
              image_url: String(serviceData.image_url || '/assets/service-makeup.jpg'),
              availability: String(serviceData.availability || 'Lunes a Sábado'),
              active: true,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
          return res.status(200).json({ success: true, message: 'Servicio guardado exitosamente' });
        } catch (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
      }

      // 3. BANNERS (Carousel Support)
      case 'getBanners': {
        let banners = SEED_BANNERS;
        if (db) {
          try {
            const snapshot = await db.collection('banners').get();
            if (!snapshot.empty) {
              banners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
          } catch (e) {
            console.error('Firestore getBanners error:', e);
          }
        }
        return res.status(200).json({ success: true, banners });
      }

      case 'saveBanner': {
        const bannerData = req.body || {};
        if (db && bannerData) {
          const targetId = (bannerData.id && String(bannerData.id).trim().length > 0) ? String(bannerData.id).trim() : 'banner_' + Date.now();
          const ref = db.collection('banners').doc(targetId);
          await ref.set({
            ...bannerData,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
        return res.status(200).json({ success: true, message: 'Banner guardado exitosamente' });
      }

      case 'deleteBanner': {
        const { id } = req.body || {};
        if (db && id) {
          await db.collection('banners').doc(String(id)).delete();
        }
        return res.status(200).json({ success: true, message: 'Banner eliminado' });
      }

      // 4. REVIEWS (Reseñas)
      case 'getReviews': {
        let reviews = SEED_REVIEWS;
        if (db) {
          try {
            const snapshot = await db.collection('reviews').orderBy('createdAt', 'desc').get();
            if (!snapshot.empty) {
              reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
          } catch (e) {
            console.error('Firestore getReviews error:', e);
          }
        }
        return res.status(200).json({ success: true, reviews });
      }

      case 'saveReview': {
        const { userName, rating, title, content, status } = req.body || {};
        if (!content || content.length < 5) {
          return res.status(400).json({ success: false, error: 'La reseña debe contener al menos 5 caracteres.' });
        }
        const reviewData = {
          userName: userName || 'Cliente Anónimo',
          rating: Number(rating) || 5,
          title: title || 'Reseña de Cliente',
          content: content,
          status: status || 'pending',
          createdAt: new Date().toISOString()
        };

        if (db) {
          const ref = await db.collection('reviews').add(reviewData);
          reviewData.id = ref.id;
        } else {
          reviewData.id = "rev_" + Date.now();
        }

        return res.status(200).json({ success: true, message: 'Reseña enviada para aprobación', review: reviewData });
      }

      case 'approveReview': {
        const { id, status } = req.body || {};
        if (db && id) {
          await db.collection('reviews').doc(String(id)).set({ status: status || 'approved' }, { merge: true });
        }
        return res.status(200).json({ success: true, message: 'Estado de reseña actualizado' });
      }

      case 'deleteReview': {
        const { id } = req.body || {};
        if (db && id) {
          await db.collection('reviews').doc(String(id)).delete();
        }
        return res.status(200).json({ success: true, message: 'Reseña eliminada' });
      }

      // 5. CLOUDFLARE R2 IMAGE UPLOAD
      case 'uploadImage': {
        const { base64Data, fileName } = req.body || {};
        if (!base64Data) {
          return res.status(400).json({ success: false, error: 'Base64 data is required' });
        }

        const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        const key = `uploads/${Date.now()}_${fileName ? fileName.replace(/[^a-zA-Z0-9.-]/g, '_') : 'image.jpg'}`;

        if (s3Client) {
          try {
            const { PutObjectCommand } = require('@aws-sdk/client-s3');
            await s3Client.send(new PutObjectCommand({
              Bucket: r2Bucket,
              Key: key,
              Body: buffer,
              ContentType: 'image/jpeg'
            }));

            const finalUrl = r2PublicDomain
              ? `${r2PublicDomain.replace(/\/$/, '')}/${key}`
              : `https://${r2Bucket}.r2.cloudflarestorage.com/${key}`;

            return res.status(200).json({ success: true, image_url: finalUrl });
          } catch (err) {
            console.error('R2 PutObject error:', err);
          }
        }

        const dataUrl = `data:image/jpeg;base64,${cleanBase64}`;
        return res.status(200).json({ success: true, image_url: dataUrl, notice: 'Utilizando Base64 fallback (configura R2_ACCESS_KEY_ID en Vercel para CDN permanente)' });
      }

      // 6. PAYMENT LINKS / COBRO
      case 'createPaymentLink': {
        const { customerName, amount, description, paymentMethod } = req.body || {};
        const linkData = {
          id: "cobro_" + Math.random().toString(36).substring(2, 8),
          customerName: customerName || 'Cliente',
          amount: Number(amount) || 0,
          description: description || 'Servicio / Productos de Maquillaje LizGlam',
          paymentMethod: paymentMethod || 'Nequi / Bancolombia',
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        if (db) {
          await db.collection('payment_links').doc(linkData.id).set(linkData);
        }
        return res.status(200).json({ success: true, paymentLink: linkData });
      }

      case 'getPaymentLinks': {
        let links = [];
        if (db) {
          const snapshot = await db.collection('payment_links').orderBy('createdAt', 'desc').get();
          links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return res.status(200).json({ success: true, links });
      }

      // 7. USERS
      case 'syncUser': {
        const { uid, email, displayName, photoURL } = req.body || {};
        if (!uid) return res.status(400).json({ success: false, error: 'UID is required' });

        let userData = {
          uid,
          email: email || '',
          displayName: displayName || email || 'Cliente',
          photoURL: photoURL || '',
          updatedAt: new Date().toISOString()
        };

        if (db) {
          try {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await userRef.get();
            if (!userDoc.exists) {
              userData.role = (email === 'admin@lizglam.happycorner.top' || email.includes('admin') || email === 'evanlensen1@gmail.com') ? 'admin' : 'user';
              userData.createdAt = new Date().toISOString();
              await userRef.set(userData);
            } else {
              userData = { ...userDoc.data(), ...userData };
              await userRef.update({
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                updatedAt: userData.updatedAt
              });
            }
          } catch (e) {
            console.error('Firestore syncUser error:', e);
          }
        }
        return res.status(200).json({ success: true, user: userData });
      }

      case 'getUsers': {
        let users = [];
        if (db) {
          try {
            const snapshot = await db.collection('users').get();
            users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          } catch (e) {
            console.error('Firestore getUsers error:', e);
          }
        }
        return res.status(200).json({ success: true, users });
      }

      // 8. ORDERS & ANALYTICS WITH MARGINS
      case 'saveCart': {
        const { userId, items } = req.body || {};
        if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
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
        if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
        let cart = { items: [] };
        if (db) {
          const doc = await db.collection('saved_carts').doc(userId).get();
          if (doc.exists) cart = doc.data();
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
        let estimatedProfitEst = 0;

        if (db) {
          const pSnap = await db.collection('products').get();
          const sSnap = await db.collection('services').get();
          const oSnap = await db.collection('orders').get();
          productsCount = pSnap.size;
          servicesCount = sSnap.size;
          ordersCount = oSnap.size;
          oSnap.docs.forEach(doc => {
            const total = doc.data().total || 0;
            totalRevenueEst += total;
            // Estimated profit margin (approx 55% average across products & services)
            estimatedProfitEst += (total * 0.55);
          });
        } else {
          ordersCount = 5;
          totalRevenueEst = 480000;
          estimatedProfitEst = 264000;
        }

        return res.status(200).json({
          success: true,
          analytics: {
            productsCount,
            servicesCount,
            ordersCount,
            totalRevenueEst,
            estimatedProfitEst
          }
        });
      }

      default:
        return res.status(200).json({
          success: true,
          name: "LizGlam API",
          status: "online"
        });
    }
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
