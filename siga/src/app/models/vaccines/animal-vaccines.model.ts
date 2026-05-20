/**
 * Representa uma vacina associada a um animal.
 */
export interface AnimalVaccine {
  id: string;
  animalId: string;
  organizationId: string;

  name: string;
  status: string;

  dateTaken: string | null;
  scheduledDate: string | null;
  nextDueDate: string | null;

  notes: string | null;
  createdAt: string;
}