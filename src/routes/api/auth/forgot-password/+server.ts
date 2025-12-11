// src/routes/api/auth/forgot-password/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Resend } from 'resend';
import { supabase } from '$lib/server/supabase';

// Initialize Resend with your API key
const resendApiKey = 're_HHKPzECm_2dwoLC8C2TnQmGt4aUspkryf';
const resend = new Resend(resendApiKey);

console.log('🔐 Password reset endpoint ready!', {
	hasApiKey: !!resendApiKey,
	apiKeyPrefix: resendApiKey ? resendApiKey.substring(0, 10) + '...' : 'none'
});

interface ResetPasswordRequest {
	email: string;
}

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const { email }: ResetPasswordRequest = await request.json();

		console.log('🔑 Password reset requested for:', email);

		// Validate email
		if (!email || !email.includes('@')) {
			console.log('❌ Invalid email format:', email);
			return json(
				{
					success: false,
					error: 'Please provide a valid email address'
				},
				{ status: 400 }
			);
		}

		// Find user by email
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('id, email, name')
			.eq('email', email.toLowerCase())
			.single();

		// Always return success for security (don't reveal if email exists)
		if (!user || userError) {
			console.log('ℹ️ Password reset requested for non-existent email:', email);
			return json({
				success: true,
				message: 'If an account exists with this email, a password reset link has been sent.'
			});
		}

		console.log('👤 User found:', { id: user.id, name: user.name });

		// Generate secure reset token
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
			console.error('❌ Error saving reset token:', insertError);
			return json(
				{
					success: false,
					error: 'Failed to create reset token'
				},
				{ status: 500 }
			);
		}

		console.log('✅ Reset token generated and saved');

		// Build reset link
		const baseUrl = process.env.APP_URL || url.origin;
		const resetLink = `${baseUrl}/reset-password?token=${tokenHex}`;

		console.log('🔗 Reset link created:', resetLink);

		// Generate email content
		const htmlContent = generatePasswordResetEmail(
			user.name || user.email.split('@')[0],
			resetLink
		);
		const textContent = generateTextVersion(user.name || user.email.split('@')[0], resetLink);

		console.log('📧 Attempting to send password reset email to:', user.email);

		// Send email using Resend
		const { data, error } = await resend.emails.send({
			from: 'Laveona <onboarding@resend.dev>',
			to: user.email,
			subject: 'Reset Your Password - Laveona',
			html: htmlContent,
			text: textContent
		});

		console.log('📧 Resend API response received:', { data, error });

		if (error) {
			console.error('❌ Resend error:', error);

			// Even if email fails, still log the reset link for testing
			console.log('🔗 TESTING - Password reset link (email failed):', resetLink);

			// Return success but with a note about email issues
			return json({
				success: true,
				message: 'Password reset processed. Check console for testing link.',
				warning: 'Email delivery failed. Please contact support.',
				// Only include resetLink in development for testing
				resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
			});
		}

		console.log('✅ Password reset email sent successfully to:', user.email);
		console.log('📧 Resend Email ID:', data?.id);

		return json({
			success: true,
			message: 'Password reset link has been sent to your email',
			// Only include resetLink in development for testing
			resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
		});
	} catch (error) {
		console.error('❌ Password reset endpoint error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to process password reset'
			},
			{ status: 500 }
		);
	}
};

