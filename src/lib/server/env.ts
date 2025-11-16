import dotenv from 'dotenv';
dotenv.config();

export const env = {
	SUPABASE_URL: process.env.SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
	XENDIT_SECRET_KEY: process.env.XENDIT_SECRET_KEY
};

console.log('🔧 Environment check:');
console.log('SUPABASE_URL:', env.SUPABASE_URL ? '✅' : '❌');
console.log('SUPABASE_KEY:', env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
console.log('XENDIT_KEY:', env.XENDIT_SECRET_KEY ? '✅' : '❌');
