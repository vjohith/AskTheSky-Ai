import { createClient } from '@supabase/supabase-js';

// Replace these variables with your Supabase credentials
export const SUPABASE_URL = "https://evcnvilbsbhpzjlrcliy.supabase.co/rest/v1/";
export const SUPABASE_PUBLIC_KEY = "sb_publishable_JRQdX9NpUmHoP7k9S8vugA_DMOmzv7x";

// Clean base URL if /rest/v1/ suffix is present
const cleanUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, '');

// Create and export the Supabase client instance
export const supabase = createClient(cleanUrl, SUPABASE_PUBLIC_KEY);

export default supabase;
