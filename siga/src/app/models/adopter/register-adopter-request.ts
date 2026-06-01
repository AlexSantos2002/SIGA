export interface RegisterAdopterRequest {
  name: string;
  lastName: string;
  email: string;
  phone?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  birthDate?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  housingType?: string | null;
  hasOutdoorSpace?: boolean;
  hasOtherAnimals?: boolean;
  otherAnimalsDescription?: string | null;
  householdMembers?: string | null;
  employmentStatus?: string | null;
  experienceWithAnimals?: string | null;
  preferredSpecies?: string | null;
  adoptionMotivation?: string | null;
  notes?: string | null;
  isFlagged?: boolean;
  flagReason?: string | null;
}
