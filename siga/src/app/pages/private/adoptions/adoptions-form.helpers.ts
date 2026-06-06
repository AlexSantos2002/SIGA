import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';

import { RegisterAdopterRequest } from '../../../models/adopter/register-adopter-request';
import { toNullableString } from '../../../utils/utils';

const newAdopterValidators: Record<string, ValidatorFn[]> = {
  name: [Validators.required, Validators.maxLength(80)],
  lastName: [Validators.required, Validators.maxLength(80)],
  email: [Validators.required, Validators.email, Validators.maxLength(120)],
  phone: [Validators.required, Validators.maxLength(30)],
  documentType: [],
  documentNumber: [Validators.maxLength(40)],
  birthDate: [],
  address: [Validators.maxLength(180)],
  city: [Validators.maxLength(80)],
  postalCode: [Validators.maxLength(20)],
  housingType: [],
  householdMembers: [],
  employmentStatus: [],
  otherAnimalsDescription: [],
  experienceWithAnimals: [],
  preferredSpecies: [],
  adoptionMotivation: [],
  notes: [],
};

export function createAdoptionProcessForm(formBuilder: FormBuilder): FormGroup {
  return formBuilder.group({
    animalId: ['', Validators.required],
    adopterMode: ['', Validators.required],
    existingAdopterId: [''],
    name: [''],
    lastName: [''],
    email: [''],
    phone: [''],
    documentType: [''],
    documentNumber: [''],
    birthDate: [null],
    address: [''],
    city: [''],
    postalCode: [''],
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
  });
}

export function buildNewAdopterRequest(form: FormGroup): RegisterAdopterRequest {
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
    isFlagged: false,
    flagReason: null,
  };
}

export function updateAdopterModeValidators(form: FormGroup, mode: string): void {
  const existingAdopterControl = form.get('existingAdopterId');

  Object.keys(newAdopterValidators).forEach((controlName) => {
    form.get(controlName)?.clearValidators();
    form.get(controlName)?.updateValueAndValidity({ emitEvent: false });
  });

  if (mode === 'existing') {
    existingAdopterControl?.setValidators([Validators.required]);
  } else {
    existingAdopterControl?.clearValidators();
    existingAdopterControl?.setValue('', { emitEvent: false });
  }

  if (mode === 'new') {
    Object.entries(newAdopterValidators).forEach(([controlName, validators]) => {
      form.get(controlName)?.setValidators(validators);
      form.get(controlName)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  existingAdopterControl?.updateValueAndValidity({ emitEvent: false });
}

export function resetAdoptionProcessForm(form: FormGroup): void {
  form.reset({
    animalId: '',
    adopterMode: '',
    existingAdopterId: '',
    name: '',
    lastName: '',
    email: '',
    phone: '',
    documentType: '',
    documentNumber: '',
    birthDate: null,
    address: '',
    city: '',
    postalCode: '',
    housingType: '',
    hasOutdoorSpace: false,
    householdMembers: '',
    employmentStatus: '',
    hasOtherAnimals: false,
    otherAnimalsDescription: '',
    experienceWithAnimals: '',
    preferredSpecies: '',
    adoptionMotivation: '',
    notes: '',
  });
  updateAdopterModeValidators(form, '');
  form.markAsPristine();
  form.markAsUntouched();
}
