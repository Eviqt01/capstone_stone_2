import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		cookies.delete('userId', { path: '/' });
		cookies.delete('userRole', { path: '/' });
		cookies.delete('userEmail', { path: '/' });

		return json({
			success: true,
			message: 'Logout successful'
		});
	} catch (error) {
		console.error('Logout error:', error);
		return json({ error: 'Logout failed' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ cookies }) => {
	cookies.delete('userId', { path: '/' });
	cookies.delete('userRole', { path: '/' });
	cookies.delete('userEmail', { path: '/' });

	throw redirect(302, '/login');
};
