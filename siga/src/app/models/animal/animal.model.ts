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
  status: string | null;

  generalNotes: string | null;
  medicalNotes: string | null;

  sterilizationStatus: string | null;
  sterilizationDate: string | null;

  hasMicrochip: boolean;
  microchipNumber: string | null;
  microchipDate: string | null;

  createdAt: string;
}