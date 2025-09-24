-- Add payment_complete column to members table
ALTER TABLE public.members 
ADD COLUMN payment_complete BOOLEAN NOT NULL DEFAULT false;