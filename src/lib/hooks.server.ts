// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
	// List of public routes that don't require authentication
	const publicRoutes = [
		'/login',
		'/Signup',
		'/forgot-password',
		'/reset-password',
		'/Reports',
		'/api/auth/login',
		'/api/auth/Signup',
		'/api/auth/forgot-password',
		'/api/auth/reset-password',
		'/api/reports/submit',
		'/User/Report'
	];

	// Check if current path is public
	const isPublicRoute = publicRoutes.some((route) => event.url.pathname.startsWith(route));

	// Only check authentication for non-public routes
	if (!isPublicRoute) {
		const userId = event.cookies.get('userId');

		if (userId) {
			const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();

			event.locals.user = user || null;
		} else {
			event.locals.user = null;
		}
	}

	return resolve(event);
};
