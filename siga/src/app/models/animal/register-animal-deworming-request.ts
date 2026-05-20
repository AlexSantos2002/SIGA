/**
 * Representa os dados necessários para registar uma desparasitação.
 */
export interface RegisterAnimalDewormingRequest {
  animalId: string;

  type: string;
  dateDone: string;
  nextDueDate?: string | null;

  productName?: string | null;
  notes?: string | null;
}