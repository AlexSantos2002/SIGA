import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Adopter } from '../../../models/adopter/adopter.model';
import { RegisterAdopterRequest } from '../../../models/adopter/register-adopter-request';
import { toNullableString } from '../../../utils/utils';

export function createAdopterForm(formBuilder: FormBuilder): FormGroup {
  return formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
    documentType: [''],
    documentNumber: ['', Validators.maxLength(40)],
    birthDate: [null],
    address: ['', Validators.maxLength(180)],
    city: ['', Validators.maxLength(80)],
    postalCode: ['', Validators.maxLength(20)],
    housingType: [''],
    hasOutdoorSpace: [false],
    householdMembers: [''],
    employmentStatus: [''],
    hasOtherAnimals: [false],
    otherAnimalsDescription: [''],
    experienceWithAnimals: [''],
    preferredSpecies: [''],
    adoptionMotivation: [''],
    notes: [''],
    isFlagged: [false],
    flagReason: [''],
  });
}

export function patchAdopterForm(form: FormGroup, adopter: Adopter): void {
  form.patchValue({
    name: adopter.name,
    lastName: adopter.lastName,
    email: adopter.email,
    phone: adopter.phone || '',
    documentType: adopter.documentType || '',
    documentNumber: adopter.documentNumber || '',
    birthDate: adopter.birthDate || null,
    address: adopter.address || '',
    city: adopter.city || '',
    postalCode: adopter.postalCode || '',
    housingType: adopter.housingType || '',
    hasOutdoorSpace: adopter.hasOutdoorSpace,
    householdMembers: adopter.householdMembers || '',
    employmentStatus: adopter.employmentStatus || '',
    hasOtherAnimals: adopter.hasOtherAnimals,
    otherAnimalsDescription: adopter.otherAnimalsDescription || '',
    experienceWithAnimals: adopter.experienceWithAnimals || '',
    preferredSpecies: adopter.preferredSpecies || '',
    adoptionMotivation: adopter.adoptionMotivation || '',
    notes: adopter.notes || '',
    isFlagged: adopter.isFlagged,
    flagReason: adopter.flagReason || '',
  });
}

export function validateFlagReason(form: FormGroup): boolean {
  const flagReasonControl = form.get('flagReason');

  if (form.value.isFlagged && !form.value.flagReason?.trim()) {
    flagReasonControl?.setErrors({ required: true });
    flagReasonControl?.markAsTouched();
    return false;
  }

  if (flagReasonControl?.hasError('required')) {
    flagReasonControl.setErrors(null);
  }

  return true;
}

export function buildAdopterRequest(form: FormGroup): RegisterAdopterRequest {
  return {
    name: form.value.name.trim(),
    lastName: form.value.lastName.trim(),
    email: form.value.email.trim(),
    phone: toNullableString(form.value.phone),
    documentType: toNullableString(form.value.documentType),
    documentNumber: toNullableString(form.value.documentNumber),
    birthDate: toNullableString(form.value.birthDate),
    address: toNullableString(form.value.address),
    city: toNullableString(form.value.city),
    postalCode: toNullableString(form.value.postalCode),
    housingType: toNullableString(form.value.housingType),
    hasOutdoorSpace: !!form.value.hasOutdoorSpace,
    hasOtherAnimals: !!form.value.hasOtherAnimals,
    otherAnimalsDescription: toNullableString(form.value.otherAnimalsDescription),
    householdMembers: toNullableString(form.value.householdMembers),
    employmentStatus: toNullableString(form.value.employmentStatus),
    experienceWithAnimals: toNullableString(form.value.experienceWithAnimals),
    preferredSpecies: toNullableString(form.value.preferredSpecies),
    adoptionMotivation: toNullableString(form.value.adoptionMotivation),
    notes: toNullableString(form.value.notes),
    isFlagged: !!form.value.isFlagged,
    flagReason: toNullableString(form.value.flagReason),
  };
}
