// src/routes/api/auth/reset-password/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import * as bcrypt from 'bcrypt';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { token, newPassword } = body;

		console.log('🔄 Reset password request received');
		console.log('🔑 Token provided:', token ? `${token.substring(0, 20)}...` : 'none');
		console.log('🔑 Token length:', token?.length || 0);

		// Validation
		if (!token || !newPassword) {
			console.log('❌ Missing token or password');
			return json(
				{
					error: 'Token and new password are required'
				},
				{ status: 400 }
			);
		}

		if (newPassword.length < 6) {
			return json(
				{
					error: 'Password must be at least 6 characters long'
				},
				{ status: 400 }
			);
		}

		// ============================================
		// ENHANCED DEBUG: Find the reset token
		// ============================================
		console.log('🔍 Looking for token in database...');

		// Clean the token
		const cleanToken = token.trim();
		console.log('🧹 Cleaned token length:', cleanToken.length);
		console.log('🧹 Cleaned token preview:', cleanToken.substring(0, 30) + '...');

		// First, let's see ALL tokens in the database
		console.log('📋 Checking all tokens in database...');
		const { data: allTokens } = await supabase
			.from('password_resets')
			.select('id, token, user_id, created_at, expires_at, used_at')
			.order('created_at', { ascending: false })
			.limit(5);

		if (allTokens && allTokens.length > 0) {
			console.log('📊 Recent tokens in database:');
			allTokens.forEach((t, i) => {
				console.log(`Token ${i + 1}:`, {
					id: t.id,
					token_preview: t.token.substring(0, 30) + '...',
					token_length: t.token.length,
					used_at: t.used_at,
					created_at: t.created_at
				});
			});
		} else {
			console.log('⚠️ No tokens found in database!');
		}

		// Now search for the specific token
		const { data: resetRecord, error: findError } = await supabase
			.from('password_resets')
			.select('*')
			.eq('token', cleanToken)
			.single();

		console.log('📊 Token search result:', {
			found: !!resetRecord,
			error: findError?.message,
			error_code: findError?.code,
			error_details: findError?.details,
			tokenInDB: resetRecord?.token ? `${resetRecord.token.substring(0, 20)}...` : 'none',
			user_id: resetRecord?.user_id,
			used_at: resetRecord?.used_at
		});

		// If not found, try searching without the used_at filter
		if (!resetRecord) {
			console.log('🔍 Searching again without used_at filter...');
			const { data: anyToken, error: anyError } = await supabase
				.from('password_resets')
				.select('*')
				.eq('token', cleanToken)
				.single();

			if (anyToken) {
				console.log('⚠️ Token found but already used!', {
					used_at: anyToken.used_at,
					created_at: anyToken.created_at
				});

				return json(
					{
						error: 'This reset token has already been used. Please request a new one.',
						debug: {
							token_used_at: anyToken.used_at
						}
					},
					{ status: 400 }
				);
			} else {
				console.log('❌ Token not found in database at all');
				console.log('Error details:', anyError);

				return json(
					{
						error: 'Invalid reset token. Please request a new one.',
						debug: {
							token_length_received: cleanToken.length,
							error: anyError?.message
						}
					},
					{ status: 400 }
				);
			}
		}

		// ============================================
		// Check expiration - NOW ENABLED
		// ============================================
		console.log('⏰ Checking token expiration...');

		const now = new Date();
		const expiresAt = new Date(resetRecord.expires_at);

		// DEBUG: Show all time information
		console.log('📅 TIME COMPARISON:', {
			// Current time
			now_utc: now.toISOString(),
			now_local: now.toLocaleString(),
			now_timestamp: now.getTime(),

			// Token expiration time
			expires_at_raw: resetRecord.expires_at,
			expires_at_utc: expiresAt.toISOString(),
			expires_at_local: expiresAt.toLocaleString(),
			expires_at_timestamp: expiresAt.getTime(),

			// Time difference
			time_diff_ms: expiresAt.getTime() - now.getTime(),
			time_diff_minutes: ((expiresAt.getTime() - now.getTime()) / 60000).toFixed(2),
			time_diff_hours: ((expiresAt.getTime() - now.getTime()) / 3600000).toFixed(2),

			// Is expired?
			is_expired: now > expiresAt
		});

		// Check if token has expired
		if (now > expiresAt) {
			console.log('❌ Token has expired - marking as used');

			// Mark as used instead of deleting
			await supabase
				.from('password_resets')
				.update({
					used_at: new Date().toISOString()
				})
				.eq('id', resetRecord.id);

			const minutesExpired = ((now.getTime() - expiresAt.getTime()) / 60000).toFixed(0);

			return json(
				{
					error: 'Reset token has expired. Please request a new one.',
					debug: {
						expired_minutes_ago: minutesExpired,
						expires_at: expiresAt.toISOString(),
						current_time: now.toISOString()
					}
				},
				{ status: 400 }
			);
		}

		// Calculate remaining time
		const remainingMinutes = ((expiresAt.getTime() - now.getTime()) / 60000).toFixed(0);
		console.log(`✅ Token is valid - expires in ${remainingMinutes} minutes`);

		// ============================================
		// Check if user exists in users table
		// ============================================
		console.log('👤 Checking if user exists:', resetRecord.user_id);

		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('id, email')
			.eq('id', resetRecord.user_id)
			.single();

		if (userError || !userData) {
			console.error('❌ User not found:', userError?.message);

			// Mark token as used (invalid user)
			await supabase
				.from('password_resets')
				.update({
					used_at: new Date().toISOString()
				})
				.eq('id', resetRecord.id);

			return json(
				{
					error: 'User account not found. Please contact support.'
				},
				{ status: 400 }
			);
		}

		console.log('✅ User found:', userData.email);

		// ============================================
		// Hash and update password
		// ============================================
		console.log('🔐 Hashing new password...');
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		console.log('✅ Password hashed successfully');
		console.log('🔑 Hash preview:', hashedPassword.substring(0, 20) + '...');

		console.log('🔄 Updating user password for user:', userData.email);
		console.log('👤 User ID:', resetRecord.user_id);

		const { data: updateData, error: updateError } = await supabase
			.from('users')
			.update({
				password_hash: hashedPassword,
				updated_at: new Date().toISOString()
			})
			.eq('id', resetRecord.user_id)
			.select('id, email, updated_at');

		if (updateError) {
			console.error('❌ Error updating password:', updateError);

			// Don't mark as used since update failed
			return json(
				{
					error: 'Failed to update password. Please try again.',
					debug: {
						error_message: updateError.message,
						error_code: updateError.code
					}
				},
				{ status: 500 }
			);
		}

		if (!updateData || updateData.length === 0) {
			console.error('⚠️ Update succeeded but no rows returned!');
			console.error('This might mean the user_id does not exist');

			return json(
				{
					error: 'Failed to update password - user not found.',
					debug: {
						user_id: resetRecord.user_id,
						message: 'No rows updated'
					}
				},
				{ status: 500 }
			);
		}

		console.log('✅ Password updated successfully!');
		console.log('📊 Updated user:', updateData);

		// ============================================
		// Mark token as used (instead of deleting)
		// ============================================
		console.log('✅ Marking token as used...');

		const { error: markUsedError } = await supabase
			.from('password_resets')
			.update({
				used_at: new Date().toISOString()
			})
			.eq('id', resetRecord.id);

		if (markUsedError) {
			console.error('⚠️ Failed to mark token as used:', markUsedError);
			// Continue anyway - password was updated
		}

		console.log('✅ Password reset completed successfully!');

		return json({
			success: true,
			message: 'Password has been reset successfully. You can now log in with your new password.'
		});
	} catch (error) {
		console.error('❌ Reset password error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Server error'
			},
			{ status: 500 }
		);
	}
};
