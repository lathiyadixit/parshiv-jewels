/* Seeds the admin database from the storefront catalogue on first run,
   so the panel opens with the real 36 products rather than an empty shell.
   Runs once; a `version` doc guards against re-seeding over edits. */
import * as db from './db.js';
import { CATALOG } from '../../services/catalogService.js';
import { CATEGORIES, COLLECTIONS as TAXO_COLLECTIONS } from '../../data/taxonomy.js';
import { REVIEWS } from '../../data/reviews.js';
import { COUPONS, SITE, COMMERCE, WHATSAPP_NUMBER } from '../../config/site.config.js';
import { TESTIMONIALS, GALLERY_TILES } from '../../data/content.js';

const SEED_VERSION = 1;

/** Storefront product → admin record (adds the fields only admin owns). */
function toAdminProduct(p, index) {
  return {
    id: `prd_${p.id}`,
    sourceId: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    brand: SITE.name,
    shortDescription: p.shortDescription,
    description: p.description,
    price: p.price,
    compareAt: p.compareAt,
    costPrice: Math.round(p.price * 0.55),
    category: p.categorySlug,
    collections: p.collections,
    material: p.material,
    colors: p.colors,
    tags: p.tags,
    variantLabel: p.variantLabel,
    variants: p.variants.map((v) => ({
      id: v.id,
      label: v.label,
      sku: v.sku,
      price: v.price,
      compareAt: v.compareAt,
      inventory: v.inventory,
      available: v.available,
    })),
    images: p.images.map((img, i) => ({
      id: db.newId('img'),
      src: img.src,
      ref: img.id,
      alt: img.alt,
      primary: i === 0,
      order: i,
    })),
    inventory: p.inventory,
    lowStockThreshold: COMMERCE.lowStockThreshold,
    status: 'active',
    featured: p.isFeatured,
    bestSeller: p.isBestSeller,
    newArrival: p.isNew,
    badge: p.badge || '',
    details: p.details,
    care: p.care,
    seoTitle: '',
    seoDescription: '',
    order: index,
    createdAt: new Date(Date.now() - (CATALOG.length - index) * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function seedReviews() {
  const rows = [];
  Object.entries(REVIEWS).forEach(([productId, list]) => {
    list.forEach((review) => {
      rows.push({
        id: db.newId('rev'),
        productId: `prd_${productId}`,
        productName: CATALOG.find((p) => p.id === Number(productId))?.name || '',
        author: review.author,
        rating: review.rating,
        title: review.title,
        body: review.body,
        verified: review.verified,
        status: 'approved',
        featured: false,
        createdAt: new Date(review.date).toISOString(),
        updatedAt: new Date(review.date).toISOString(),
      });
    });
  });
  return rows;
}

export async function isSeeded() {
  const meta = await db.getDoc('meta', {});
  return meta.seedVersion === SEED_VERSION;
}

export async function seed({ force = false } = {}) {
  if (!force && (await isSeeded())) return false;

  await db.replaceAll(db.COLLECTIONS.products, CATALOG.map(toAdminProduct));

  await db.replaceAll(
    db.COLLECTIONS.categories,
    CATEGORIES.map((c, i) => ({
      id: `cat_${c.slug}`,
      name: c.name,
      slug: c.slug,
      description: c.description,
      tagline: c.tagline,
      image: c.image,
      seoTitle: '',
      seoDescription: '',
      order: i,
      status: 'active',
      createdAt: new Date().toISOString(),
    }))
  );

  await db.replaceAll(
    db.COLLECTIONS.collections,
    TAXO_COLLECTIONS.map((c, i) => ({
      id: `col_${c.slug}`,
      name: c.name,
      slug: c.slug,
      description: c.description,
      tagline: c.tagline,
      image: c.image,
      productIds: CATALOG.filter((p) => p.collections.includes(c.slug)).map((p) => `prd_${p.id}`),
      seoTitle: '',
      seoDescription: '',
      order: i,
      status: 'active',
      createdAt: new Date().toISOString(),
    }))
  );

  await db.replaceAll(
    db.COLLECTIONS.coupons,
    COUPONS.map((c) => ({
      id: `cpn_${c.code}`,
      code: c.code,
      type: c.type,
      value: c.value,
      minSubtotal: c.minSubtotal || 0,
      maxDiscount: 0,
      collection: c.collection || '',
      description: c.description,
      usageLimit: 0,
      usageCount: 0,
      expiresAt: '',
      status: 'active',
      createdAt: new Date().toISOString(),
    }))
  );

  await db.replaceAll(db.COLLECTIONS.reviews, seedReviews());
  await db.replaceAll(db.COLLECTIONS.enquiries, []);
  await db.setDoc('dismissedEnquiries', []);
  await db.setDoc('dismissedAlerts', {});
  await db.replaceAll(db.COLLECTIONS.orders, []);
  await db.replaceAll(db.COLLECTIONS.customers, []);
  await db.replaceAll(db.COLLECTIONS.inventoryLog, []);
  await db.replaceAll(
    db.COLLECTIONS.media,
    CATALOG.flatMap((p) =>
      p.images.slice(0, 1).map((img) => ({
        id: db.newId('med'),
        src: img.src,
        ref: img.id,
        alt: img.alt,
        folder: 'products',
        usedBy: p.name,
        createdAt: new Date().toISOString(),
      }))
    )
  );

  await db.setDoc('settings', {
    business: {
      name: SITE.name,
      email: SITE.email,
      phone: SITE.phoneDisplay,
      phoneSecondary: SITE.phoneSecondaryDisplay || '',
      whatsapp: WHATSAPP_NUMBER,
      address: SITE.addressLines.join(' '),
      instagram: SITE.instagram,
      facebook: SITE.facebook,
    },
    store: {
      currency: COMMERCE.currency,
      taxRate: COMMERCE.taxRate * 100,
      shippingLabel: COMMERCE.shipping.label,
      shippingFlat: COMMERCE.shipping.flat,
      lowStockThreshold: COMMERCE.lowStockThreshold,
      maxQtyPerLine: COMMERCE.maxQtyPerLine,
    },
    whatsapp: {
      number: WHATSAPP_NUMBER,
      greeting: 'Hello, I would like to enquire about the following products:',
      closing: 'Please let me know about availability and delivery.',
    },
    seo: {
      title: `${SITE.name} — ${SITE.tagline}`,
      description: 'Parshiv Jewels, Surat — BIS-hallmarked rings, necklaces, earrings & bracelets.',
      shareImage: SITE.defaultOgImage,
    },
  });

  await db.setDoc('content', {
    announcement: {
      enabled: true,
      items: [
        'Complimentary Insured Shipping',
        'BIS Hallmarked',
        '30-Day Returns',
        'Certified Stones',
        `Order on WhatsApp ${SITE.phoneDisplay}`,
      ],
    },
    hero: {
      eyebrow: 'The House of Parshiv',
      titleLine1: 'Timeless Elegance,',
      titleLine2: 'Crafted to Shine',
      body: 'Exquisite jewellery designed to celebrate your beauty, your style, and your unforgettable moments — handcrafted in the heart of Surat.',
    },
    testimonials: TESTIMONIALS.map((t) => ({ id: db.newId('tst'), ...t, status: 'active' })),
    gallery: GALLERY_TILES.map((g) => ({ id: db.newId('gal'), ...g, status: 'active' })),
    newsletter: {
      title: 'First Look, Every Season',
      body: 'New collections, atelier stories and private previews — sent occasionally, never more than twice a month.',
    },
  });

  await db.setDoc('meta', { seedVersion: SEED_VERSION, seededAt: new Date().toISOString() });
  return true;
}
