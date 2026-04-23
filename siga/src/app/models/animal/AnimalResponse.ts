/**
 * Representa o animal enviado
 * pela base de dados
 */
export interface AnimalResponse {
  id: number;
  name: string;
  species: {
    id: string,
    name: string
  };
  breed: {
    id: string,
    name: string
  }
  gender: string;
  birthDate: string;
  available: boolean;
  createdAt: string;
}
