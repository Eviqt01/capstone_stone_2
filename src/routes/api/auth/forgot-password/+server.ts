// src/routes/api/auth/forgot-password/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body.email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		// Find user by email
		const { data: user } = await supabase
			.from('users')
			.select('id, email')
			.eq('email', body.email)
			.single();

		// Always return success for security (don't reveal if email exists)
		if (!user) {
			return json(
				{
					success: true,
					message: 'If the email exists, a reset link has been sent'
				},
				{ status: 200 }
			);
		}

		// Generate reset token (random 32 bytes)
		const resetToken = crypto.getRandomValues(new Uint8Array(32));
		const tokenHex = Array.from(resetToken)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');

		// Token expires in 1 hour
		const expiresAt = new Date(Date.now() + 3600000);

		// Delete any existing reset tokens for this user
		await supabase.from('password_resets').delete().eq('user_id', user.id);

		// Save new reset token
		const { error: insertError } = await supabase.from('password_resets').insert({
			user_id: user.id,
			token: tokenHex,
			expires_at: expiresAt.toISOString()
		});

		if (insertError) {
			console.error('Error saving reset token:', insertError);
			return json({ error: 'Failed to create reset token' }, { status: 500 });
		}

		// In production, send email here with reset link
		// For now, we'll return the token in the response (REMOVE IN PRODUCTION!)
		console.log(`Password reset token for ${user.email}: ${tokenHex}`);
		console.log(`Reset link: http://localhost:5173/reset-password?token=${tokenHex}`);

		return json(
			{
				success: true,
				message: 'Password reset link has been sent to your email',
				// REMOVE THIS IN PRODUCTION - only for testing
				resetLink: `/reset-password?token=${tokenHex}`
			},
			{ status: 200 }
		);
	} catch (err) {
		console.error('Forgot password error:', err);
		return json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
	}
};
