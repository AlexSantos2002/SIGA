/**
 * Representa uma consulta veterinária associada a um animal.
 */
export interface AnimalVetAppointment {
  id: string;
  animalId: string;
  organizationId: string;

  appointmentDate: string;
  reason: string;

  clinicName: string | null;
  veterinarianName: string | null;

  result: string | null;
  nextAppointmentDate: string | null;
  notes: string | null;

  createdAt: string;
}