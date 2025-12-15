// src/routes/api/auth/forgot-password/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Resend } from 'resend';
import { supabase } from '$lib/server/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

const resend = new Resend('re_HHKPzECm_2dwoLC8C2TnQmGt4aUspkryf');

interface User {
	id: string;
	email: string;
	full_name: string | null; // Changed from 'name' to 'full_name'
}

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const { email } = await request.json();
		console.log('📧 Password reset requested for:', email);

		if (!email) {
			return json({ error: 'Email required' }, { status: 400 });
		}

		// Normalize email
		const normalizedEmail = email.toLowerCase().trim();
		console.log('='.repeat(50));
		console.log('🔍 LOOKING FOR USER');
		console.log('   Input email:', email);
		console.log('   Normalized:', normalizedEmail);
		console.log('='.repeat(50));

		// STEP 1: Find the user with this EXACT email
		const { data: user, error: findError } = (await supabase
			.from('users')
			.select('id, email, full_name')
			.eq('email', normalizedEmail)
			.single()) as { data: User | null; error: PostgrestError | null };

		// Log EVERYTHING about what we found
		console.log('📊 QUERY RESULT:');
		if (findError) {
			console.log('   ❌ Error:', findError.message);
			console.log('   Error code:', findError.code);
			console.log('   Error details:', findError.details);
		}
		if (user) {
			console.log('   ✅ USER FOUND:');
			console.log('   ID:', user.id);
			console.log('   Email:', user.email);
			console.log('   Full Name:', user.full_name);
			console.log('   Email match:', user.email === normalizedEmail ? '✅ MATCH' : '❌ MISMATCH');
		} else {
			console.log('   ❌ No user data returned');
		}
		console.log('='.repeat(50));

		if (!user) {
			console.log('⚠️ No user found with email:', normalizedEmail);
			console.log('   Returning success message (security best practice)');
			// For security, still return success (don't reveal if email exists)
			return json({
				success: true,
				message: 'If an account exists with that email, a password reset link has been sent.'
			});
		}

		// CRITICAL VERIFICATION: Make absolutely sure we have the right user
		console.log('🔐 VERIFYING USER MATCH:');
		console.log('   Requested email:', normalizedEmail);
		console.log('   Found user email:', user.email);
		console.log('   Found user ID:', user.id);
		console.log('   Found user full_name:', user.full_name);

		if (user.email.toLowerCase() !== normalizedEmail) {
			console.error('🚨 CRITICAL ERROR: Email mismatch!');
			console.error('   This should NEVER happen!');
			return json(
				{
					success: false,
					error: 'System error. Please try again or contact support.'
				},
				{ status: 500 }
			);
		}

		console.log('   ✅ Email matches - proceeding with reset');
		console.log('='.repeat(50));

		// STEP 2: Generate reset token
		const resetToken = crypto.getRandomValues(new Uint8Array(32));
		const tokenHex = Array.from(resetToken)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');

		console.log('🔑 Generated token length:', tokenHex.length);

		// STEP 3: Delete any old tokens for THIS user
		await supabase.from('password_resets').delete().eq('user_id', user.id);

		// STEP 4: Calculate expiration (1 hour from now)
		const now = new Date();
		const expiresAt = new Date(now.getTime() + 3600000); // 1 hour

		console.log('⏰ Token expires at:', expiresAt.toISOString());

		// STEP 5: Save new token for THIS user
		const { data: savedToken, error: saveError } = await supabase
			.from('password_resets')
			.insert({
				user_id: user.id,
				token: tokenHex,
				expires_at: expiresAt.toISOString(),
				created_at: now.toISOString(),
				used_at: null
			})
			.select('id, user_id, token, expires_at')
			.single();

		if (saveError) {
			console.error('❌ Failed to save token:', saveError);
			return json(
				{
					success: false,
					error: 'Failed to save reset token. Please try again.'
				},
				{ status: 500 }
			);
		}

		console.log('✅ Token saved successfully!');
		console.log('   Token ID:', savedToken.id);
		console.log('   For User ID:', savedToken.user_id);
		console.log('   Expires:', savedToken.expires_at);

		// Verify it's saved for the RIGHT user
		if (savedToken.user_id !== user.id) {
			console.error('🚨 CRITICAL ERROR: Token saved for wrong user!');
			console.error('   Expected:', user.id);
			console.error('   Got:', savedToken.user_id);
			return json(
				{
					success: false,
					error: 'System error. Please contact support.'
				},
				{ status: 500 }
			);
		}

		// STEP 6: Create reset link
		const resetLink = `${url.origin}/reset-password?token=${tokenHex}`;
		console.log('🔗 Reset link created');

		// STEP 7: Send email to THIS user
		console.log('='.repeat(50));
		console.log('📧 SENDING EMAIL:');
		console.log('   To:', user.email);
		console.log('   Greeting:', user.email);
		console.log('   User ID:', user.id);
		console.log('='.repeat(50));

		const htmlContent = generatePasswordResetEmail(
			user.email, // Use email instead of full_name
			resetLink,
			expiresAt
		);

		console.log('📤 Attempting to send email via Resend...');
		console.log('   From: Laveona <onboarding@resend.dev>');
		console.log('   To:', user.email);
		console.log('   Subject: Reset Your Password - Laveona');

		const { data: emailData, error: emailError } = await resend.emails.send({
			from: 'Laveona <onboarding@resend.dev>',
			to: user.email, // Send to the user who requested it!
			subject: 'Reset Your Password - Laveona',
			html: htmlContent,
			text: `Reset your password: ${resetLink}\nExpires in 1 hour.`
		});

		if (emailError) {
			console.error('❌ Email send error:');
			console.error('   Message:', emailError.message);
			console.error('   Name:', emailError.name);
			console.error('   Full error:', JSON.stringify(emailError, null, 2));
			// Token is saved, but email failed - still return success for security
		} else {
			console.log('✅ Email sent successfully!');
			console.log('   Email ID:', emailData?.id);
			console.log('   Sent to:', user.email);
		}

		// STEP 8: Return success
		console.log('🎉 Password reset process completed for:', user.email);

		return json({
			success: true,
			message: 'Password reset email sent!',
			resetLink: resetLink // For testing - remove in production
		});
	} catch (error) {
		console.error('❌ Server error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

// EMAIL TEMPLATE
function generatePasswordResetEmail(userName: string, resetLink: string, expiresAt: Date): string {
	const formattedTime = expiresAt.toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
		timeZoneName: 'short'
	});

	const formattedDate = expiresAt.toLocaleDateString([], {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
		.content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
		.reset-button { background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
		.link-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; word-break: break-all; font-family: monospace; font-size: 14px; }
		.time-info { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
	</style>
</head>
<body>
	<div class="header">
		<h1>Reset Your Password</h1>
	</div>
	<div class="content">
		<p>Hi <strong>${userName}</strong>,</p>
		<p>Click the button below to reset your password:</p>
		
		<div style="text-align: center;">
			<a href="${resetLink}" class="reset-button">Reset Password</a>
		</div>
		
		<p>Or copy this link:</p>
		<div class="link-box">${resetLink}</div>
		
		<div class="time-info">
			<p><strong>⏰ Expiration Time:</strong></p>
			<p>This link expires on <strong>${formattedDate}</strong> at <strong>${formattedTime}</strong></p>
			<p><em>(Approximately 1 hour from when this email was sent)</em></p>
		</div>
		
		<p>If you didn't request this, please ignore this email.</p>
		
		<p style="margin-top: 30px;">Best regards,<br><strong>Laveona Team</strong></p>
	</div>
</body>
</html>
	`;
}
