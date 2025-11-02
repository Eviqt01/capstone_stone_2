import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import * as bcrypt from 'bcrypt';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body.email || !body.password || !body.fullName) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		if (!body.age || body.age < 0) {
			return json({ error: 'Valid age is required' }, { status: 400 });
		}

		const { data: existingUser } = await supabase
			.from('users')
			.select('id')
			.eq('email', body.email)
			.single();

		if (existingUser) {
			return json({ error: 'User with this email already exists' }, { status: 400 });
		}

		const hashedPassword = await bcrypt.hash(body.password, 10);

		const { data: newUser, error } = await supabase
			.from('users')
			.insert({
				email: body.email,
				password_hash: hashedPassword,
				full_name: body.fullName,
				age: body.age,
				address: body.address,
				role: 'user'
			})
			.select()
			.single();

		if (error) {
			console.error('Database error:', error);
			return json({ error: error.message || 'Failed to create user' }, { status: 500 });
		}

		return json(
			{
				success: true,
				message: 'User created successfully',
				user: {
					id: newUser.id,
					email: newUser.email,
					fullName: newUser.full_name,
					role: newUser.role
				}
			},
			{ status: 201 }
		);
	} catch (err) {
		console.error('Signup error:', err);
		return json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
	}
};
