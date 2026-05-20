/**
 * Representa os dados necessários para registar uma vacina de um animal.
 */
export interface RegisterAnimalVaccineRequest {
  animalId: string;

  name: string;
  status: string;

  dateTaken?: string | null;
  scheduledDate?: string | null;
  nextDueDate?: string | null;

  notes?: string | null;
}