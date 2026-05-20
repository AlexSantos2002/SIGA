/**
 * Representa os dados necessários para registar ou atualizar um animal.
 */
export interface RegisterAnimalRequest {
  name: string;
  speciesName: string;
  breedName: string;
  gender: string;
  birthDate: string | null;
  status: string;

  generalNotes?: string | null;
  medicalNotes?: string | null;

  sterilizationStatus?: string | null;
  sterilizationDate?: string | null;

  hasMicrochip?: boolean;
  microchipNumber?: string | null;
  microchipDate?: string | null;
}