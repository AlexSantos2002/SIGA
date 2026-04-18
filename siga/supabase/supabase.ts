import { createClient } from '@supabase/supabase-js';

/**
 * @description
 * URL do projeto Supabase.
 *
 * Identifica o endpoint da base de dados e serviços associados.
 */
const supabaseUrl = 'https://abjjxjfbxyrpohuxutqp.supabase.co';

/**
 * @description
 * Chave pública da Supabase usada para autenticação no frontend
 */
const supabaseKey = 'sb_publishable_W9cDWiY5rxj8tg7iWbmSMQ_rFow4Np-';

/**
 * @description
 * Instância do cliente Supabase.
 * permite diversas interações com a supabase
 *
 * @returns cliente configurado do Supabase
 */
export const supabase = createClient(supabaseUrl, supabaseKey);
