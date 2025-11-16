import { createClient } from '@supabase/supabase-js';
import { env } from './env';

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
	console.error('❌ Missing Supabase environment variables!');
	console.error('SUPABASE_URL:', env.SUPABASE_URL);
	console.error('SUPABASE_KEY length:', env.SUPABASE_SERVICE_ROLE_KEY?.length);
	throw new Error('Missing Supabase environment variables');
}

console.log('✅ Supabase client initialized successfully');

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
