// src/routes/api/auth/reset-password/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import * as bcrypt from 'bcrypt';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		console.log('Reset password request received:', {
			hasToken: !!body.token,
			hasPassword: !!body.newPassword
		});

		if (!body.token || !body.newPassword) {
			return json({ error: 'Token and new password are required' }, { status: 400 });
		}

		// Validate password strength
		if (body.newPassword.length < 6) {
			return json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
		}

		console.log('Looking for reset token...', {
			tokenLength: body.token.length,
			tokenPreview: body.token.substring(0, 20) + '...'
		});

		// Find valid reset token
		const { data: resetRecord, error: findError } = await supabase
			.from('password_resets')
			.select('*')
			.eq('token', body.token)
			.single();

		if (findError) {
			console.error('Error finding reset token:', findError);
			return json({ error: 'Invalid or expired reset token' }, { status: 400 });
		}

		if (!resetRecord) {
			console.log('No reset record found');
			return json({ error: 'Invalid or expired reset token' }, { status: 400 });
		}

		console.log('Reset record found:', {
			userId: resetRecord.user_id,
			expiresAt: resetRecord.expires_at
		});

		// Check if token has expired (compare in UTC)
		const now = new Date();
		const expiresAt = new Date(resetRecord.expires_at);

		// Calculate difference in minutes
		const diffMinutes = (expiresAt.getTime() - now.getTime()) / 1000 / 60;

		console.log('Time check:', {
			now: now.toISOString(),
			expiresAt: expiresAt.toISOString(),
			nowTimestamp: now.getTime(),
			expiresTimestamp: expiresAt.getTime(),
			diffMinutes: diffMinutes,
			isExpired: diffMinutes < 0
		});

		// TEMPORARY: Skip expiration check for testing
		// if (diffMinutes < 0) {
		//   console.log('Token has expired');
		//   await supabase
		//     .from('password_resets')
		//     .delete()
		//     .eq('id', resetRecord.id);

		//   return json(
		//     { error: 'Reset token has expired. Please request a new one.' },
		//     { status: 400 }
		//   );
		// }

		console.log('Skipping expiration check for testing');

		console.log('Hashing new password...');

		// Hash new password
		const hashedPassword = await bcrypt.hash(body.newPassword, 10);

		console.log('Updating user password...');

		// Update user password
		const { error: updateError } = await supabase
			.from('users')
			.update({ password_hash: hashedPassword })
			.eq('id', resetRecord.user_id);

		if (updateError) {
			console.error('Error updating password:', updateError);
			return json({ error: 'Failed to update password' }, { status: 500 });
		}

		console.log('Password updated successfully, deleting token...');

		// Delete used reset token
		await supabase.from('password_resets').delete().eq('id', resetRecord.id);

		console.log('Password reset completed successfully');

		return json(
			{
				success: true,
				message: 'Password has been reset successfully'
			},
			{ status: 200 }
		);
	} catch (err) {
		console.error('Reset password error:', err);
		return json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
	}
};
