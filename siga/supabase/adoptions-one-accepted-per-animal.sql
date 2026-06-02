-- Prevents the same animal from having more than one accepted adoption.
-- Run this in the Supabase SQL Editor.

CREATE UNIQUE INDEX IF NOT EXISTS adoptions_one_accepted_per_animal_idx
ON public.adoptions (organization_id, animal_id)
WHERE status = 'aceita';
