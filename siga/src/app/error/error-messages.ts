import { ErrorCode } from './error-codes';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // ANIMAIS
  ANIMAL_UNAVAILABLE:          'O animal não está disponível para adoção.',

  // ADOÇÕES
  ADOPTION_FAILED:             'Não foi possível registar a adoção.',
  INVALID_STATUS_TRANSITION:   'Não é possível realizar a transição do status da adoção',

  // REGISTO
  EMAIL_ALREADY_EXISTS:        'O email já está registado',
  ORGANIZATION_ALREADY_EXISTS: 'O email da organização já está registado',

  // GENÉRICOS
  DB_ERROR:                    'Ocorreu um erro na base de dados. Por favor tente novamente',
  NOT_FOUND:                   'O recurso solicitado não foi encontrado.',
  UNKNOWN:                     'Ocorreu um erro inesperado. Tente novamente.',
  INVALID_CHANGE:              'Não foi possível alterar o estado'
};
