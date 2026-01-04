# Supabase Configuration

Create a `.env.local` file (or `.env`) with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to Project Settings > API
3. Copy the "Project URL" as `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "anon public" key as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Setup

Run this SQL in Supabase SQL Editor to create the required tables:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timers table
CREATE TABLE timers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timer_type TEXT NOT NULL DEFAULT 'countdown' CHECK (timer_type IN ('countdown', 'countup')),
  repeat_type TEXT NOT NULL DEFAULT 'none' CHECK (repeat_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  color TEXT NOT NULL DEFAULT '#ef4444',
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timer_shares table
CREATE TABLE timer_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timer_id UUID REFERENCES timers(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(timer_id, shared_with_user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_shares ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Timers policies
CREATE POLICY "Users can view own timers" ON timers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public timers" ON timers
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own timers" ON timers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timers" ON timers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own timers" ON timers
  FOR DELETE USING (auth.uid() = user_id);

-- Timer shares policies
CREATE POLICY "Users can view shares for their timers" ON timer_shares
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM timers WHERE id = timer_id
    ) OR auth.uid() = shared_with_user_id
  );

CREATE POLICY "Timer owners can manage shares" ON timer_shares
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM timers WHERE id = timer_id
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_timers_user_id ON timers(user_id);
CREATE INDEX idx_timers_share_code ON timers(share_code) WHERE share_code IS NOT NULL;
CREATE INDEX idx_timer_shares_timer_id ON timer_shares(timer_id);
CREATE INDEX idx_timer_shares_shared_with ON timer_shares(shared_with_user_id);
```

## Authentication Settings

In Supabase Dashboard > Authentication > Settings:

1. Enable Email provider
2. (Optional) Enable Google, GitHub providers for social login
3. Set Site URL to your production URL (or http://localhost:3000 for local dev)
4. Add redirect URLs:
   - http://localhost:3000/api/auth/callback
   - https://your-production-url.com/api/auth/callback
