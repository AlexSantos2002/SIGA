/**
 * Utilizado para filtrar animais
 */
export interface AnimalFilters {
  organizationId: string;
  species?: string;
  gender?: string;
  available?: boolean;
  breedId?: string;
}
