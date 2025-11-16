import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ cookies }: RequestEvent) {
	try {
		const userEmail = cookies.get('userEmail');
		const userRole = cookies.get('userRole');
		const userId = cookies.get('userId');

		if (!userEmail || !userId) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		return json({
			email: userEmail,
			role: userRole || 'user',
			id: userId
		});
	} catch (error) {
		console.error('Error getting user data:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}
