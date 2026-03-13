import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuwilpmmqbxikvrvntbb.supabase.co';
const supabaseKey = 'sb_publishable_Q9iKMPzLnWvwpfRPjmhypA_7nap-4yE';

export const supabase = createClient(supabaseUrl, supabaseKey);