import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import { env } from '$lib/server/env';

const XENDIT_SECRET_KEY =
	env.XENDIT_SECRET_KEY ||
	'xnd_development_HpHhooCnnk5uU3D2D43bbVKrI6zulCrLHT1gA51sUNMnz6IDXip5e6vRLHu6';
const XENDIT_API_URL = 'https://api.xendit.co';

interface OrderItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
	category: string;
}

interface Customer {
	name: string;
	email: string;
	phone: string;
	address: string;
	comments: string; // <-- ADDED THIS
}

interface OrderData {
	amount: number;
	currency: string;
	customer: Customer;
	items: OrderItem[];
	paymentMethod: string;
	successUrl: string;
	failureUrl: string;
}

interface XenditInvoicePayload {
	external_id: string;
	amount: number;
	currency: string;
	customer: {
		given_names: string;
		email: string;
		mobile_number: string;
		address?: string;
	};
	items: Array<{
		name: string;
		quantity: number;
		price: number;
		category: string;
	}>;
	payment_methods?: string[];
	success_redirect_url: string;
	failure_redirect_url: string;
	description: string;
	metadata?: {
		selected_payment_method: string;
		payment_method_display: string;
		customer_address: string;
		customer_comments?: string; // <-- ADDED THIS (optional for Xendit)
	};
	payment_method?: string;
}

interface DatabaseOrder {
	id: string;
	customer_name: string;
	customer_email: string;
	customer_phone: string;
	customer_address: string;
	comments: string; // <-- ADDED THIS
	total: number;
	status: string;
	payment_method: string;
	invoice_id: string;
	items: OrderItem[];
	created_at: string;
	updated_at: string;
}

// ==================== STOCK MANAGEMENT ====================
async function reduceStockForItems(
	items: OrderItem[]
): Promise<{ success: boolean; error?: string }> {
	try {
		for (const item of items) {
			const { data: product, error } = await supabase
				.from('products')
				.select('stock, name')
				.eq('id', item.id)
				.single();

			if (error || !product) {
				return { success: false, error: `Product "${item.name}" not found` };
			}

			if (product.stock < item.quantity) {
				return {
					success: false,
					error: `Not enough stock for ${item.name}. Available: ${product.stock}`
				};
			}

			const { error: updateError } = await supabase
				.from('products')
				.update({ stock: product.stock - item.quantity })
				.eq('id', item.id);

			if (updateError) {
				return { success: false, error: `Failed to update stock for ${item.name}` };
			}
		}
		return { success: true };
	} catch (e) {
		console.error('Stock reduction error:', e);
		return { success: false, error: 'Failed to reduce stock' };
	}
}

async function restoreStockForItems(items: OrderItem[]): Promise<void> {
	for (const item of items) {
		const { data: product } = await supabase
			.from('products')
			.select('stock')
			.eq('id', item.id)
			.single();

		if (product) {
			await supabase
				.from('products')
				.update({ stock: (product.stock || 0) + item.quantity })
				.eq('id', item.id);
		}
	}
}

// ==================== ORDER MANAGEMENT ====================
async function createOrderInDatabase(
	orderData: OrderData,
	invoiceId: string
): Promise<DatabaseOrder> {
	const orderId = `order_${Date.now()}`;
	const now = new Date().toISOString();

	console.log('💾 Saving order to database with comments:', orderData.customer.comments); // Debug log

	const orderRecord = {
		id: orderId,
		customer_name: orderData.customer.name,
		customer_email: orderData.customer.email,
		customer_phone: orderData.customer.phone,
		customer_address: orderData.customer.address,
		comments: orderData.customer.comments || '', // <-- CRITICAL: ADDED THIS
		total: orderData.amount,
		status: 'PENDING',
		payment_method: orderData.paymentMethod,
		invoice_id: invoiceId,
		items: orderData.items,
		created_at: now,
		updated_at: now
	};

	const { data: order, error } = await supabase
		.from('orders')
		.insert([orderRecord])
		.select()
		.single();

	if (error) throw error;
	return order as DatabaseOrder;
}

async function recordActivity(
	message: string,
	type: string = 'order',
	color: string = 'blue'
): Promise<boolean> {
	try {
		await supabase.from('activities').insert([
			{
				message,
				type,
				color
			}
		]);
		return true;
	} catch (e) {
		console.error('Failed to record activity:', e);
		return false;
	}
}

// ==================== PAYMENT METHOD CONFIGURATION ====================
function configurePaymentMethod(paymentMethod: string, invoicePayload: XenditInvoicePayload) {
	const upperMethod = paymentMethod.toUpperCase();

	switch (upperMethod) {
		case 'GCASH':
			invoicePayload.payment_methods = ['GCASH'];
			console.log('🔒 Configuring GCash payment');
			break;

		case 'PAYMAYA':
		case 'MAYA':
			invoicePayload.payment_methods = ['PAYMAYA'];
			console.log('🔒 Configuring Maya payment');
			break;

		case 'CREDIT_CARD':
			invoicePayload.payment_method = 'CREDIT_CARD';
			console.log('🔒 Configuring Credit Card payment');
			break;

		case 'DEBIT_CARD':
			invoicePayload.payment_method = 'DEBIT_CARD';
			console.log('🔒 Configuring Debit Card payment');
			break;

		case 'BDO':
		case 'BDO_VA':
			invoicePayload.payment_methods = ['BDO'];
			invoicePayload.payment_method = 'BDO';
			console.log('🔒 Configuring BDO Virtual Account');
			break;

		case 'BPI':
			invoicePayload.payment_methods = ['BPI'];
			invoicePayload.payment_method = 'BPI';
			console.log('🔒 Configuring BPI Virtual Account');
			break;

		case 'RCBC':
			invoicePayload.payment_methods = ['RCBC'];
			invoicePayload.payment_method = 'RCBC';
			console.log('🔒 Configuring RCBC Virtual Account');
			break;

		case 'UNIONBANK':
			invoicePayload.payment_methods = ['UNIONBANK'];
			invoicePayload.payment_method = 'UNIONBANK';
			console.log('🔒 Configuring UnionBank Virtual Account');
			break;

		case 'VIRTUAL_ACCOUNT':
		case 'BANK_TRANSFER':
			invoicePayload.payment_methods = ['BDO', 'BPI', 'RCBC', 'UNIONBANK'];
			console.log('🔒 Showing multiple bank options');
			break;

		case 'EWALLET':
			invoicePayload.payment_methods = ['GCASH', 'PAYMAYA'];
			console.log('🔒 Showing e-wallet options');
			break;

		default:
			invoicePayload.payment_methods = ['GCASH'];
			console.log('🔒 Defaulting to GCash');
	}
}

