# 🚀 ClothInv - Project Setup Guide

This guide will help you set up the entire **ClothInv** project from scratch.

---

## 📋 Prerequisites

Before starting, make sure you have:

- **Node.js** (v18+) and **npm** installed
- **Supabase account** (free tier available at [supabase.com](https://supabase.com))
- **Git** installed

---

## 🔧 Step 1: Supabase Setup

### 1.1 Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `clothinv` (or your preference)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to you (e.g., `Singapore` for Asia)
4. Click **Create new project** and wait for it to initialize

### 1.2 Get Your Credentials
Once the project is created:
1. Go to **Settings** → **API** (left sidebar)
2. Copy these values and save them somewhere safe:
   - **Project URL** → This is your `SUPABASE_URL`
   - **anon public** key → This is your `SUPABASE_ANON_KEY`
   - **service_role secret** key → This is your `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Initialize Database Schema
1. Go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy all content from `SETUP_DATABASE.sql` file in your project
4. Paste it into the SQL editor
5. Click **Run** button
6. Wait for all tables to be created (you should see "Success" messages)

✅ Your database is now ready!

---

## 🎯 Step 2: Project Setup

### 2.1 Clone/Setup Project Files
If you haven't already:
```bash
cd c:\Users\SAMSU\Desktop\2026\wtscloth\clothinv-new
npm install
```

### 2.2 Create Environment File
Create a `.env.local` file in the project root:

```env
# ==================== SUPABASE ====================
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ==================== NEXT.JS ====================
NODE_ENV=development

# ==================== OPTIONAL ====================
# RAZORPAY_KEY_ID=your_key_here (for payments)
# RAZORPAY_KEY_SECRET=your_secret_here
```

⚠️ **Important**: Replace the values with your actual Supabase credentials from Step 1.2

### 2.3 Install Dependencies
```bash
npm install
```

### 2.4 Run Development Server
```bash
npm run dev
```

The app should now be running at: **http://localhost:3000**

---

## 📁 Project Structure

```
clothinv-new/
├── shared/
│   └── schema.ts          ← All database table definitions (TypeScript)
├── src/
│   ├── server/
│   │   ├── supabase.ts    ← Supabase client setup
│   │   └── storage.supabase.ts  ← Database operations (CRUD)
│   ├── app/               ← Next.js pages/routes
│   ├── components/        ← React components
│   ├── lib/               ← Utilities & helpers
│   └── types/             ← TypeScript types
├── public/                ← Static assets
├── SETUP_DATABASE.sql     ← Database schema (ONE FILE - all you need!)
├── package.json           ← Dependencies
└── README.md
```

### Key Files to Know:

- **`shared/schema.ts`** - Defines all 20 database tables and TypeScript types
- **`src/server/storage.supabase.ts`** - Contains all database operations (CRUD)
- **`SETUP_DATABASE.sql`** - The ONLY SQL file you need to initialize everything
- **`.env.local`** - Your Supabase credentials (never commit this!)

---

## 🗄️ Database Tables Overview

The system uses **20 main tables**:

### Core Tables
| Table | Purpose |
|-------|---------|
| `users` | Employee/admin accounts |
| `categories` | Product categories |
| `products` | Inventory items |
| `customers` | Customer information |

### Sales & Orders
| Table | Purpose |
|-------|---------|
| `sales` | Sales transactions |
| `sale_items` | Individual items in each sale |
| `sales_returns` | Return records |
| `sales_return_items` | Individual returned items |

### Purchasing
| Table | Purpose |
|-------|---------|
| `suppliers` | Vendor information |
| `supplier_products` | Product-supplier mapping |
| `purchase_orders` | PO records |
| `purchase_order_items` | Items in each PO |

### Tracking & History
| Table | Purpose |
|-------|---------|
| `stock_movements` | Stock in/out history |
| `product_cost_history` | Cost tracking |
| `product_price_history` | Price changes |
| `sync_status` | Offline sync tracking |

### Additional
| Table | Purpose |
|-------|---------|
| `promotions` | Discount promotions |
| `promotion_targets` | Promo product/category links |
| `discount_coupons` | Coupon codes |
| `payments` | Payment records (Razorpay, etc.) |

---

## ✨ First Time Login

Once the app is running:

1. **Create your first user** (admin):
   - Go to **http://localhost:3000/auth**
   - Click **Register**
   - Create account with:
     - Username: `admin`
     - Password: Your choice
     - Full Name: Your name
   - It will automatically create you as `admin` role

2. **Login** with your credentials

3. **You're in!** 🎉
   - Dashboard will show sales, inventory stats
   - Navigate to **Inventory** to add products
   - Use **POS** for sales transactions

---

## 🐛 Troubleshooting

### Issue: "Supabase not configured" error
**Solution:**
- Check `.env.local` exists in project root
- Verify all three keys are correct:
  - `SUPABASE_URL` should start with `https://`
  - `SUPABASE_ANON_KEY` should be ~40 characters
  - `SUPABASE_SERVICE_ROLE_KEY` should be ~40 characters
- Restart the dev server: `npm run dev`

### Issue: Database tables don't exist
**Solution:**
- Go to Supabase SQL Editor
- Run `SETUP_DATABASE.sql` again
- Make sure you see "Success" for each table creation

### Issue: Authentication not working
**Solution:**
- Create a test user in the app
- Check Supabase → **Table Editor** → `users` table
- Make sure your new user appears there

### Issue: Can't connect to Supabase
**Solution:**
- Check your internet connection
- Verify Supabase project is running (check Supabase dashboard)
- Try restarting the dev server

---

## 🚀 Building for Production

When ready to deploy:

```bash
npm run build
npm run start
```

Then deploy to your hosting (Vercel, AWS, etc.)

---

## 📚 Key Technologies Used

- **Frontend**: React 19, Next.js 15, TailwindCSS
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Direct Supabase PostgREST API (no external ORM)
- **Validation**: Zod
- **State Management**: React Query (TanStack)
- **Forms**: React Hook Form

---

## 🔒 Security Notes

- ✅ Never commit `.env.local` to git
- ✅ Use `SUPABASE_ANON_KEY` in browser/frontend
- ✅ Use `SUPABASE_SERVICE_ROLE_KEY` only on server
- ✅ Enable Row Level Security (RLS) in Supabase for production
- ✅ Keep your database password strong

---

## 📞 Need Help?

- Check Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Project README: See [README.md](README.md)

---

**Happy coding! 🎉**
