import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const XENDIT_SECRET_KEY =
	process.env.XENDIT_SECRET_KEY ||
	'xnd_development_HpHhooCnnk5uU3D2D43bbVKrI6zulCrLHT1gA51sUNMnz6IDXip5e6vRLHu6';
const XENDIT_API_URL = 'https://api.xendit.co';

interface OrderItem {
	id: number;
	name: string;
	price: number;
	quantity: number;
	category: string;
}

interface Customer {
	name: string;
	email: string;
	phone: string;
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

export const POST: RequestHandler = async ({ request }) => {
	try {
		const orderData: OrderData = await request.json();

		const invoiceData = {
			external_id: `order-${Date.now()}`,
			amount: orderData.amount,
			currency: orderData.currency,
			customer: {
				given_names: orderData.customer.name,
				email: orderData.customer.email,
				mobile_number: orderData.customer.phone
			},
			items: orderData.items.map((item) => ({
				name: item.name,
				quantity: item.quantity,
				price: item.price,
				category: item.category
			})),
			payment_methods: getPaymentMethods(orderData.paymentMethod),
			success_redirect_url: orderData.successUrl,
			failure_redirect_url: orderData.failureUrl,
			description: `Order for ${orderData.customer.name}`
		};

		const response = await fetch(`${XENDIT_API_URL}/v2/invoices`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64')}`
			},
			body: JSON.stringify(invoiceData)
		});

		const data = await response.json();

		if (response.ok) {
			return json({
				success: true,
				paymentUrl: data.invoice_url,
				invoiceId: data.id
			});
		} else {
			throw new Error(data.message || 'Failed to create payment');
		}
	} catch (error) {
		console.error('Xendit payment error:', error);
		const errorMessage = error instanceof Error ? error.message : 'Payment creation failed';
		return json(
			{
				success: false,
				error: errorMessage
			},
			{ status: 500 }
		);
	}
};

function getPaymentMethods(method: string): string[] {
	switch (method) {
		case 'EWALLET':
			return ['GCASH', 'PAYMAYA'];
		case 'VIRTUAL_ACCOUNT':
			return ['BPI', 'BDO', 'RCBC', 'CHINABANK', 'UNIONBANK'];
		case 'CREDIT_CARD':
			return ['CREDIT_CARD', 'DEBIT_CARD'];
		default:
			return ['GCASH', 'PAYMAYA', 'CREDIT_CARD'];
	}
}
