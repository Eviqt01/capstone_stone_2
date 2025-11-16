import { redirect } from '@sveltejs/kit';
import type { LoadContext, UserData } from '$lib/types';

export async function load({ cookies, url }: LoadContext) {
	const userEmail = cookies.get('userEmail');
	const userId = cookies.get('userId');

	if (!userEmail || !userId) {
		throw redirect(302, `/login?redirectTo=${url.pathname}`);
	}

	const userRole = cookies.get('userRole') || 'user';

	if (userRole !== 'user' && userRole !== 'admin') {
		throw redirect(302, '/login');
	}

	return {
		user: {
			email: userEmail,
			role: userRole,
			id: userId
		} as UserData
	};
}
