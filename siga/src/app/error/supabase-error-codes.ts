// src/app/core/errors/supabase-error-codes.ts

export const SUPABASE_ERROR_CODES = {
  // .single() returned no rows
  NO_ROWS_RETURNED:       'PGRST116',

  // Unique constraint violation (e.g. email duplicado)
  UNIQUE_VIOLATION:       '23505',

  // Foreign key violation
  FOREIGN_KEY_VIOLATION:  '23503',

  // Not null constraint violation
  NOT_NULL_VIOLATION:     '23502',

  // Violação de RLS
  RLS_VIOLATION:          '42501'
} as const;
