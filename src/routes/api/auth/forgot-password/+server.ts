// src/routes/api/auth/forgot-password/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Resend } from 'resend';
import { supabase } from '$lib/server/supabase';

// Initialize Resend with your API key
const resendApiKey = 're_HHKPzECm_2dwoLC8C2TnQmGt4aUspkryf';
const resend = new Resend(resendApiKey);

console.log('🔐 Password reset endpoint ready!');

export const POST: RequestHandler = async ({ request, url }) => {
	console.log('📥 POST request received to /api/auth/forgot-password');

	try {
		const body = await request.json();
		console.log('📦 Request body:', body);

		const { email } = body;

		if (!email) {
			console.log('❌ No email provided');
			return json(
				{
					success: false,
					error: 'Email is required'
				},
				{ status: 400 }
			);
		}

		console.log('🔑 Password reset requested for:', email);

		// Find user by email
		console.log('🔍 Searching for user in database...');
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('id, email, name')
			.eq('email', email.toLowerCase())
			.single();

		console.log('👤 Database query result:', { user, userError });

		// Always return success for security
		if (!user || userError) {
			console.log('ℹ️ User not found or error:', userError?.message);
			return json({
				success: true,
				message: 'If an account exists with this email, a password reset link has been sent.'
			});
		}

		console.log('✅ User found:', { id: user.id, name: user.name, email: user.email });

		// Generate secure reset token
		const resetToken = crypto.getRandomValues(new Uint8Array(32));
		const tokenHex = Array.from(resetToken)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');

		console.log('🔑 Token generated:', tokenHex.substring(0, 20) + '...');

		// Token expires in 1 hour
		const expiresAt = new Date(Date.now() + 3600000);

		// Delete any existing reset tokens
		console.log('🗑️ Deleting old reset tokens...');
		await supabase.from('password_resets').delete().eq('user_id', user.id);

		// Save new reset token
		console.log('💾 Saving new reset token...');
		const { error: insertError } = await supabase.from('password_resets').insert({
			user_id: user.id,
			token: tokenHex,
			expires_at: expiresAt.toISOString()
		});

		if (insertError) {
			console.error('❌ Error saving reset token:', insertError);
			return json(
				{
					success: false,
					error: 'Failed to create reset token'
				},
				{ status: 500 }
			);
		}

		console.log('✅ Reset token saved to database');

		// Build reset link
		const baseUrl = url.origin; // Use the request origin
		const resetLink = `${baseUrl}/reset-password?token=${tokenHex}`;
		console.log('🔗 Reset link:', resetLink);

		// IMPORTANT: Check if email matches YOUR Resend account email
		// Resend only allows sending to your own email without domain verification
		const yourResendEmail = 'eviqt134@gmail.com'; // Your Resend account email

		console.log('📧 Checking email permissions...');
		console.log('   - User email:', user.email);
		console.log('   - Your Resend account email:', yourResendEmail);
		console.log('   - Emails match?', user.email === yourResendEmail);

		// If email doesn't match your Resend account, Resend will block it
		const emailToSend = user.email === yourResendEmail ? user.email : yourResendEmail;
		console.log('📧 Will send to:', emailToSend);

		// Generate email content
		const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
				.content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
				.reset-button { background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
				.link-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; word-break: break-all; font-family: monospace; }
			</style>
		</head>
		<body>
			<div class="header">
				<h1>Reset Your Password</h1>
			</div>
			<div class="content">
				<p>Hi ${user.name || 'there'},</p>
				<p>Click the button below to reset your password:</p>
				<p><a href="${resetLink}" class="reset-button">Reset Password</a></p>
				<p>Or copy this link:</p>
				<div class="link-box">${resetLink}</div>
				<p><small>This link expires in 1 hour.</small></p>
			</div>
		</body>
		</html>
		`;

		console.log('📧 Attempting to send email via Resend...');

		// Send email using Resend
		const { data, error } = await resend.emails.send({
			from: 'Laveona <onboarding@resend.dev>',
			to: emailToSend,
			subject: 'Test Password Reset - Laveona',
			html: htmlContent,
			text: `Reset your password: ${resetLink}`
		});

		console.log('📧 Resend API response:', { data, error });

		if (error) {
			console.error('❌ Resend error:', error);

			// If it's a 403 error, it's because of domain verification
			if (error.message?.includes('403') || error.message?.includes('only send')) {
				console.log('⚠️ DOMAIN VERIFICATION REQUIRED!');
				console.log('   You need to verify a domain in Resend to send to:', user.email);
				console.log('   Go to: https://resend.com/domains');
			}

			// Still return success but with testing info
			return json({
				success: true,
				message: 'Password reset processed. Check console for details.',
				resetLink: resetLink, // Always return link for testing
				debug: {
					error: error.message,
					userEmail: user.email,
					sentTo: emailToSend,
					note: 'Email blocked by Resend - domain verification needed for production'
				}
			});
		}

		console.log('✅ Email sent successfully! Resend ID:', data?.id);

		// Return different response based on who received the email
		if (user.email === yourResendEmail) {
			return json({
				success: true,
				message: 'Password reset link has been sent to your email',
				resetLink: resetLink // Include for testing
			});
		} else {
			return json({
				success: true,
				message: 'Password reset processed. Test email sent to admin.',
				resetLink: resetLink, // Always include for testing
				note: `In production, this would go to ${user.email}`
			});
		}
	} catch (error) {
		console.error('❌ Endpoint error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				debug: { timestamp: new Date().toISOString() }
			},
			{ status: 500 }
		);
	}
};
