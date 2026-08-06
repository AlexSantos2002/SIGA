import { Injectable } from '@angular/core';

import { AuthenticationError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';
import { Animal } from '../../models/animal/animal.model';
import { retryAsync, withTimeout } from '../../utils/utils';
import { AdoptionService } from '../adoption/adoption.service';
import { AnimalDewormingService } from '../animal-health/animal-deworming.service';
import { AnimalVaccineService } from '../animal-health/animal-vaccine.service';
import { AnimalVetAppointmentService } from '../animal-health/animal-vet-appointment.service';
import { AuthService } from '../auth/auth.service';
import { ImageService } from '../image/image.service';
import { PermissionService } from '../permission/permission.service';
import { createAnimalReportPdf, getAnimalReportFilename } from './animal-report-pdf';

const REPORT_QUERY_TIMEOUT_MS = 20000;
const REPORT_QUERY_ATTEMPTS = 2;

@Injectable({
  providedIn: 'root',
})
export class AnimalReportService {
  constructor(
    private vaccineService: AnimalVaccineService,
    private dewormingService: AnimalDewormingService,
    private vetAppointmentService: AnimalVetAppointmentService,
    private adoptionService: AdoptionService,
    private authService: AuthService,
    private imageService: ImageService,
    private permissionService: PermissionService,
  ) {}

  async exportAnimal(animal: Animal): Promise<void> {
    this.permissionService.assert('animals.export');

    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const acceptedAdoptionPromise =
      animal.status === 'adotado'
        ? retryAsync(
            () =>
              withTimeout(
                this.adoptionService.getAcceptedByAnimalId(animal.id),
                REPORT_QUERY_TIMEOUT_MS,
              ),
            REPORT_QUERY_ATTEMPTS,
          )
        : Promise.resolve(null);

    const [vaccines, dewormingRecords, vetAppointments, acceptedAdoption] = await Promise.all([
      retryAsync(
        () => this.vaccineService.getByAnimalId(animal.id, REPORT_QUERY_TIMEOUT_MS),
        REPORT_QUERY_ATTEMPTS,
      ),
      retryAsync(
        () => this.dewormingService.getByAnimalId(animal.id, REPORT_QUERY_TIMEOUT_MS),
        REPORT_QUERY_ATTEMPTS,
      ),
      retryAsync(
        () => this.vetAppointmentService.getByAnimalId(animal.id, REPORT_QUERY_TIMEOUT_MS),
        REPORT_QUERY_ATTEMPTS,
      ),
      acceptedAdoptionPromise,
    ]);

    const animalImageUrl = this.imageService.getAnimalImage(animal.imagePath);
    const [logoDataUrl, animalImageDataUrl] = await Promise.all([
      this.tryLoadImage('/logo-siga-email.png'),
      this.tryLoadImage(animalImageUrl),
    ]);

    const report = createAnimalReportPdf(
      {
        organizationName: animal.organizationName || 'Organização',
        animal,
        vaccines,
        dewormingRecords,
        vetAppointments,
        acceptedAdoption,
      },
      { logoDataUrl, animalImageDataUrl },
    );

    report.save(getAnimalReportFilename(animal.name));
  }

  private async tryLoadImage(url: string | null): Promise<string | null> {
    if (!url) {
      return null;
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      return await this.blobToDataUrl(await response.blob());
    } catch {
      return null;
    }
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
}
