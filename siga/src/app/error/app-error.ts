/**
 * TODO: Criar global error handler
 */

/**
 * Representa um erro na aplicação
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Representa um erro na lógica do negócio,
 * exemplo: Adoção de um animal indisponível
 */
export class BusinessError extends AppError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'BusinessError';
  }
}

/**
 * Erro causado na base de dados do supabase
 */
export class DBError extends AppError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'DatabaseError';
  }
}

/**
 * Erro de recurso não encontrado
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
