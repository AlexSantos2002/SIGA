/**
 * Utilizado para registar um novo animal
 */
export interface RegisterAnimalRequest {
  name: string;
  speciesName: string;
  breedName: string;
  gender: string;
  birthDate: string | null;
  status: string;
}