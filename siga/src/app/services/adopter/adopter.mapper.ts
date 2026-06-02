import { Adopter } from '../../models/adopter/adopter.model';
import { RegisterAdopterRequest } from '../../models/adopter/register-adopter-request';
import { UpdateAdopterRequest } from '../../models/adopter/update-adopter-request';

export interface AdopterRow {
  id: string;
  name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  document_type?: string | null;
  document_number?: string | null;
  birth_date?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  housing_type?: string | null;
  has_outdoor_space?: boolean | null;
  has_other_animals?: boolean | null;
  other_animals_description?: string | null;
  household_members?: string | null;
  employment_status?: string | null;
  experience_with_animals?: string | null;
  preferred_species?: string | null;
  adoption_motivation?: string | null;
  notes?: string | null;
  is_flagged?: boolean | null;
  flag_reason?: string | null;
  flagged_at?: string | null;
  created_at: string;
}

export interface AdopterPayload {
  name: string;
  last_name: string;
  email: string;
  phone: string | null;
  document_type: string | null;
  document_number: string | null;
  birth_date: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  housing_type: string | null;
  has_outdoor_space: boolean;
  has_other_animals: boolean;
  other_animals_description: string | null;
  household_members: string | null;
  employment_status: string | null;
  experience_with_animals: string | null;
  preferred_species: string | null;
  adoption_motivation: string | null;
  notes: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  flagged_at: string | null;
}

export function mapAdopterRow(row: AdopterRow): Adopter {
  return {
    id: row.id,
    name: row.name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    documentType: row.document_type,
    documentNumber: row.document_number,
    birthDate: row.birth_date,
    address: row.address,
    city: row.city,
    postalCode: row.postal_code,
    housingType: row.housing_type,
    hasOutdoorSpace: row.has_outdoor_space ?? false,
    hasOtherAnimals: row.has_other_animals ?? false,
    otherAnimalsDescription: row.other_animals_description,
    householdMembers: row.household_members,
    employmentStatus: row.employment_status,
    experienceWithAnimals: row.experience_with_animals,
    preferredSpecies: row.preferred_species,
    adoptionMotivation: row.adoption_motivation,
    notes: row.notes,
    isFlagged: row.is_flagged ?? false,
    flagReason: row.flag_reason,
    flaggedAt: row.flagged_at,
    createdAt: row.created_at,
  };
}

export function buildAdopterPayload(
  request: RegisterAdopterRequest | UpdateAdopterRequest,
): AdopterPayload {
  const isFlagged = request.isFlagged ?? false;

  return {
    name: request.name.trim(),
    last_name: request.lastName.trim(),
    email: request.email.trim(),
    phone: toNullableString(request.phone),
    document_type: toNullableString(request.documentType),
    document_number: toNullableString(request.documentNumber),
    birth_date: toNullableString(request.birthDate),
    address: toNullableString(request.address),
    city: toNullableString(request.city),
    postal_code: toNullableString(request.postalCode),
    housing_type: toNullableString(request.housingType),
    has_outdoor_space: request.hasOutdoorSpace ?? false,
    has_other_animals: request.hasOtherAnimals ?? false,
    other_animals_description: toNullableString(request.otherAnimalsDescription),
    household_members: toNullableString(request.householdMembers),
    employment_status: toNullableString(request.employmentStatus),
    experience_with_animals: toNullableString(request.experienceWithAnimals),
    preferred_species: toNullableString(request.preferredSpecies),
    adoption_motivation: toNullableString(request.adoptionMotivation),
    notes: toNullableString(request.notes),
    is_flagged: isFlagged,
    flag_reason: isFlagged ? toNullableString(request.flagReason) : null,
    flagged_at: isFlagged ? new Date().toISOString() : null,
  };
}

function toNullableString(value?: string | null): string | null {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
}
