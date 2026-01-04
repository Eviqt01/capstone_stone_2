import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Resend } from 'resend';

// Initialize Resend with your API key
const resendApiKey = 're_HHKPzECm_2dwoLC8C2TnQmGt4aUspkryf';
const resend = new Resend(resendApiKey);

console.log('📧 Resend email backend ready!', {
	hasApiKey: !!resendApiKey,
	apiKeyPrefix: resendApiKey ? resendApiKey.substring(0, 10) + '...' : 'none'
});

interface OrderItem {
	name: string;
	price: number;
	quantity: number;
}

interface CustomerInfo {
	address?: string;
}

interface OrderData {
	orderId?: string;
	id?: string;
	amount?: number;
	totalAmount?: number;
	items?: OrderItem[];
	customer?: CustomerInfo;
	paymentMethod?: string;
}

interface EmailRequest {
	to: string;
	subject: string;
	orderData: OrderData;
	customerName: string;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { to, subject, orderData, customerName }: EmailRequest = await request.json();

		console.log('📧 Sending order receipt to:', to);
		console.log('💳 Payment method:', orderData.paymentMethod);

		const htmlContent = generateOrderReceiptEmail(orderData, customerName);
		const textContent = generateTextVersion(orderData, customerName);

		console.log('🔐 Attempting to send with Resend...');

		// Send email using Resend
		const { data, error } = await resend.emails.send({
			from: 'Laveona <orders@laveona-shop.com>',
			to: to,
			subject: subject,
			html: htmlContent,
			text: textContent
		});

		console.log('📧 Resend API response received:', { data, error });

		if (error) {
			console.error('❌ Resend error:', error);
			return json({
				success: false,
				error: typeof error === 'object' ? JSON.stringify(error) : String(error)
			});
		}

		console.log('✅ Email sent successfully via Resend to:', to);
		console.log('📧 Resend Email ID:', data?.id);

		return json({
			success: true,
			message: 'Order receipt sent successfully',
			to: to,
			messageId: data?.id
		});
	} catch (error) {
		console.error('❌ Email endpoint error:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to send email'
		});
	}
};

// ... KEEP ALL YOUR EXISTING generateOrderReceiptEmail, generateTextVersion,
// and getPaymentMethodDisplay functions EXACTLY AS THEY WERE ...
function getPaymentMethodDisplay(method: string): string {
	if (!method) return 'N/A';

	const methodMap: { [key: string]: string } = {
		GCASH: 'GCash',
		PAYMAYA: 'Maya',
		MAYA: 'Maya',
		BDO: 'BDO Virtual Account',
		BPI: 'BPI Virtual Account',
		RCBC: 'RCBC Virtual Account',
		UNIONBANK: 'UnionBank Virtual Account',
		CREDIT_CARD: 'Credit Card',
		DEBIT_CARD: 'Debit Card',
		EWALLET: 'E-Wallet',
		VIRTUAL_ACCOUNT: 'Bank Transfer',
		BANK_TRANSFER: 'Bank Transfer'
	};

	return methodMap[method.toUpperCase()] || method;
}

