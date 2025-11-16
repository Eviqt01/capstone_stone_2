import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

// ==================== TYPE DEFINITIONS ====================
interface XenditWebhookPayload {
	id: string;
	external_id: string;
	status: 'PAID' | 'EXPIRED' | 'FAILED';
	paid_amount: number;
	payment_method: string;
	merchant_name?: string;
	paid_at?: string;
}

interface OrderItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
	category: string;
}

interface DatabaseOrder {
	id: string;
	customer_name: string;
	customer_email: string;
	customer_phone: string;
	customer_address: string;
	total: number;
	status: string;
	payment_method: string;
	invoice_id: string;
	items: OrderItem[];
	created_at: string;
	updated_at: string;
}

interface EmailResponse {
	success: boolean;
	error?: string;
	message?: string;
	emailId?: string;
}

interface EmailPayload {
	to: string;
	subject: string;
	orderData: {
		orderId: string;
		paymentMethod: string;
		status: string;
		paidAmount: number;
		paidAt: string;
		customer_name: string;
		customer_email: string;
		customer_phone: string;
		customer_address: string;
		total: number;
		items: OrderItem[];
	};
	customerName: string;
	paymentStatus: string;
}

// ==================== EMAIL FUNCTION ====================
async function sendOrderReceiptEmail(
	orderData: DatabaseOrder & {
		orderId: string;
		paymentMethod: string;
		paidAmount: number;
		paidAt: string;
	},
	customerEmail: string,
	customerName: string
): Promise<EmailResponse> {
	try {
		const emailPayload: EmailPayload = {
			to: customerEmail,
			subject: `Order Confirmation - #${orderData.orderId}`,
			orderData: {
				orderId: orderData.orderId,
				paymentMethod: orderData.paymentMethod,
				status: 'PAID',
				paidAmount: orderData.paidAmount,
				paidAt: orderData.paidAt,
				customer_name: orderData.customer_name,
				customer_email: orderData.customer_email,
				customer_phone: orderData.customer_phone,
				customer_address: orderData.customer_address,
				total: orderData.total,
				items: orderData.items
			},
			customerName: customerName,
			paymentStatus: 'PAID'
		};

		console.log('🎉 Sending SUCCESSFUL payment email to:', customerEmail);
		console.log('💰 Payment confirmed for order:', orderData.orderId);

		const response = await fetch(
			`${process.env.ORIGIN || 'http://localhost:5173'}/api/email/send`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(emailPayload)
			}
		);

		if (!response.ok) {
			throw new Error(`Email API responded with status: ${response.status}`);
		}

		const result: EmailResponse = await response.json();

		if (result.success) {
			console.log('✅ Order receipt email sent for SUCCESSFUL payment');
			await recordActivity(`Order receipt sent to ${customerEmail}`, 'email_sent', 'green');
		} else {
			console.error('❌ Failed to send successful payment email:', result.error);
			await recordActivity(`Failed to send email to ${customerEmail}`, 'email_error', 'red');
		}

		return result;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		console.error('Error sending successful payment email:', errorMessage);
		await recordActivity(`Email service error: ${errorMessage}`, 'email_error', 'red');
		return {
			success: false,
			error: 'Email service unavailable'
		};
	}
}

// ==================== ACTIVITY LOGGING ====================
async function recordActivity(
	message: string,
	type: string = 'webhook',
	color: string = 'blue'
): Promise<boolean> {
	try {
		const { error } = await supabase.from('activities').insert([
			{
				message,
				type,
				color
			}
		]);

		if (error) {
			console.error('Failed to record activity:', error);
			return false;
		}

		return true;
	} catch (e) {
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		console.error('Failed to record activity:', errorMessage);
		return false;
	}
}

