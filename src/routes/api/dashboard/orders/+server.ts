import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '5');

		const { data: orders, error } = await supabase
			.from('orders')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(limit);

		if (error) throw error;

		const formattedOrders =
			orders?.map((order) => ({
				id: order.id.slice(0, 8) + '...',
				originalId: order.id,
				customer: order.customer_name,
				email: order.customer_email, // ✅ ADDED EMAIL FIELD
				address: order.customer_address,
				amount: order.total,
				status: order.status,
				statusColor: getStatusColor(order.status),
				date: new Date(order.created_at).toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				})
			})) || [];

		return json({
			data: formattedOrders,
			pagination: {
				page: 1,
				limit,
				hasMore: orders?.length === limit
			}
		});
	} catch (error) {
		console.error('Orders error:', error);
		return json({
			data: [],
			pagination: {}
		});
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	try {
		const { orderId, status } = await request.json();

		if (!orderId || !status) {
			return json({ error: 'Order ID and status are required' }, { status: 400 });
		}

		const { data, error } = await supabase
			.from('orders')
			.update({
				status: status,
				updated_at: new Date().toISOString()
			})
			.eq('id', orderId)
			.select();

		if (error) throw error;

		return json({
			success: true,
			message: 'Order status updated successfully',
			order: data[0]
		});
	} catch (error) {
		console.error('Update order error:', error);
		return json({ error: 'Failed to update order status' }, { status: 500 });
	}
};

function getStatusColor(status: string): string {
	const colors: { [key: string]: string } = {
		Pending: 'bg-yellow-100 text-yellow-800',
		Processing: 'bg-blue-100 text-blue-800',
		Completed: 'bg-green-100 text-green-800',
		Cancelled: 'bg-red-100 text-red-800',
		Shipped: 'bg-purple-100 text-purple-800'
	};
	return colors[status] || 'bg-gray-100 text-gray-800';
}

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { orderId } = await request.json();

		if (!orderId) {
			return json({ error: 'Order ID is required' }, { status: 400 });
		}

		const { error } = await supabase.from('orders').delete().eq('id', orderId);

		if (error) throw error;

		await supabase.from('activities').insert([
			{
				message: `Order ${orderId.slice(0, 8)}... was deleted`,
				type: 'order_deleted',
				color: 'red',
				created_at: new Date().toISOString()
			}
		]);

		return json({
			success: true,
			message: 'Order deleted successfully'
		});
	} catch (error) {
		console.error('Delete order error:', error);
		return json({ error: 'Failed to delete order' }, { status: 500 });
	}
};
