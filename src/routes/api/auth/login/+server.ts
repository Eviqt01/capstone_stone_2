import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import * as bcrypt from 'bcrypt';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();

		if (!body.email || !body.password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		const { data: user, error } = await supabase
			.from('users')
			.select('*')
			.eq('email', body.email)
			.single();

		if (error || !user) {
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		if (!user.is_active) {
			return json({ error: 'Account is deactivated' }, { status: 403 });
		}

		const passwordValid = await bcrypt.compare(body.password, user.password_hash);

		if (!passwordValid) {
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		cookies.set('userId', user.id, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7
		});

		cookies.set('userRole', user.role, {
			path: '/',
			httpOnly: false,
			secure: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7
		});

		cookies.set('userEmail', user.email, {
			path: '/',
			httpOnly: false,
			secure: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7
		});

		return json(
			{
				success: true,
				message: 'Login successful',
				user: {
					id: user.id,
					email: user.email,
					fullName: user.full_name,
					role: user.role,
					age: user.age,
					address: user.address
				}
			},
			{ status: 200 }
		);
	} catch (err) {
		console.error('Login error:', err);
		return json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
	}
};
