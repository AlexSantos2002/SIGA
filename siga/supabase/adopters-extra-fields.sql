-- Extra fields required by the private adopters pages.
-- Run this in Supabase SQL editor before using the expanded adopter form.

alter table public.adopters
  add column if not exists document_type text,
  add column if not exists document_number text,
  add column if not exists birth_date date,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists postal_code text,
  add column if not exists housing_type text,
  add column if not exists has_outdoor_space boolean not null default false,
  add column if not exists has_other_animals boolean not null default false,
  add column if not exists other_animals_description text,
  add column if not exists household_members text,
  add column if not exists employment_status text,
  add column if not exists experience_with_animals text,
  add column if not exists preferred_species text,
  add column if not exists adoption_motivation text,
  add column if not exists notes text,
  add column if not exists is_flagged boolean not null default false,
  add column if not exists flag_reason text,
  add column if not exists flagged_at timestamptz;

create index if not exists adopters_organization_flagged_idx
  on public.adopters (organization_id, is_flagged);

notify pgrst, 'reload schema';