function generatePasswordResetEmail(userName: string, resetLink: string): string {
	const expiryTime = new Date(Date.now() + 3600000);

	return `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<style>
			body { 
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
				line-height: 1.6; 
				color: #333; 
				max-width: 600px; 
				margin: 0 auto; 
				padding: 20px; 
			}
			.header { 
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
				color: white; 
				padding: 40px 30px; 
				text-align: center; 
				border-radius: 10px 10px 0 0; 
			}
			.content { 
				background: white; 
				padding: 40px; 
				border-radius: 0 0 10px 10px; 
				box-shadow: 0 2px 20px rgba(0,0,0,0.1); 
				border: 1px solid #e1e1e1;
				border-top: none;
			}
			.reset-button { 
				display: inline-block; 
				background: #4F46E5; 
				color: white; 
				padding: 16px 40px; 
				text-decoration: none; 
				border-radius: 8px; 
				font-weight: 600; 
				font-size: 16px; 
				margin: 25px 0; 
				transition: all 0.3s ease;
				box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
			}
			.reset-button:hover { 
				background: #4338CA; 
				transform: translateY(-2px);
				box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3);
			}
			.link-box { 
				background: #f8fafc; 
				padding: 20px; 
				border-radius: 8px; 
				border-left: 4px solid #4F46E5; 
				word-break: break-all; 
				font-size: 14px; 
				margin: 25px 0; 
				font-family: 'Courier New', monospace;
			}
			.info-box { 
				background: #fef3c7; 
				padding: 20px; 
				border-radius: 8px; 
				border-left: 4px solid #F59E0B; 
				margin: 25px 0; 
			}
			.footer { 
				text-align: center; 
				padding: 30px 0; 
				color: #666; 
				margin-top: 30px; 
				border-top: 1px solid #e1e1e1; 
			}
			.info-row { 
				display: flex; 
				justify-content: space-between; 
				margin-bottom: 12px; 
				padding-bottom: 12px;
				border-bottom: 1px solid #eee;
			}
			.info-label { 
				font-weight: 600; 
				color: #555; 
			}
			.info-value { 
				font-weight: 500; 
			}
			.security-note { 
				background: #fef2f2; 
				padding: 15px; 
				border-radius: 6px; 
				margin: 20px 0; 
				font-size: 14px; 
				color: #991B1B;
				border: 1px solid #FECACA;
			}
		</style>
	</head>
	<body>
		<div class="header">
			<h1 style="margin: 0; font-size: 32px;">🔒 Password Reset</h1>
			<p style="margin: 10px 0 0; opacity: 0.9; font-size: 18px;">Your security is our priority</p>
		</div>
		
		<div class="content">
			<p style="font-size: 18px;">Hi <strong style="color: #4F46E5;">${userName}</strong>,</p>
			<p>We received a request to reset the password for your Laveona account. Click the button below to create a new password:</p>
			
			<div style="text-align: center;">
				<a href="${resetLink}" class="reset-button">Reset Your Password</a>
			</div>
			
			<p>Or copy and paste this link into your browser:</p>
			
			<div class="link-box">
				${resetLink}
			</div>
			
			<div class="info-box">
				<h3 style="margin-top: 0; color: #92400E;">⚠️ Important Information</h3>
				<div class="info-row">
					<span class="info-label">Link Expires:</span>
					<span class="info-value">${expiryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} today</span>
				</div>
				<div class="info-row">
					<span class="info-label">Time Remaining:</span>
					<span class="info-value" style="color: #DC2626; font-weight: bold;">1 hour</span>
				</div>
				<div class="info-row" style="border-bottom: none;">
					<span class="info-label">For Account:</span>
					<span class="info-value">${userName}</span>
				</div>
			</div>
			
			<div class="security-note">
				<strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. 
				Your account remains secure, and no changes have been made.
			</div>
			
			<p>Need help? Contact our support team:</p>
			<ul style="margin: 15px 0; padding-left: 20px;">
				<li>📧 Email: <a href="mailto:support@laveona.com" style="color: #4F46E5;">support@laveona.com</a></li>
				<li>📞 Phone: +63 123 456 7890</li>
				<li>🕒 Hours: Monday-Friday, 9AM-6PM PHT</li>
			</ul>
			
			<p style="margin-top: 30px;">Best regards,<br><strong style="color: #4F46E5; font-size: 18px;">The Laveona Team</strong></p>
		</div>
		
		<div class="footer">
			<p style="margin: 0 0 10px 0;">
				<a href="https://laveona.com" style="color: #4F46E5; text-decoration: none;">🌐 laveona.com</a> | 
				<a href="https://laveona.com/privacy" style="color: #4F46E5; text-decoration: none;">🔒 Privacy Policy</a> | 
				<a href="https://laveona.com/help" style="color: #4F46E5; text-decoration: none;">❓ Help Center</a>
			</p>
			<p style="margin: 0; font-size: 14px; color: #999;">
				© ${new Date().getFullYear()} Laveona. All rights reserved.<br>
				<small>This is an automated message, please do not reply to this email.</small>
			</p>
		</div>
	</body>
	</html>
	`;
}

function generateTextVersion(userName: string, resetLink: string): string {
	const expiryTime = new Date(Date.now() + 3600000);

	let text = `PASSWORD RESET REQUEST\n\n`;
	text += `Hi ${userName},\n\n`;
	text += `We received a request to reset the password for your Laveona account.\n\n`;

	text += `RESET YOUR PASSWORD:\n`;
	text += `${resetLink}\n\n`;

	text += `IMPORTANT INFORMATION:\n`;
	text += `• Link Expires: ${expiryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
	text += `• Time Remaining: 1 hour\n`;
	text += `• For Account: ${userName}\n\n`;

	text += `SECURITY NOTICE:\n`;
	text += `If you didn't request this password reset, please ignore this email.\n`;
	text += `Your account remains secure, and no changes have been made.\n\n`;

	text += `NEED HELP?\n`;
	text += `• Email: support@laveona.com\n`;
	text += `• Phone: +63 123 456 7890\n`;
	text += `• Hours: Monday-Friday, 9AM-6PM PHT\n\n`;

	text += `Best regards,\n`;
	text += `The Laveona Team\n\n`;
	text += `---\n`;
	text += `© ${new Date().getFullYear()} Laveona\n`;
	text += `laveona.com | Privacy Policy | Help Center`;

	return text;
}
