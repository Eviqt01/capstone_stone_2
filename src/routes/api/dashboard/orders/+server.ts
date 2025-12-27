import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

// GET orders with soft delete support

export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '5');
		const showDeleted = url.searchParams.get('showDeleted') === 'true';

		let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

		// Filter based on delete status
		if (showDeleted) {
			query = query.not('deleted_at', 'is', null);
		} else {
			query = query.is('deleted_at', null);
		}

		const { data: orders, error } = await query.limit(limit);

		if (error) throw error;

		console.log('Raw orders from DB:', orders); // Debug log

		const formattedOrders =
			orders?.map((order) => ({
				id: order.id.slice(0, 8) + '...',
				originalId: order.id,
				customer: order.customer_name,
				email: order.customer_email,
				phone: order.customer_phone,
				address: order.customer_address,
				comments: order.comments || '', // <-- This should work
				amount: order.total,
				status: order.status,
				statusColor: getStatusColor(order.status),
				date: new Date(order.created_at).toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				}),
				deleted_at: order.deleted_at
			})) || [];

		console.log('Formatted orders:', formattedOrders); // Debug log

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

// PUT - Update order status
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

		// Log activity
		await supabase.from('activities').insert([
			{
				message: `Order ${orderId.slice(0, 8)}... status updated to ${status}`,
				type: 'order_update',
				color: 'blue',
				created_at: new Date().toISOString()
			}
		]);

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

// DELETE - Soft delete order
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { orderId } = await request.json();

		if (!orderId) {
			return json({ error: 'Order ID is required' }, { status: 400 });
		}

		// Soft delete - set deleted_at timestamp
		const { error } = await supabase
			.from('orders')
			.update({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			})
			.eq('id', orderId);

		if (error) throw error;

		// Log activity
		await supabase.from('activities').insert([
			{
				message: `Order ${orderId.slice(0, 8)}... was moved to trash`,
				type: 'order_deleted',
				color: 'red',
				created_at: new Date().toISOString()
			}
		]);

		return json({
			success: true,
			message: 'Order moved to trash successfully'
		});
	} catch (error) {
		console.error('Delete order error:', error);
		return json({ error: 'Failed to delete order' }, { status: 500 });
	}
};

// POST - Restore soft deleted order
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { orderId } = await request.json();

		if (!orderId) {
			return json({ error: 'Order ID is required' }, { status: 400 });
		}

		// Restore - remove deleted_at timestamp
		const { data, error } = await supabase
			.from('orders')
			.update({
				deleted_at: null,
				updated_at: new Date().toISOString()
			})
			.eq('id', orderId)
			.select();

		if (error) throw error;

		// Log activity
		await supabase.from('activities').insert([
			{
				message: `Order ${orderId.slice(0, 8)}... was restored from trash`,
				type: 'order_restored',
				color: 'yellow',
				created_at: new Date().toISOString()
			}
		]);

		return json({
			success: true,
			message: 'Order restored successfully',
			order: data[0]
		});
	} catch (error) {
		console.error('Restore order error:', error);
		return json({ error: 'Failed to restore order' }, { status: 500 });
	}
};

function getStatusColor(status: string): string {
	const colors: { [key: string]: string } = {
		Pending: 'bg-yellow-100 text-yellow-800',
		Processing: 'bg-blue-100 text-blue-800',
		Completed: 'bg-green-100 text-green-800',
		Cancelled: 'bg-red-100 text-red-800',
		Shipped: 'bg-purple-100 text-purple-800',
		Failed: 'bg-gray-100 text-gray-800'
	};
	return colors[status] || 'bg-gray-100 text-gray-800';
}
