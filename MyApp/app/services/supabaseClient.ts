import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lomdpddjlzkvyssebjgp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvbWRwZGRqbHprdnlzc2ViamdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzOTgxNDAsImV4cCI6MjA1OTk3NDE0MH0.vegepvAXb6ATa68mhoN9etyhzueVeTyjfhUs5UJvILs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 