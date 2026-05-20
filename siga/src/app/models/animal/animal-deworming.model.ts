/**
 * Representa uma desparasitação associada a um animal.
 */
export interface AnimalDeworming {
  id: string;
  animalId: string;
  organizationId: string;

  type: string;
  dateDone: string;
  nextDueDate: string | null;

  productName: string | null;
  notes: string | null;

  createdAt: string;
}