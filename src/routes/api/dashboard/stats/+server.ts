import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
	try {
		// Get all stats in parallel
		const [
			{ count: totalUsers },
			{ count: totalOrders },
			{ data: revenueData },
			{ count: totalProducts },
			{ count: totalDeletedOrders }
		] = await Promise.all([
			supabase.from('users').select('*', { count: 'exact', head: true }),
			supabase.from('orders').select('*', { count: 'exact', head: true }).is('deleted_at', null),
			supabase.from('orders').select('total').eq('status', 'Completed').is('deleted_at', null),
			supabase.from('products').select('*', { count: 'exact', head: true }),
			supabase
				.from('orders')
				.select('*', { count: 'exact', head: true })
				.not('deleted_at', 'is', null)
		]);

		// Calculate total revenue from completed orders
		const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

		return json({
			totalUsers: totalUsers || 0,
			totalOrders: totalOrders || 0,
			totalRevenue,
			totalProducts: totalProducts || 0,
			totalDeletedOrders: totalDeletedOrders || 0
		});
	} catch (error) {
		console.error('Stats error:', error);
		return json({
			totalUsers: 0,
			totalOrders: 0,
			totalRevenue: 0,
			totalProducts: 0,
			totalDeletedOrders: 0
		});
	}
};
