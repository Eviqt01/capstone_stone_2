import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
	try {
		console.log('📊 Fetching dashboard stats...');

		const { count: totalUsers, error: usersError } = await supabase
			.from('users')
			.select('*', { count: 'exact', head: true });

		if (usersError) {
			console.error('Users error:', usersError);
			throw usersError;
		}

		const { count: totalProducts, error: productsError } = await supabase
			.from('products')
			.select('*', { count: 'exact', head: true });

		if (productsError) {
			console.error('Products error:', productsError);
			throw productsError;
		}

		const { data: ordersData, error: ordersError } = await supabase
			.from('orders')
			.select('total, status');

		if (ordersError) {
			console.error('Orders error:', ordersError);
			throw ordersError;
		}

		const totalOrders = ordersData?.length || 0;

		const totalRevenue =
			ordersData
				?.filter((order) => order.status?.toLowerCase() === 'completed')
				.reduce((sum: number, order) => sum + (order.total || 0), 0) || 0;

		console.log('✅ Stats loaded:', {
			users: totalUsers,
			products: totalProducts,
			orders: totalOrders,
			revenue: totalRevenue
		});

		return json({
			totalUsers: totalUsers || 0,
			totalOrders,
			totalRevenue,
			totalProducts: totalProducts || 0
		});
	} catch (error) {
		console.error('❌ Stats error:', error);

		return json({
			totalUsers: 0,
			totalOrders: 0,
			totalRevenue: 0,
			totalProducts: 0
		});
	}
};
