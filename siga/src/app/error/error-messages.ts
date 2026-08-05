import { ErrorCode } from './error-codes';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // ANIMAIS
  ANIMAL_UNAVAILABLE: 'O animal não está disponível para adoção.',
  ANIMAL_NOT_FOUND: 'O animal não foi encontrado',
  ANIMALS_NOT_FOUND: 'Nenhum animal foi encontrado',
  UNABLE_TO_GET_ANIMAL: 'Não foi possível buscar o animal',
  UNABLE_TO_GET_ANIMALS: 'Não foi possível buscar os animais',
  UNABLE_TO_GET_ANIMAL_HISTORY: 'Não foi possível carregar o histórico do animal',

  UNABLE_TO_GET_SPECIES: 'Não foi possível encontrar as espécies',
  UNABLE_TO_GET_BREEDS: 'Não foi possível encontrar as raças',

  // DEWORMING
  UNABLE_TO_GET_DEWORMING: 'Não foi possível encontrar a desparasitação',

  // VACINAS
  UNABLE_TO_GET_VACCINE: 'Não foi possível encontrar a vacina',

  // VET APPOINTMENT
  UNABLE_TO_GET_VET_APPT: 'Não foi possível encontrar o agendamento',

  // CUIDADOS
  UNABLE_TO_GET_CARE_RECORDS: 'Não foi possível carregar os cuidados dos animais',

  // ADOÇÕES
  ADOPTION_FAILED: 'Não foi possível registar a adoção.',
  INVALID_STATUS_TRANSITION: 'Não é possível realizar a transição do status da adoção',
  UNABLE_TO_GET_ADOPTION: 'Nenhuma adoção foi encontrada',
  UNABLE_TO_GET_ADOPTIONS: 'Não foi possível buscar as adoções',

  // ADOTANTES
  ADOPTER_FLAGGED: 'Este adotante esta sinalizado e nao pode fazer novas adocoes',
  ADOPTERS_EMAIL_SCOPE_OUTDATED:
    'O problema deve-se a uma regra antiga que ainda limita emails de adotantes globalmente.',
  ADOPTERS_SCHEMA_OUTDATED: 'O problema deve-se a campos em falta na tabela de adotantes.',
  UNABLE_TO_GET_ADOPTER: 'Não foi possível buscar o adotante',
  UNABLE_TO_GET_ADOPTERS: 'Não foi possível buscar os adotantes',

  // REGISTO
  EMAIL_ALREADY_EXISTS: 'O email do usuário já está registado',
  EMAIL_NOT_CONFIRMED: 'Verifique o seu email e clique no link enviado para confirmar a conta antes de iniciar sessao.',
  ORGANIZATION_ALREADY_EXISTS: 'O email da organização já está registado',

  // AUTENTICAÇÃO
  AUTHENTICATION_ERROR: 'Erro durante a autenticação',
  INVALID_CREDENTIALS: 'Email ou palavra-passe incorretos',
  NOT_AUTHENTICATED: 'Usuário não autenticado',
  PASSWORD_RESET_FAILED: 'Não foi possível enviar o email de recuperação.',
  PASSWORD_UPDATE_FAILED: 'Não foi possível atualizar a palavra-passe.',

  // STORAGE
  IMAGE_UPLOAD_FAILED: 'Falha ao armazenar imagem',
  IMAGE_DELETE_FAILED: 'Falha ao deletar imagem',
  IMAGE_INVALID_TYPE: 'A imagem deve estar em formato JPEG, PNG ou WebP.',
  IMAGE_TOO_LARGE: 'A imagem deve ter no maximo 10 MB.',
  IMAGE_PROCESSING_FAILED: 'Nao foi possivel preparar a imagem. Tente outra foto.',

  // GENÉRICOS
  DB_ERROR: 'Ocorreu um erro na base de dados.',
  DB_ERROR_UPDATE: 'Não foi possível realizar a operação.',
  NOT_FOUND: 'Erro ao buscar recurso',
  UNKNOWN: 'Ocorreu um erro inesperado. Tente novamente.',
  INVALID_CHANGE: 'Não foi possível alterar o estado',
};
