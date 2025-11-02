import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '$env/static/private';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
	throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});
