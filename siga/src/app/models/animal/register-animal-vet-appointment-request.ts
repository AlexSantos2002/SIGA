/**
 * Representa os dados necessários para registar uma consulta veterinária.
 */
export interface RegisterAnimalVetAppointmentRequest {
  animalId: string;

  appointmentDate: string;
  reason: string;

  clinicName?: string | null;
  veterinarianName?: string | null;

  result?: string | null;
  nextAppointmentDate?: string | null;
  notes?: string | null;
}