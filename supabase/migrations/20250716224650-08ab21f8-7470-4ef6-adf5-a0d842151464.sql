-- Create subscription types table
CREATE TABLE public.subscription_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  duration_months INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create members table  
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subscription_type_id UUID NOT NULL REFERENCES public.subscription_types(id),
  amount_paid DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mpesa')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'due', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscription_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription_types (public read access)
CREATE POLICY "Everyone can view subscription types" 
ON public.subscription_types 
FOR SELECT 
USING (true);

-- Create policies for members (full access for now)
CREATE POLICY "Full access to members" 
ON public.members 
FOR ALL 
USING (true);

-- Insert default subscription types
INSERT INTO public.subscription_types (name, duration_months) VALUES 
('monthly', 1),
('quarterly', 3),
('yearly', 12);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();