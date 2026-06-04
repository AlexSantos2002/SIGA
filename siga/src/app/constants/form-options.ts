export interface SelectOption {
  value: string | number;
  label: string;
}

export const ANIMAL_STATUSES: SelectOption[] = [
  { value: 'por_adotar', label: 'Por adotar' },
  { value: 'em_tratamento', label: 'Em tratamento' },
  { value: 'acolhimento', label: 'Em acolhimento' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'indisponivel', label: 'Indisponível' },
];

export const ANIMAL_STATUS_LABELS: Record<string, string> = {
  por_adotar: 'Por adotar',
  em_tratamento: 'Em tratamento',
  adotado: 'Adotado',
  reservado: 'Reservado',
  acolhimento: 'Em acolhimento',
  indisponivel: 'Indisponível',
};

export const ANIMAL_GENDERS: SelectOption[] = [
  { value: 'male', label: 'Macho' },
  { value: 'female', label: 'Fêmea' },
];

export const ANIMAL_GENDER_LABELS: Record<string, string> = {
  male: 'Macho',
  female: 'Fêmea',
  macho: 'Macho',
  femea: 'Fêmea',
};

export const STERILIZATION_STATUSES: SelectOption[] = [
  { value: '', label: 'Não definido' },
  { value: 'nao_realizada', label: 'Não realizada' },
  { value: 'realizada', label: 'Realizada' },
  { value: 'agendada', label: 'Agendada' },
  { value: 'nao_aplicavel', label: 'Não aplicável' },
  { value: 'desconhecido', label: 'Desconhecido' },
];

export const STERILIZATION_STATUS_LABELS: Record<string, string> = {
  nao_realizada: 'Não realizada',
  realizada: 'Realizada',
  agendada: 'Agendada',
  nao_aplicavel: 'Não aplicável',
  desconhecido: 'Desconhecido',
};

export const VACCINE_STATUSES: SelectOption[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'tomada', label: 'Tomada' },
];

export const DEWORMING_TYPES: SelectOption[] = [
  { value: 'interna', label: 'Interna' },
  { value: 'externa', label: 'Externa' },
];

export const ADOPTER_DOCUMENT_TYPES: SelectOption[] = [
  { value: 'cartao_cidadao', label: 'Cartão de cidadão' },
  { value: 'passaporte', label: 'Passaporte' },
  { value: 'titulo_residencia', label: 'Título de residência' },
  { value: 'outro', label: 'Outro' },
];

export const ADOPTER_HOUSING_TYPES: SelectOption[] = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'moradia', label: 'Moradia' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'outro', label: 'Outro' },
];

export const ADOPTER_EMPLOYMENT_STATUSES: SelectOption[] = [
  { value: 'empregado', label: 'Empregado' },
  { value: 'desempregado', label: 'Desempregado' },
  { value: 'estudante', label: 'Estudante' },
  { value: 'reformado', label: 'Reformado' },
  { value: 'outro', label: 'Outro' },
];

export const ADOPTER_PREFERRED_SPECIES: SelectOption[] = [
  { value: 'cao', label: 'Cão' },
  { value: 'gato', label: 'Gato' },
  { value: 'indiferente', label: 'Indiferente' },
  { value: 'outro', label: 'Outro' },
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
