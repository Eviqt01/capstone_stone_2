import { redirect } from '@sveltejs/kit';
import type { LoadContext, UserData } from '$lib/types';

export async function load({ cookies, url }: LoadContext) {
	const userEmail = cookies.get('userEmail');
	const userId = cookies.get('userId');
	const userRole = cookies.get('userRole');

	if (!userEmail || !userId) {
		throw redirect(302, `/login?redirectTo=${url.pathname}`);
	}

	if (userRole !== 'admin') {
		console.log('🚫 Admin access denied for non-admin user:', userEmail);
		throw redirect(302, '/User/Shop');
	}

	return {
		user: {
			email: userEmail,
			role: userRole,
			id: userId
		} as UserData
	};
}
