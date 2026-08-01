import { describe, expect, it } from 'vitest';

import { Animal } from '../../models/animal/animal.model';
import { createAnimalReportPdf, getAnimalReportFilename } from './animal-report-pdf';

const animal: Animal = {
  id: 'animal-1',
  name: 'Patinhas & Companhia',
  organizationName: 'Associação Patas Felizes',
  species: { id: 'species-1', name: 'Cão' },
  breed: { id: 'breed-1', name: 'Sem raça definida' },
  gender: 'male',
  birthDate: '2022-04-10',
  available: true,
  status: 'por_adotar',
  generalNotes: 'Animal sociável e habituado a crianças.',
  medicalNotes: 'Sem alergias conhecidas.',
  sterilizationStatus: 'realizada',
  sterilizationDate: '2024-02-01',
  hasMicrochip: true,
  microchipNumber: '620000000000001',
  microchipDate: '2024-02-01',
  imagePath: null,
  createdAt: '2024-01-10T10:30:00Z',
};

describe('animal report PDF', () => {
  it('creates a paginated PDF containing every report section', () => {
    const report = createAnimalReportPdf({
      organizationName: 'Associação Patas Felizes',
      animal,
      vaccines: Array.from({ length: 8 }, (_, index) => ({
        id: `vaccine-${index}`,
        animalId: animal.id,
        organizationId: 'organization-1',
        name: `Vacina ${index + 1}`,
        status: 'tomada',
        dateTaken: '2025-01-15',
        scheduledDate: null,
        nextDueDate: '2026-01-15',
        notes: 'Registo de validação do relatório.',
        createdAt: '2025-01-15T10:00:00Z',
      })),
      dewormingRecords: [],
      vetAppointments: [],
      acceptedAdoption: null,
      generatedAt: new Date('2026-08-01T10:00:00Z'),
    });

    expect(report.getNumberOfPages()).toBeGreaterThan(1);
    expect(report.output('arraybuffer').byteLength).toBeGreaterThan(5_000);
  });

  it('creates a safe, predictable filename', () => {
    expect(getAnimalReportFilename('Patinhas & Companhia')).toBe(
      'relatorio-siga-patinhas-companhia.pdf',
    );
  });
});
