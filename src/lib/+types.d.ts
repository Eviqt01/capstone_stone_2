import type { User } from '@supabase/supabase-js';

declare module '@sveltejs/kit' {
	interface Locals {
		user?: User | undefined;
	}
}
