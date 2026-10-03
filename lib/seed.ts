import dbConnect from './mongodb'
import User from './models/User'
import Category, { type CategoryGroup } from './models/Category'
import Product, { type ProductStatus, type ProductCondition } from './models/Product'
import Message from './models/Message'
import Report from './models/Report'
import { hashPassword } from './password'
import { slugify } from './slug'

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const CATEGORY_SEED: {
  name: string
  group: CategoryGroup
  image: string
  featured?: boolean
}[] = [
  { name: 'Buy & Sell', group: 'Buy & Sell', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80', featured: true },
  { name: 'Cars & Vehicles', group: 'Cars & Vehicles', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80', featured: true },
  { name: 'Real Estate', group: 'Real Estate', image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80', featured: true },
  { name: 'Jobs', group: 'Jobs', image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80', featured: true },
  { name: 'Services', group: 'Services', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80', featured: true },
  { name: 'Pets', group: 'Pets', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80', featured: true },
  { name: 'Community', group: 'Community', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80', featured: true },
  { name: 'Vacation Rentals', group: 'Vacation Rentals', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', featured: true },
  { name: 'Antiques & Collectibles', group: 'Antiques & Collectibles', image: 'https://picsum.photos/seed/antiques-collectibles/800/600', featured: true },

  // Sub-categories used by the tiles on the homepage
  { name: 'Furniture', group: 'Buy & Sell', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80' },
  { name: 'Home - Outdoor & Garden', group: 'Buy & Sell', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
  { name: 'Tools', group: 'Buy & Sell', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80' },
  { name: 'Phones', group: 'Buy & Sell', image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80' },
  { name: 'Cars & Trucks', group: 'Cars & Vehicles', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80' },
  { name: 'Classic Cars', group: 'Cars & Vehicles', image: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=800&q=80' },
  { name: "RV's, Campers & Trailers", group: 'Cars & Vehicles', image: 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Boats & Watercraft', group: 'Cars & Vehicles', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80' },
  { name: 'Motorcycles', group: 'Cars & Vehicles', image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80' },
  { name: 'Vehicle Parts, Tires, & Accessories', group: 'Cars & Vehicles', image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80' },
  { name: 'Heavy Equipment', group: 'Cars & Vehicles', image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80' },
  { name: 'ATVs & Snowmobiles', group: 'Cars & Vehicles', image: 'https://images.unsplash.com/photo-1517055729445-fa7d27394b48?auto=format&fit=crop&w=800&q=80' },
  { name: 'Apartments & Condos for Rent', group: 'Real Estate', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' },
  { name: 'Houses for Rent', group: 'Real Estate', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Houses for Sale', group: 'Real Estate', image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80' },

  // Antiques & Collectibles. This is a vertical of its own rather than a
  // sub-branch of Buy & Sell, so it gets its own group.
  //
  // Imagery below is seeded placeholder photography (picsum) so each category
  // renders distinctly on the homepage rails — the homepage skips categories
  // with an empty `image`. Swap these for real category photography when it
  // exists; nothing else depends on the URLs.
  ...(
    [
      'Watch',
      'Clock',
      'Coin',
      'Medal',
      'Bank Note',
      'Gemstone',
      'Antique',
      'Collectible',
      'Toys',
      'Art & Paintings',
      'Silver',
      'Gold',
      'Diamond',
      'Jewellery',
      'Scrap',
      'Vintage',
      'Garage Sale',
      'Electric Bulb/Tube',
      'Cutleries',
      'Porcelain/China Bone',
      'Soapstone',
      'Leather Goods',
      'Wooden Stuffs',
      'Unknown Item',
    ] as const
  ).map((name) => ({
    name,
    group: 'Antiques & Collectibles' as CategoryGroup,
    image: `https://picsum.photos/seed/${slugify(name)}/800/600`,
  })),
]

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

type ProductSeed = {
  title: string
  price: number
  priceOnRequest?: boolean
  location: string
  image: string
  category: string
  featured?: boolean
  urgent?: boolean
  condition?: ProductCondition
  status?: ProductStatus
  brand?: string
  description: string
  tags?: string[]
  seller?: { name: string; phone?: string; email?: string; location?: string; verified?: boolean }
}

export const PRODUCT_SEED: ProductSeed[] = [
  {
    title: 'J&L Interlocking Landscaping Grass Installation',
    price: 0,
    priceOnRequest: true,
    location: 'Brantford, Ontario',
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=500&q=80',
    category: 'Home - Outdoor & Garden',
    featured: true,
    description:
      'Professional interlocking stone and artificial grass installation. Free on-site estimate, fully insured crew, workmanship warranty on every job.',
    tags: ['landscaping', 'interlocking', 'grass'],
    seller: { name: 'J&L Landscaping', location: 'Brantford, Ontario', verified: true },
  },
  {
    title: 'Semidetached home for Rent - Townhouse',
    price: 2850,
    location: 'Brampton, Ontario',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=80',
    category: 'Houses for Rent',
    featured: true,
    description:
      '3 bedroom, 2.5 bath semidetached townhouse with finished basement, private driveway and fenced backyard. Available immediately.',
    tags: ['rent', 'townhouse'],
  },
  {
    title: 'Unit 107 - Lonsdale - Step-In Tub Home',
    price: 1715,
    location: 'North Vancouver, British Columbia',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=500&q=80',
    category: 'Apartments & Condos for Rent',
    featured: true,
    description:
      'Accessible one bedroom suite with step-in tub, wide doorways and elevator access. Heat and water included.',
    tags: ['accessible', 'apartment'],
  },
  {
    title: 'Aussiedoodles miniature puppies',
    price: 1800,
    location: 'Calgary, Alberta',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=500&q=80',
    category: 'Pets',
    featured: true,
    description:
      'Miniature Aussiedoodle puppies, vet checked, first shots and deworming done. Raised in-home with children.',
    tags: ['dogs', 'puppies'],
    seller: { name: 'Sunny Meadows Kennel', verified: true },
  },
  {
    title: 'ASUS ROG gaming computer - RTX 4070',
    price: 9700,
    location: 'Mississauga, Ontario',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=500&q=80',
    category: 'Phones',
    featured: true,
    condition: 'like-new',
    brand: 'ASUS',
    description:
      'ASUS ROG Strix build: Ryzen 7 7800X3D, RTX 4070 Ti, 32GB DDR5, 2TB NVMe. Still under warranty, receipt included.',
    tags: ['gaming', 'pc', 'rog'],
  },
  {
    title: 'Apple iPhone 12 Pro Max 512GB - Black',
    price: 0,
    priceOnRequest: true,
    location: 'Toronto, Ontario',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=500&q=80',
    category: 'Phones',
    condition: 'used',
    brand: 'Apple',
    description:
      'iPhone 12 Pro Max 512GB in graphite. Battery health 89%, unlocked, includes original box and cable.',
    tags: ['iphone', 'apple'],
  },
  {
    title: 'Decorative Candlesticks (set of 3)',
    price: 40,
    location: 'Victoria, British Columbia',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=500&q=80',
    category: 'Furniture',
    condition: 'used',
    description: 'Brass decorative candlesticks, set of three heights. No dents, light patina.',
    tags: ['decor', 'home'],
  },
  {
    title: 'The Ultimate Guide to Harry Potter - hardcover',
    price: 5,
    location: 'Ottawa, Ontario',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=500&q=80',
    category: 'Buy & Sell',
    condition: 'used',
    description: 'Hardcover companion guide in great condition. Pickup only.',
    tags: ['books'],
  },
  {
    title: '23" Faux Silk Scarf Wrap Shawl',
    price: 6,
    location: 'Montreal, Quebec',
    image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=500&q=80',
    category: 'Buy & Sell',
    condition: 'new',
    description: 'New with tags, faux silk wrap shawl. Several colours available.',
    tags: ['clothing', 'accessories'],
  },
  {
    title: 'Grey Fabric Sectional Sofa with Chaise',
    price: 899,
    location: 'Edmonton, Alberta',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=500&q=80',
    category: 'Furniture',
    condition: 'like-new',
    description:
      'Reversible sectional with chaise, pet-free and smoke-free home. Stain treated fabric. Delivery available for a fee.',
    tags: ['sofa', 'furniture'],
  },
  {
    title: '225/65R17 Winter Tires - set of 4',
    price: 25,
    location: 'Winnipeg, Manitoba',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=80',
    category: 'Vehicle Parts, Tires, & Accessories',
    condition: 'used',
    description: 'Set of four winter tires, 7/32 tread remaining. Rims not included.',
    tags: ['tires', 'winter'],
  },
  {
    title: 'Looking for 225/65 R17 Winter tires',
    price: 0,
    priceOnRequest: true,
    location: 'Iqaluit, Nunavut',
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=500&q=80',
    category: 'Vehicle Parts, Tires, & Accessories',
    description: 'Wanted: used set of 225/65 R17 winters. Cash ready, can pick up same day.',
    tags: ['wanted'],
  },
  {
    title: 'Suzuki Motorcycle owners manual',
    price: 10,
    location: 'Yellowknife, Northwest Territories',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=500&q=80',
    category: 'Motorcycles',
    condition: 'used',
    description: "Original Suzuki owner's manual, good condition, no missing pages.",
    tags: ['manual', 'suzuki'],
  },
  {
    title: 'Razor 200 side by side',
    price: 5000,
    location: 'Kelowna, British Columbia',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=500&q=80',
    category: 'ATVs & Snowmobiles',
    condition: 'used',
    description: 'Razor 200 side-by-side, low hours, recently serviced. Comes with spare belt.',
    tags: ['atv', 'utv'],
  },
  {
    title: 'Bright 1 Bedroom Apartment for Rent',
    price: 1895,
    location: 'Toronto, Ontario',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=500&q=80',
    category: 'Apartments & Condos for Rent',
    description:
      'Bright south-facing one bedroom with in-suite laundry, balcony and underground parking. Utilities extra.',
    tags: ['apartment', 'rent'],
  },
  {
    title: '2 Bedroom, 2 Bathroom Condo',
    price: 500,
    location: 'Surrey, British Columbia',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80',
    category: 'Apartments & Condos for Rent',
    description: 'Roommate share in a 2 bed / 2 bath condo. Utilities and internet included.',
    tags: ['roommate', 'condo'],
  },
  {
    title: 'Acoustic guitar - solid spruce top',
    price: 50,
    location: 'London, Ontario',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=500&q=80',
    category: 'Buy & Sell',
    condition: 'used',
    description: 'Dreadnought acoustic with solid spruce top. Fresh strings, plays well, small ding on the back.',
    tags: ['guitar', 'music'],
  },
  {
    title: 'Epiphone Acoustic Guitar',
    price: 150,
    location: 'Regina, Saskatchewan',
    image: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=500&q=80',
    category: 'Buy & Sell',
    condition: 'like-new',
    brand: 'Epiphone',
    description: 'Epiphone acoustic, barely played, includes gig bag and capo.',
    tags: ['guitar', 'music'],
  },
  {
    title: 'Rossignol 205cm waxless cross country skis',
    price: 150,
    location: 'Quebec City, Quebec',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=500&q=80',
    category: 'Buy & Sell',
    condition: 'used',
    brand: 'Rossignol',
    description: 'Rossignol waxless touring skis with bindings. Great for groomed trails.',
    tags: ['skis', 'winter'],
  },
  {
    title: 'GAMING PC - FOR SALE OR TRADE',
    price: 2000,
    location: 'Hamilton, Ontario',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=500&q=80',
    category: 'Buy & Sell',
    condition: 'used',
    urgent: true,
    description:
      'Mid-high gaming rig, will trade for a laptop plus cash. Ryzen 5 5600X / RTX 3060 / 16GB RAM / 1TB SSD.',
    tags: ['gaming', 'trade'],
  },
  {
    title: '225 65 17 winter rims only',
    price: 25,
    location: 'Halifax, Nova Scotia',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=80',
    category: 'Vehicle Parts, Tires, & Accessories',
    condition: 'used',
    description: 'Steel rims, 5x114.3 bolt pattern. Some surface rust, straight and true.',
    tags: ['rims'],
  },
  {
    title: 'Cane Corso puppies, health tested parents',
    price: 0,
    priceOnRequest: true,
    location: "St. John's, Newfoundland and Labrador",
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=500&q=80',
    category: 'Pets',
    description:
      'Cane Corso litter, both parents health tested and on site. Puppies raised with children, vet checked before pickup.',
    tags: ['dogs', 'puppies'],
  },
  {
    title: 'Mobile Massage - introductory offer',
    price: 0,
    priceOnRequest: true,
    location: 'Charlottetown, Prince Edward Island',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=500&q=80',
    category: 'Services',
    description:
      'Registered massage therapist offering mobile appointments. Introductory rate for first-time clients.',
    tags: ['massage', 'services'],
    seller: { name: 'Mobile RMT', verified: true },
  },
  {
    title: 'AZ Truck Driver Wanted - full time',
    price: 0,
    priceOnRequest: true,
    location: 'Whitehorse, Yukon',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=500&q=80',
    category: 'Jobs',
    description:
      'Hiring AZ licensed drivers for cross-border routes. Minimum 2 years experience, clean abstract required.',
    tags: ['hiring', 'driver'],
  },
]

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */

export type SeedResult = {
  admin: { email: string; created: boolean; name: string }
  categories: { inserted: number; total: number }
  products: { inserted: number; total: number }
  messages: { inserted: number }
  reports: { inserted: number }
}

/**
 * Idempotent seed. Safe to call repeatedly: everything is matched on a unique
 * key (user email / category slug / product slug) and upserted.
 */
export async function runSeed(): Promise<SeedResult> {
  await dbConnect()

  /* ---- admin user ---- */
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@kijiji.local').toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123'
  const name = process.env.SEED_ADMIN_NAME || 'Super Admin'

  const existingAdmin = await User.findOne({ email })
  let created = false
  if (!existingAdmin) {
    await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role: 'admin',
      avatarColor: '#2563eb',
    })
    created = true
  } else if (!existingAdmin.active || existingAdmin.role !== 'admin') {
    existingAdmin.role = 'admin'
    existingAdmin.active = true
    await existingAdmin.save()
  }

  // A second, lower-privilege demo account so role gating is visible.
  const editorEmail = 'editor@kijiji.local'
  if (!(await User.findOne({ email: editorEmail }))) {
    await User.create({
      name: 'Content Editor',
      email: editorEmail,
      passwordHash: await hashPassword('editor123'),
      role: 'editor',
      avatarColor: '#7c3aed',
    })
  }

  /* ---- categories ---- */
  // NOTE: bulkWrite needs plain operation objects, not mongoose Query instances.
  // The explicit array type gives TS the literal unions it needs for `group`.
  const catOps: Parameters<typeof Category.bulkWrite>[0] = CATEGORY_SEED.map((c, i) => {
    const slug = slugify(c.name)
    return {
      updateOne: {
        filter: { slug },
        update: {
          $set: {
            name: c.name,
            group: c.group,
            image: c.image,
            featured: c.featured ?? false,
            order: i,
            active: true,
          },
        },
        upsert: true,
      },
    }
  })
  const catRes = await Category.bulkWrite(catOps)
  const categories = await Category.find().lean()
  const catBySlug = new Map(categories.map((c) => [c.slug, c._id]))

  /* ---- products ---- */
  const prodOps: Parameters<typeof Product.bulkWrite>[0] = PRODUCT_SEED.map((p) => {
    const slug = slugify(p.title)
    const catId = catBySlug.get(slugify(p.category)) ?? null
    return {
      updateOne: {
        filter: { slug },
        update: {
          $set: {
            title: p.title,
            description: p.description,
            price: p.price,
            priceOnRequest: p.priceOnRequest ?? false,
            category: catId,
            location: p.location,
            images: [p.image],
            brand: p.brand ?? '',
            condition: p.condition ?? 'used',
            status: p.status ?? 'active',
            featured: p.featured ?? false,
            urgent: p.urgent ?? false,
            tags: p.tags ?? [],
            seller: {
              name: p.seller?.name ?? 'Kijiji Member',
              phone: p.seller?.phone ?? '',
              email: p.seller?.email ?? '',
              location: p.seller?.location ?? p.location,
              verified: p.seller?.verified ?? false,
            },
          },
          $setOnInsert: { views: Math.floor(Math.random() * 900) + 40 },
        },
        upsert: true,
      },
    }
  })
  const prodRes = await Product.bulkWrite(prodOps)
  const productTotal = await Product.countDocuments()

  /* ---- demo inbox + reports (only when empty) ---- */
  let messagesInserted = 0
  if ((await Message.countDocuments()) === 0) {
    const first = await Product.findOne().lean()
    await Message.create([
      {
        product: first?._id ?? null,
        productTitle: first?.title ?? 'General enquiry',
        name: 'Dana Whitfield',
        email: 'dana.whitfield@example.com',
        phone: '+1 416 555 0132',
        body: 'Hi - is this still available? I can pick up this weekend if the price is firm.',
        status: 'unread',
      },
      {
        product: first?._id ?? null,
        productTitle: first?.title ?? 'General enquiry',
        name: 'Marcus Lee',
        email: 'marcus.lee@example.com',
        body: 'Could you tell me a bit more about the condition and whether delivery is possible?',
        status: 'read',
      },
    ])
    messagesInserted = 2
  }

  let reportsInserted = 0
  if ((await Report.countDocuments()) === 0) {
    const second = await Product.findOne().skip(1).lean()
    await Report.create([
      {
        product: second?._id ?? null,
        productTitle: second?.title ?? 'Unknown listing',
        reason: 'wrong-category',
        details: 'This looks like it was posted in the wrong category.',
        reporterEmail: 'community@example.com',
        status: 'open',
      },
    ])
    reportsInserted = 1
  }

  return {
    admin: { email, created, name },
    categories: {
      inserted: catRes.upsertedCount ?? 0,
      total: await Category.countDocuments(),
    },
    products: {
      inserted: prodRes.upsertedCount ?? 0,
      total: productTotal,
    },
    messages: { inserted: messagesInserted },
    reports: { inserted: reportsInserted },
  }
}