function getPaymentMethodName(method: string): string {
	switch (method.toUpperCase()) {
		case 'GCASH':
			return 'GCash';
		case 'PAYMAYA':
		case 'MAYA':
			return 'Maya';
		case 'EWALLET':
			return 'E-Wallet';
		case 'VIRTUAL_ACCOUNT':
			return 'Bank Transfer';
		case 'BDO':
			return 'BDO Virtual Account';
		case 'BPI':
			return 'BPI Virtual Account';
		case 'RCBC':
			return 'RCBC Virtual Account';
		case 'UNIONBANK':
			return 'UnionBank Virtual Account';
		case 'CREDIT_CARD':
			return 'Credit Card';
		case 'DEBIT_CARD':
			return 'Debit Card';
		default:
			return method;
	}
}

// ==================== MAIN PAYMENT ENDPOINT ====================
export const POST: RequestHandler = async ({ request }) => {
	try {
		const orderData: OrderData = await request.json();

		console.log('💰 Payment method received:', orderData.paymentMethod);
		console.log('📝 Customer comments received:', orderData.customer.comments); // <-- ADDED DEBUG LOG

		// Get payment method name early
		const paymentMethodName = getPaymentMethodName(orderData.paymentMethod);
		console.log('💳 Payment method display name:', paymentMethodName);

		// Reduce stock temporarily
		const stockResult = await reduceStockForItems(orderData.items);
		if (!stockResult.success) {
			await recordActivity(`Order failed: ${stockResult.error}`, 'error', 'red');
			return json({ success: false, error: stockResult.error }, { status: 400 });
		}

		const invoiceId = `order-${Date.now()}`;

		const invoicePayload: XenditInvoicePayload = {
			external_id: invoiceId,
			amount: orderData.amount,
			currency: orderData.currency,
			customer: {
				given_names: orderData.customer.name,
				email: orderData.customer.email,
				mobile_number: orderData.customer.phone,
				address: orderData.customer.address
			},
			items: orderData.items.map((i) => ({
				name: i.name,
				quantity: i.quantity,
				price: i.price,
				category: i.category
			})),
			success_redirect_url: orderData.successUrl,
			failure_redirect_url: orderData.failureUrl,
			description: `Order for ${orderData.customer.name}`,
			metadata: {
				selected_payment_method: orderData.paymentMethod,
				payment_method_display: paymentMethodName,
				customer_address: orderData.customer.address,
				customer_comments: orderData.customer.comments || '' // <-- ADDED THIS (optional)
			}
		};

		configurePaymentMethod(orderData.paymentMethod, invoicePayload);

		console.log('🎯 Final Xendit payload:', JSON.stringify(invoicePayload, null, 2));

		// Create Xendit invoice
		const xenditRes = await fetch(`${XENDIT_API_URL}/v2/invoices`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64')}`
			},
			body: JSON.stringify(invoicePayload)
		});

		const xenditData = await xenditRes.json();

		if (!xenditRes.ok) {
			// Restore stock if payment creation fails
			await restoreStockForItems(orderData.items);
			await recordActivity(
				`Payment creation failed: ${xenditData.message || 'Xendit error'}`,
				'payment_failed',
				'red'
			);
			return json(
				{ success: false, error: xenditData.message || 'Payment creation failed' },
				{ status: xenditRes.status }
			);
		}

		// Create order in database as PENDING
		const order = await createOrderInDatabase(orderData, invoiceId);

		console.log('🔄 Order created as PENDING:', order.id);
		console.log('✅ Comments saved to database:', order.comments); // <-- ADDED DEBUG LOG
		console.log('⏳ Waiting for payment confirmation via webhook...');

		// Record activities
		await recordActivity(
			`New order #${order.id.slice(0, 8)} from ${orderData.customer.name}`,
			'order_created',
			'blue'
		);
		await recordActivity(
			`${paymentMethodName} payment initiated – ₱${orderData.amount.toLocaleString()}`,
			'payment_initiated',
			'blue'
		);

		console.log('✅ Xendit response:', {
			invoice_url: xenditData.invoice_url,
			available_methods: xenditData.available_payment_methods,
			payment_method: xenditData.payment_method,
			status: xenditData.status
		});

		return json({
			success: true,
			paymentUrl: xenditData.invoice_url,
			invoiceId: xenditData.id,
			orderId: order.id,
			paymentMethod: paymentMethodName,
			status: 'PENDING'
		});
	} catch (e) {
		console.error('Payment endpoint error:', e);
		await recordActivity(
			`System error: ${e instanceof Error ? e.message : 'Unknown'}`,
			'error',
			'red'
		);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
