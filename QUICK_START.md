# ⚡ Quick Start Reference Card

## 🔧 Environment Setup

Create `.env.local`:
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxxx
```

## 📦 Project Commands

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🗄️ Database Setup

1. **Create Supabase Project** at [supabase.com](https://supabase.com)
2. **Copy your credentials** from Settings → API
3. **Go to SQL Editor**
4. **Paste content from:** `SETUP_DATABASE.sql`
5. **Click Run**
6. **Done!** ✅

## 📁 Key Files

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Database table definitions |
| `src/server/supabase.ts` | Supabase client |
| `src/server/storage.supabase.ts` | Database operations |
| `SETUP_DATABASE.sql` | Schema setup |
| `SETUP_GUIDE.md` | Full setup guide |

## 🌐 App URLs

- **Dev App:** http://localhost:3000
- **Dashboard:** http://localhost:3000/admin
- **Inventory:** http://localhost:3000/inventory
- **POS:** http://localhost:3000/pos
- **Sales:** http://localhost:3000/sales
- **Reports:** http://localhost:3000/reports

## 👤 First Login

1. Go to http://localhost:3000/auth
2. Click Register
3. Create account with username & password
4. Login with credentials

## 🚨 Common Issues

### "Supabase not configured"
→ Check `.env.local` exists and has correct keys

### "Table doesn't exist"  
→ Run `SETUP_DATABASE.sql` in Supabase SQL editor

### App won't start
→ Run `npm install` first

### Port 3000 already in use
→ Run: `npm run dev -- -p 3001`

## 📚 Documentation

- **Setup:** Read [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Changes:** See [CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md)
- **Schema:** Check `shared/schema.ts`

## 🎯 That's It!

Everything you need is in:
- **Setup Guide:** `SETUP_GUIDE.md`
- **Database:** `SETUP_DATABASE.sql`
- **Code:** `src/` and `shared/`

No migrations. No complex setup. Just run it! 🚀
