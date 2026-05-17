/**
 * Utilizado para filtrar animais
 */
export interface AnimalFilters {
  species?: string;
  gender?: string;
  available?: boolean;
  status?: string;
  breedId?: string;
}