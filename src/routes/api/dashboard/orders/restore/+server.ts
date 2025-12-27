import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { orderId } = await request.json();

		if (!orderId) {
			return json({ error: 'Order ID is required' }, { status: 400 });
		}

		console.log('🔄 Restoring order:', orderId);

		// Restore - remove deleted_at timestamp
		const { data, error } = await supabase
			.from('orders')
			.update({
				deleted_at: null,
				updated_at: new Date().toISOString()
			})
			.eq('id', orderId)
			.select();

		if (error) {
			console.error('❌ Supabase error:', error);
			throw error;
		}

		if (!data || data.length === 0) {
			return json({ error: 'Order not found' }, { status: 404 });
		}

		// Log activity
		await supabase.from('activities').insert([
			{
				message: `Order ${orderId.slice(0, 8)}... was restored from trash`,
				type: 'order_restored',
				color: 'yellow',
				created_at: new Date().toISOString()
			}
		]);

		console.log('✅ Order restored successfully:', orderId);

		return json({
			success: true,
			message: 'Order restored successfully',
			order: data[0]
		});
	} catch (error) {
		console.error('💥 Restore order error:', error);
		return json(
			{
				error: 'Failed to restore order',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
