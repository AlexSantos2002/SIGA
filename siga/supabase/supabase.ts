import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://abjjxjfbxyrpohuxutqp.supabase.co';
const supabaseKey = 'sb_publishable_W9cDWiY5rxj8tg7iWbmSMQ_rFow4Np-';

export const supabase = createClient(supabaseUrl, supabaseKey);