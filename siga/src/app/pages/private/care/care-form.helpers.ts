import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AnimalCareType } from '../../../models/animal-health/animal-care-record.model';

const CARE_DETAIL_CONTROLS = [
  'name',
  'vaccineStatus',
  'dateTaken',
  'scheduledDate',
  'nextDueDate',
  'dewormingType',
  'dateDone',
  'productName',
  'appointmentDate',
  'reason',
  'clinicName',
  'veterinarianName',
  'result',
  'nextAppointmentDate',
];

export function createCareForm(formBuilder: FormBuilder): FormGroup {
  return formBuilder.group({
    careType: ['vaccine', Validators.required],
    animalId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    vaccineStatus: ['pendente', Validators.required],
    dateTaken: [null],
    scheduledDate: [null],
    nextDueDate: [null],
    dewormingType: ['interna'],
    dateDone: [null],
    productName: [''],
    appointmentDate: [null],
    reason: [''],
    clinicName: [''],
    veterinarianName: [''],
    result: [''],
    nextAppointmentDate: [null],
    notes: [''],
  });
}

export function getCareTypeFromForm(form: FormGroup): AnimalCareType {
  const type = form.get('careType')?.value;

  return isCareType(type) ? type : 'vaccine';
}

export function updateCareTypeValidators(form: FormGroup, typeValue: unknown): void {
  const type = isCareType(typeValue) ? typeValue : 'vaccine';

  CARE_DETAIL_CONTROLS.forEach((controlName) => {
    form.get(controlName)?.clearValidators();
    form.get(controlName)?.updateValueAndValidity({ emitEvent: false });
  });

  if (type === 'vaccine') {
    form.get('name')?.setValidators([Validators.required, Validators.maxLength(120)]);
    form.get('vaccineStatus')?.setValidators([Validators.required]);

    if (form.get('vaccineStatus')?.value === 'tomada') {
      form.get('dateTaken')?.setValidators([Validators.required]);
    } else {
      form.get('scheduledDate')?.setValidators([Validators.required]);
    }
  }

  if (type === 'deworming') {
    form.get('dewormingType')?.setValidators([Validators.required]);
    form.get('dateDone')?.setValidators([Validators.required]);
  }

  if (type === 'appointment') {
    form.get('appointmentDate')?.setValidators([Validators.required]);
    form.get('reason')?.setValidators([Validators.required, Validators.maxLength(160)]);
  }

  CARE_DETAIL_CONTROLS.forEach((controlName) => {
    form.get(controlName)?.updateValueAndValidity({ emitEvent: false });
  });
}

export function resetCareForm(form: FormGroup, careType: AnimalCareType): void {
  form.reset({
    careType,
    animalId: '',
    name: '',
    vaccineStatus: 'pendente',
    dateTaken: null,
    scheduledDate: null,
    nextDueDate: null,
    dewormingType: 'interna',
    dateDone: null,
    productName: '',
    appointmentDate: null,
    reason: '',
    clinicName: '',
    veterinarianName: '',
    result: '',
    nextAppointmentDate: null,
    notes: '',
  });
  updateCareTypeValidators(form, careType);
  form.markAsPristine();
  form.markAsUntouched();
}

function isCareType(value: unknown): value is AnimalCareType {
  return value === 'vaccine' || value === 'deworming' || value === 'appointment';
}