function generateOrderReceiptEmail(orderData: OrderData, customerName: string): string {
	const deliveryDays = Math.floor(Math.random() * 5) + 3;
	const estimatedDelivery = new Date();
	estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

	const items = orderData.items || [];
	const totalAmount =
		orderData.amount ||
		orderData.totalAmount ||
		items.reduce((sum: number, item: OrderItem) => sum + item.price * item.quantity, 0);

	const paymentMethodDisplay = getPaymentMethodDisplay(orderData.paymentMethod || '');

	const itemsHtml = items
		.map(
			(item: OrderItem) => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                <strong>${item.name}</strong><br>
                <small>Quantity: ${item.quantity} × ₱${item.price.toLocaleString()}</small>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
                ₱${(item.price * item.quantity).toLocaleString()}
            </td>
        </tr>
    `
		)
		.join('');

	return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .order-info { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .delivery-info { background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .payment-info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }
            .footer { text-align: center; padding: 20px; color: #666; margin-top: 20px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .info-label { font-weight: 600; color: #555; }
            .info-value { font-weight: 500; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 Order Confirmed!</h1>
            <p>Thank you for your purchase!</p>
        </div>
        
        <div class="content">
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Your order has been successfully processed and is being prepared for shipment.</p>
            
            <div class="order-info">
                <h3>📦 Order Details</h3>
                <div class="info-row">
                    <span class="info-label">Order ID:</span>
                    <span class="info-value">${orderData.orderId || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Order Date:</span>
                    <span class="info-value">${new Date().toLocaleDateString()}</span>
                </div>
                
                <h4 style="margin-top: 20px;">🛍️ Items Ordered:</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    ${itemsHtml}
                </table>
                
                <div style="text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; color: #4F46E5;">
                    Total: ₱${totalAmount.toLocaleString()}
                </div>
            </div>

            <div class="payment-info">
                <h3>💳 Payment Information</h3>
                <div class="info-row">
                    <span class="info-label">Payment Method: </span>
                    <span class="info-value" style="font-weight: bold; color: #2196f3;">
                        ${paymentMethodDisplay}
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Amount Paid:</span>
                    <span class="info-value" style="font-weight: bold; color: #4caf50;">
                        ₱${totalAmount.toLocaleString()}
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Payment Status: </span>
                    <span class="info-value" style="font-weight: bold; color: #4caf50;">
                        ✅ Paid
                    </span>
                </div>
            </div>

            <div class="delivery-info">
                <h3>🚚 Delivery Information</h3>
                <div class="info-row">
                    <span class="info-label">Estimated Delivery: </span>
                    <span class="info-value">${estimatedDelivery.toLocaleDateString()}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Delivery Time:</span>
                    <span class="info-value">${deliveryDays} business days</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Shipping Address:</span>
                    <span class="info-value">${orderData.customer?.address || 'N/A'}</span>
                </div>
            </div>

            <p>We'll notify you when your order ships!</p>
            <p>Best regards,<br><strong>Laveona</strong></p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Laveona</p>
        </div>
    </body>
    </html>
    `;
}

function generateTextVersion(orderData: OrderData, customerName: string): string {
	const deliveryDays = Math.floor(Math.random() * 5) + 3;
	const estimatedDelivery = new Date();
	estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

	const items = orderData.items || [];
	const totalAmount =
		orderData.amount ||
		orderData.totalAmount ||
		items.reduce((sum: number, item: OrderItem) => sum + item.price * item.quantity, 0);

	const paymentMethodDisplay = getPaymentMethodDisplay(orderData.paymentMethod || '');

	let text = `ORDER CONFIRMATION\n\n`;
	text += `Hi ${customerName},\n\n`;
	text += `Thank you for your order!\n\n`;

	text += `ORDER DETAILS:\n`;
	text += `Order ID: ${orderData.orderId || 'N/A'}\n`;
	text += `Order Date: ${new Date().toLocaleDateString()}\n\n`;

	text += `PAYMENT INFORMATION:\n`;
	text += `Payment Method: ${paymentMethodDisplay}\n`;
	text += `Amount Paid: ₱${totalAmount.toLocaleString()}\n`;
	text += `Payment Status: ✅ Paid\n\n`;

	text += `ITEMS:\n`;
	items.forEach((item: OrderItem) => {
		text += `- ${item.name} (${item.quantity}x ₱${item.price}) = ₱${(item.price * item.quantity).toLocaleString()}\n`;
	});

	text += `\nTOTAL: ₱${totalAmount.toLocaleString()}\n\n`;
	text += `DELIVERY INFORMATION:\n`;
	text += `Estimated Delivery: ${estimatedDelivery.toLocaleDateString()} (${deliveryDays} days)\n`;
	text += `Shipping Address: ${orderData.customer?.address || 'N/A'}\n\n`;
	text += `We'll notify you when your order ships!\n\n`;
	text += `Best regards,\nLaveona`;

	return text;
}
