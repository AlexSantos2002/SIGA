/**
 * Representa o animal enviado pela base de dados.
 */
export interface Animal {
  id: string;
  name: string;

  species: {
    id: string;
    name: string;
  } | null;

  breed: {
    id: string;
    name: string;
  } | null;

  gender: string | null;
  birthDate: string | null;
  available: boolean;
  createdAt: string;
}
