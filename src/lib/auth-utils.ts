import { supabase } from '$lib/supabase';
import type { Cookies } from '@sveltejs/kit';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
	id: string;
	full_name: string;
	email: string;
	age: number | null;
	address: string | null;
	role: UserRole;
	created_at: string;
	updated_at: string;
}

export async function getCurrentUser(cookies: Cookies) {
	const accessToken = cookies.get('sb-access-token');

	if (!accessToken) {
		return { user: null, profile: null };
	}

	const {
		data: { user },
		error
	} = await supabase.auth.getUser(accessToken);

	if (error || !user) {
		return { user: null, profile: null };
	}

	const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

	return { user, profile: profile as UserProfile | null };
}

export function isAdmin(profile: UserProfile | null): boolean {
	return profile?.role === 'admin';
}

export function hasRole(profile: UserProfile | null, role: UserRole): boolean {
	return profile?.role === role;
}
