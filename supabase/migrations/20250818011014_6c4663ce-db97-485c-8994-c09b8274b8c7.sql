-- Populate subscription_types table with default subscription types
INSERT INTO public.subscription_types (name, duration_months) VALUES 
  ('monthly', 1),
  ('quarterly', 3),
  ('yearly', 12);