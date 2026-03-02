
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create marksheets table
CREATE TABLE public.marksheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  image_url TEXT,
  extracted_data JSONB DEFAULT '[]'::jsonb,
  gpa NUMERIC(4,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marksheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own marksheets" ON public.marksheets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own marksheets" ON public.marksheets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own marksheets" ON public.marksheets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own marksheets" ON public.marksheets FOR DELETE USING (auth.uid() = user_id);

-- Create cgpa_records table
CREATE TABLE public.cgpa_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  cgpa NUMERIC(4,2) NOT NULL DEFAULT 0,
  total_credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cgpa_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cgpa" ON public.cgpa_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cgpa" ON public.cgpa_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cgpa" ON public.cgpa_records FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_marksheets_updated_at BEFORE UPDATE ON public.marksheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cgpa_records_updated_at BEFORE UPDATE ON public.cgpa_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for marksheets
INSERT INTO storage.buckets (id, name, public) VALUES ('marksheets', 'marksheets', false);

-- Storage policies
CREATE POLICY "Users can upload own marksheets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marksheets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own marksheets" ON storage.objects FOR SELECT USING (bucket_id = 'marksheets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own marksheets" ON storage.objects FOR DELETE USING (bucket_id = 'marksheets' AND (storage.foldername(name))[1] = auth.uid()::text);
