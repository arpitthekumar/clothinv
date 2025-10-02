# Supabase Setup Guide for ClothInv

## Current Status
Your application is configured to use Supabase but needs proper environment setup and database initialization.

## Issues Found
1. ❌ Missing environment variables
2. ❌ Database tables may not exist
3. ✅ Supabase client code is properly configured
4. ✅ Dependencies are installed

## Step-by-Step Setup

### 1. Create Your Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Sign in
3. Create a new project
4. Wait for the project to be ready (this takes a few minutes)

### 2. Get Your Project Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://abcdefghij.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **service_role key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Configure Environment Variables
Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Alternative public environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Session Configuration
SESSION_SECRET=your-very-long-random-secret-string-here-at-least-32-characters
```

**⚠️ Important**: Replace the placeholder values with your actual Supabase credentials!

### 4. Set Up Database Tables
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `setup-supabase.sql` (created in your project root)
4. Paste and run the SQL script
5. This will create all necessary tables and insert default data

### 5. Test Your Setup
Run the test script to verify everything is working:

```bash
node test-supabase.js
```

This will:
- ✅ Check if environment variables are set
- ✅ Test database connection
- ✅ Verify all tables are accessible

### 6. Start Your Application
```bash
npm run dev
```

## Table Structure Created
The following tables will be created:
- **users** - User accounts (admin/employee roles)
- **categories** - Product categories
- **products** - Inventory items
- **sales** - Sales transactions
- **stock_movements** - Stock tracking
- **sync_status** - For offline sync functionality

## Default Login
A default admin user will be created:
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin`

⚠️ **Security**: Change this password immediately in production!

## Troubleshooting

### "Supabase not configured" Error
- Check that all environment variables are set correctly
- Verify the project URL and keys in your Supabase dashboard
- Restart your development server after adding environment variables

### "Table 'users' doesn't exist" Error
- Run the SQL script from `setup-supabase.sql` in your Supabase SQL editor
- Check that your database user has proper permissions

### "Invalid API key" Error
- Double-check your anon key in the Supabase dashboard
- Make sure you're using the correct project's credentials

## Next Steps
1. Set up Row Level Security (RLS) policies in Supabase for production
2. Configure proper authentication if needed
3. Set up database backups
4. Configure environment variables for production deployment

## Files Created
- `setup-supabase.sql` - Database schema setup
- `test-supabase.js` - Connection test script
- `SUPABASE_SETUP.md` - This setup guide
