# Deployment Guide

This guide covers deploying Cosmos Builder's Toolkit to **Vercel** with **Supabase** for database and authentication.

## Prerequisites

- [Vercel account](https://vercel.com/signup)
- [Supabase account](https://supabase.com/dashboard)
- Your domain with DNS access (optional)

---

## Step 1: Set Up Supabase Database

### 1.1 Create Project (if not already done)
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Create a new project or use existing one

### 1.2 Run Database Migrations

Go to **SQL Editor** in Supabase and run the following SQL:

```sql
-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create worlds table
CREATE TABLE public.worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on worlds
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;

-- Users can view their own worlds
CREATE POLICY "Users can view own worlds"
  ON public.worlds FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create worlds
CREATE POLICY "Users can create worlds"
  ON public.worlds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own worlds
CREATE POLICY "Users can update own worlds"
  ON public.worlds FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own worlds
CREATE POLICY "Users can delete own worlds"
  ON public.worlds FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for worlds updated_at
CREATE TRIGGER update_worlds_updated_at
  BEFORE UPDATE ON public.worlds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create worksheets table for tool data
CREATE TABLE public.worksheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL,
  title TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on worksheets
ALTER TABLE public.worksheets ENABLE ROW LEVEL SECURITY;

-- Users can view their own worksheets
CREATE POLICY "Users can view own worksheets"
  ON public.worksheets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create worksheets
CREATE POLICY "Users can create worksheets"
  ON public.worksheets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own worksheets
CREATE POLICY "Users can update own worksheets"
  ON public.worksheets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own worksheets
CREATE POLICY "Users can delete own worksheets"
  ON public.worksheets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for worksheets updated_at
CREATE TRIGGER update_worksheets_updated_at
  BEFORE UPDATE ON public.worksheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Step 2: Configure Google OAuth in Supabase

1. **In Supabase Dashboard**, go to **Authentication** > **Providers**

2. **Enable Google provider**
   - Toggle Google to "Enabled"

3. **Create Google OAuth credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create or select a project
   - Go to **APIs & Services** > **OAuth consent screen**
     - Choose "External" user type
     - Fill in app name, support email, etc.
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Choose **Web application**
   - Add authorized redirect URI:
     - `https://sgoefchwjumzgfupqdzt.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**

4. **Add credentials to Supabase**
   - Back in Supabase **Authentication** > **Providers** > **Google**
   - Paste the Client ID and Client Secret
   - Save

---

## Step 3: Configure Supabase URL Settings

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL**: `https://your-domain.vercel.app` (or your custom domain)
3. Add to **Redirect URLs**:
   - `https://your-domain.vercel.app/`
   - `https://your-domain.vercel.app/auth`
   - `http://localhost:8080/` (for local development)

---

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**

2. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

3. **Click "Add New" > "Project"**

4. **Import your repository**

5. **Configure Settings**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

6. **Configure Environment Variables**

   | Variable | Value |
   |----------|-------|
   | `VITE_SUPABASE_URL` | `https://sgoefchwjumzgfupqdzt.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key |
   | `VITE_SUPABASE_PROJECT_ID` | `sgoefchwjumzgfupqdzt` |

7. **Deploy**

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

---

## Step 5: Configure Custom Domain (Optional)

### In Vercel:
1. Go to your project **Settings** > **Domains**
2. Add your subdomain: `toolkit.yourdomain.com`
3. Vercel will provide DNS records to add

### Update Supabase:
1. Go to **Authentication** > **URL Configuration**
2. Update **Site URL** to your custom domain
3. Add custom domain to **Redirect URLs**

---

## Local Development

1. **Copy the example env file**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your Supabase credentials** in `.env`

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```

5. The app will be available at `http://localhost:8080`

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | No | Supabase project reference |

---

## Troubleshooting

### Google OAuth not working
- Verify redirect URI in Google Console matches: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
- Check that Google provider is enabled in Supabase
- Ensure Site URL and Redirect URLs are configured in Supabase

### Database errors
- Make sure all migrations have been run in SQL Editor
- Check RLS policies are enabled

### Build fails on Vercel
- Ensure all `VITE_*` environment variables are set
- Check build logs for specific errors
