/**
 * Utilizado para registar um novo animal
 */
export interface UpdateAnimalRequest {
  name?: string,
  speciesId?: string,
  breedId?: string,
  gender?: string,
  birthDate?: string,
  available?: boolean,
}
