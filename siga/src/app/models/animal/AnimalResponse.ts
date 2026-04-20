/**
 * Representa o animal enviado
 * pela base de dados
 */
export interface AnimalResponse {
  id: number;
  name: string;
  species: string;
  breed: string
  gender: string;
  birthDate: string;
  available: boolean;
  createdAt: string;
}