// ==================== STOCK MANAGEMENT ====================
async function restoreStockForItems(items: OrderItem[]): Promise<void> {
	try {
		for (const item of items) {
			const { data: product, error } = await supabase
				.from('products')
				.select('stock')
				.eq('id', item.id)
				.single();

			if (error) {
				console.error(`Error fetching product ${item.id}:`, error);
				continue;
			}

			if (product) {
				const { error: updateError } = await supabase
					.from('products')
					.update({ stock: (product.stock || 0) + item.quantity })
					.eq('id', item.id);

				if (updateError) {
					console.error(`Error restoring stock for product ${item.id}:`, updateError);
				} else {
					console.log(`🔄 Restored ${item.quantity} stock for product ${item.id}`);
				}
			}
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Error restoring stock:', errorMessage);
	}
}

// ==================== MAIN WEBHOOK HANDLER ====================
export const POST: RequestHandler = async ({ request }) => {
	try {
		const webhookData: XenditWebhookPayload = await request.json();

		console.log('🔄 Webhook received:', {
			external_id: webhookData.external_id,
			status: webhookData.status,
			payment_method: webhookData.payment_method,
			paid_amount: webhookData.paid_amount
		});

		// Find the order by invoice_id (external_id)
		const { data: order, error } = await supabase
			.from('orders')
			.select('*')
			.eq('invoice_id', webhookData.external_id)
			.single();

		if (error || !order) {
			console.error('❌ Order not found for webhook:', webhookData.external_id);
			await recordActivity(
				`Webhook error: Order not found for ${webhookData.external_id}`,
				'webhook_error',
				'red'
			);
			return json({ success: false, error: 'orders not found' }, { status: 404 }); // ← CHANGED HERE
		}

		console.log('📦 Order found:', order.id, 'Current status:', order.status);

		// ✅ PROCESS SUCCESSFUL PAYMENTS
		if (webhookData.status === 'PAID') {
			// Update order status to "PAID"
			const { error: updateError } = await supabase
				.from('orders')
				.update({
					status: 'Completed',
					updated_at: new Date().toISOString(),
					payment_method: webhookData.payment_method
				})
				.eq('invoice_id', webhookData.external_id);
			if (updateError) {
				console.error('❌ Failed to update order status:', updateError);
				await recordActivity(`Failed to update order ${order.id} to PAID`, 'webhook_error', 'red');
				return json({ success: false, error: 'Failed to update order' }, { status: 500 });
			}

			console.log('✅ Order status updated to PAID:', order.id);

			// ✅ NOW send the email - payment is confirmed!
			const emailResult: EmailResponse = await sendOrderReceiptEmail(
				{
					...order,
					orderId: order.id,
					paymentMethod: webhookData.payment_method,
					paidAmount: webhookData.paid_amount,
					paidAt: webhookData.paid_at || new Date().toISOString()
				},
				order.customer_email,
				order.customer_name
			);

			// Log email result
			if (emailResult.success) {
				console.log('📧 Email sent successfully for order:', order.id);
			} else {
				console.warn('⚠️ Email sending failed for order:', order.id, emailResult.error);
			}

			// Record successful payment activity
			await recordActivity(
				`Payment confirmed for order #${order.id.slice(0, 8)} via ${webhookData.payment_method} - ₱${webhookData.paid_amount.toLocaleString()}`,
				'payment_success',
				'green'
			);

			console.log('🎉 Payment completed and email sent for order:', order.id);

			// ✅ PROCESS FAILED/EXPIRED PAYMENTS
		} else if (webhookData.status === 'EXPIRED' || webhookData.status === 'FAILED') {
			console.log('❌ Payment failed/expired:', webhookData.external_id);

			// Update order status to "FAILED"
			const { error: updateError } = await supabase
				.from('orders')
				.update({
					status: 'FAILED',
					updated_at: new Date().toISOString()
				})
				.eq('invoice_id', webhookData.external_id);

			if (updateError) {
				console.error('❌ Failed to update order status to FAILED:', updateError);
			} else {
				console.log('✅ Order status updated to FAILED:', order.id);
			}

			// Restore stock for failed payments
			await restoreStockForItems(order.items);

			await recordActivity(
				`Payment failed for order #${order.id.slice(0, 8)} - Status: ${webhookData.status}`,
				'payment_failed',
				'red'
			);

			console.log('🔄 Stock restored for failed order:', order.id);
		} else {
			console.log('ℹ️ Unknown webhook status:', webhookData.status);
			await recordActivity(
				`Unknown webhook status received: ${webhookData.status} for order ${webhookData.external_id}`,
				'webhook_unknown',
				'yellow'
			);
		}

		return json({
			success: true,
			received: true,
			orderId: order?.id,
			status: webhookData.status
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		console.error('Webhook processing error:', errorMessage);
		await recordActivity(`Webhook error: ${errorMessage}`, 'webhook_error', 'red');
		return json(
			{
				success: false,
				error: 'Webhook processing failed'
			},
			{ status: 500 }
		);
	}
};
