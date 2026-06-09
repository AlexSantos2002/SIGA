import { ERROR_MESSAGES } from './error-messages';
import { ErrorCode } from './error-codes';

/**
 * Representa um erro na aplicação
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message = ERROR_MESSAGES[code],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * Representa um erro na lógica do negócio,
 * exemplo: Adoção de um animal indisponível
 */
export class BusinessError extends AppError {
  constructor(code: ErrorCode) {
    super(code);
    this.name = 'BusinessError';
  }
}

/**
 * Erro causado na base de dados do supabase
 */
export class DBError extends AppError {
  constructor(code: ErrorCode) {
    super(code);
    this.name = 'DBError';
  }
}

/**
 * Erro de recurso não encontrado
 */
export class NotFoundError extends AppError {
  constructor(code: ErrorCode) {
    super(code);
    this.name = 'NotFoundError';
  }
}

/**
 * Erro de autenticação
 */
export class AuthenticationError extends AppError {
  constructor(code: ErrorCode) {
    super(code);
    this.name = 'AuthenticationError';
  }
}
