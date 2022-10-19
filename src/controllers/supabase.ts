import { createClient } from '@supabase/supabase-js'

const supabaseUrl = String(process.env.REACT_APP_SUPABASE_URL);
const supabaseAnonKey = String(process.env.REACT_APP_SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey)