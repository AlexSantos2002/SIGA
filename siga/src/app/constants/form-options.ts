import '@angular/localize/init';

export interface SelectOption {
  value: string | number;
  label: string;
}

export const ANIMAL_STATUSES: SelectOption[] = [
  { value: 'por_adotar',    label: $localize`:Animal status|@@animal.status.por_adotar:Por adotar` },
  { value: 'em_tratamento', label: $localize`:Animal status|@@animal.status.em_tratamento:Em tratamento` },
  { value: 'acolhimento',   label: $localize`:Animal status|@@animal.status.acolhimento:Em acolhimento` },
  { value: 'reservado',     label: $localize`:Animal status|@@animal.status.reservado:Reservado` },
  { value: 'indisponivel',  label: $localize`:Animal status|@@animal.status.indisponivel:Indisponível` },
];

export const ANIMAL_STATUS_LABELS: Record<string, string> = {
  por_adotar:    $localize`:Animal status|@@animal.status.por_adotar:Por adotar`,
  em_tratamento: $localize`:Animal status|@@animal.status.em_tratamento:Em tratamento`,
  adotado:       $localize`:Animal status|@@animal.status.adotado:Adotado`,
  reservado:     $localize`:Animal status|@@animal.status.reservado:Reservado`,
  acolhimento:   $localize`:Animal status|@@animal.status.acolhimento:Em acolhimento`,
  indisponivel:  $localize`:Animal status|@@animal.status.indisponivel:Indisponível`,
};

export const ANIMAL_GENDERS: SelectOption[] = [
  { value: 'male',   label: $localize`:Animal gender|@@animal.gender.male:Macho` },
  { value: 'female', label: $localize`:Animal gender|@@animal.gender.female:Fêmea` },
];

export const ANIMAL_GENDER_LABELS: Record<string, string> = {
  male:  $localize`:Animal gender|@@animal.gender.male:Macho`,
  female: $localize`:Animal gender|@@animal.gender.female:Fêmea`,
  macho:  $localize`:Animal gender|@@animal.gender.male:Macho`,
  femea:  $localize`:Animal gender|@@animal.gender.female:Fêmea`,
};

export const STERILIZATION_STATUSES: SelectOption[] = [
  { value: '',              label: $localize`:Sterilization status|@@sterilization.status.undefined:Não definido` },
  { value: 'nao_realizada', label: $localize`:Sterilization status|@@sterilization.status.nao_realizada:Não realizada` },
  { value: 'realizada',     label: $localize`:Sterilization status|@@sterilization.status.realizada:Realizada` },
  { value: 'agendada',      label: $localize`:Sterilization status|@@sterilization.status.agendada:Agendada` },
  { value: 'nao_aplicavel', label: $localize`:Sterilization status|@@sterilization.status.nao_aplicavel:Não aplicável` },
  { value: 'desconhecido',  label: $localize`:Sterilization status|@@sterilization.status.desconhecido:Desconhecido` },
];

export const STERILIZATION_STATUS_LABELS: Record<string, string> = {
  nao_realizada: $localize`:Sterilization status|@@sterilization.status.nao_realizada:Não realizada`,
  realizada:     $localize`:Sterilization status|@@sterilization.status.realizada:Realizada`,
  agendada:      $localize`:Sterilization status|@@sterilization.status.agendada:Agendada`,
  nao_aplicavel: $localize`:Sterilization status|@@sterilization.status.nao_aplicavel:Não aplicável`,
  desconhecido:  $localize`:Sterilization status|@@sterilization.status.desconhecido:Desconhecido`,
};

export const CARE_TYPES: SelectOption[] = [
  { value: 'vaccine', label: $localize`:Care type|@@care.type.vaccine:Vacina` },
  { value: 'deworming', label: $localize`:Care type|@@care.type.deworming:Desparasitação` },
  { value: 'appointment', label: $localize`:Care type|@@care.type.appointment:Consulta / tratamento` },
];

export const VACCINE_STATUSES: SelectOption[] = [
  { value: 'pendente', label: $localize`:Vaccine status|@@vaccine.status.pendente:Pendente` },
  { value: 'tomada',   label: $localize`:Vaccine status|@@vaccine.status.tomada:Tomada` },
];

export const DEWORMING_TYPES: SelectOption[] = [
  { value: 'interna', label: $localize`:Deworming type|@@deworming.type.interna:Interna` },
  { value: 'externa', label: $localize`:Deworming type|@@deworming.type.externa:Externa` },
];

export const ADOPTER_DOCUMENT_TYPES: SelectOption[] = [
  { value: 'cartao_cidadao',    label: $localize`:Adopter document type|@@adopter.document.cartao_cidadao:Cartão de cidadão` },
  { value: 'passaporte',        label: $localize`:Adopter document type|@@adopter.document.passaporte:Passaporte` },
  { value: 'titulo_residencia', label: $localize`:Adopter document type|@@adopter.document.titulo_residencia:Título de residência` },
  { value: 'outro',             label: $localize`:Adopter document type|@@adopter.document.outro:Outro` },
];

export const ADOPTER_HOUSING_TYPES: SelectOption[] = [
  { value: 'apartamento', label: $localize`:Adopter housing type|@@adopter.housing.apartamento:Apartamento` },
  { value: 'moradia',     label: $localize`:Adopter housing type|@@adopter.housing.moradia:Moradia` },
  { value: 'quinta',      label: $localize`:Adopter housing type|@@adopter.housing.quinta:Quinta` },
  { value: 'outro',       label: $localize`:Adopter housing type|@@adopter.housing.outro:Outro` },
];

export const ADOPTER_EMPLOYMENT_STATUSES: SelectOption[] = [
  { value: 'empregado',    label: $localize`:Adopter employment status|@@adopter.employment.empregado:Empregado` },
  { value: 'desempregado', label: $localize`:Adopter employment status|@@adopter.employment.desempregado:Desempregado` },
  { value: 'estudante',    label: $localize`:Adopter employment status|@@adopter.employment.estudante:Estudante` },
  { value: 'reformado',    label: $localize`:Adopter employment status|@@adopter.employment.reformado:Reformado` },
  { value: 'outro',        label: $localize`:Adopter employment status|@@adopter.employment.outro:Outro` },
];

export const ADOPTER_PREFERRED_SPECIES: SelectOption[] = [
  { value: 'cao',         label: $localize`:Adopter preferred species|@@adopter.species.cao:Cão` },
  { value: 'gato',        label: $localize`:Adopter preferred species|@@adopter.species.gato:Gato` },
  { value: 'indiferente', label: $localize`:Adopter preferred species|@@adopter.species.indiferente:Indiferente` },
  { value: 'outro',       label: $localize`:Adopter preferred species|@@adopter.species.outro:Outro` },
];

export const ADOPTION_STATUSES: SelectOption[] = [
  { value: 'pendente', label: $localize`:Adoption status|@@adoption.status.pendente:Em aberto`, },
  { value: 'aceita', label: $localize`:Adoption status|@@adoption.status.aceita:Concluído`, },
  { value: 'rejeitada', label: $localize`:Adoption status|@@adoption.status.rejeitada:Rejeitado`, },
  { value: 'devolvida', label: $localize`:Adoption status|@@adoption.status.devolvida:Devolvido`, },
];

export function getOptionLabel(
  options: SelectOption[],
  value: string | number | null | undefined,
  fallback = '-',
): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return options.find((option) => String(option.value) === String(value))?.label ?? String(value);
}

export function getMappedLabel(
  labels: Record<string, string>,
  value: string | null | undefined,
  fallback = '-',
): string {
  return value ? (labels[value] ?? value) : fallback;
}
