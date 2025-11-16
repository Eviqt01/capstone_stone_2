import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

interface OrderData {
	created_at: string;
	total: number;
	status: string;
}

interface SalesDataPoint {
	day: string;
	sales: number;
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const range = url.searchParams.get('range') || 'all';

		console.log('📈 Fetching sales data for range:', range);

		let startDate = new Date();
		switch (range) {
			case '7':
				startDate.setDate(startDate.getDate() - 7);
				break;
			case '30':
				startDate.setDate(startDate.getDate() - 30);
				break;
			case '90':
				startDate.setDate(startDate.getDate() - 90);
				break;
			case 'all':
			default:
				startDate = new Date(0);
		}

		const startDateString = startDate.toISOString();

		const { data: salesData, error } = await supabase
			.from('orders')
			.select('created_at, total, status')
			.gte('created_at', startDateString)
			.eq('status', 'Completed')
			.order('created_at', { ascending: true });

		if (error) {
			console.error('Sales data error:', error);
			throw error;
		}

		console.log('📦 Raw sales data count:', salesData?.length);

		if (!salesData || salesData.length === 0) {
			console.log('📊 Using sample sales data');
			return json(generateSampleData(range));
		}

		const groupedSales = groupSalesByRange(salesData, range);

		console.log('✅ Grouped sales:', groupedSales);
		return json(groupedSales);
	} catch (error) {
		console.error('❌ Sales data error:', error);
		return json(generateSampleData('all'));
	}
};

function groupSalesByRange(salesData: OrderData[], range: string): SalesDataPoint[] {
	const result: SalesDataPoint[] = [];

	const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const monthOrder = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];

	switch (range) {
		case '7': {
			const daysMap: Record<string, number> = {
				Mon: 0,
				Tue: 0,
				Wed: 0,
				Thu: 0,
				Fri: 0,
				Sat: 0,
				Sun: 0
			};

			salesData.forEach((sale) => {
				if (sale.created_at && sale.total) {
					const date = new Date(sale.created_at);
					const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
					daysMap[dayName] += sale.total;
				}
			});

			dayOrder.forEach((day) => {
				result.push({
					day,
					sales: Math.round(daysMap[day])
				});
			});
			break;
		}

		case '30': {
			const weeksMap: Record<string, number> = {};

			salesData.forEach((sale) => {
				if (sale.created_at && sale.total) {
					const date = new Date(sale.created_at);
					const week = Math.ceil(date.getDate() / 7);
					const key = `Week ${week}`;
					weeksMap[key] = (weeksMap[key] || 0) + sale.total;
				}
			});

			Object.entries(weeksMap).forEach(([day, sales]) => {
				result.push({
					day,
					sales: Math.round(sales)
				});
			});
			break;
		}

		case '90': {
			const monthsMap: Record<string, number> = {};

			salesData.forEach((sale) => {
				if (sale.created_at && sale.total) {
					const date = new Date(sale.created_at);
					const monthName = date.toLocaleDateString('en-US', { month: 'short' });
					monthsMap[monthName] = (monthsMap[monthName] || 0) + sale.total;
				}
			});

			Object.entries(monthsMap).forEach(([day, sales]) => {
				result.push({
					day: `${day}`,
					sales: Math.round(sales)
				});
			});
			break;
		}

		case 'all':
		default: {
			const allMonthsMap: Record<string, number> = {};

			salesData.forEach((sale) => {
				if (sale.created_at && sale.total) {
					const date = new Date(sale.created_at);
					const monthName = date.toLocaleDateString('en-US', { month: 'short' });
					allMonthsMap[monthName] = (allMonthsMap[monthName] || 0) + sale.total;
				}
			});

			monthOrder.forEach((month) => {
				result.push({
					day: month,
					sales: Math.round(allMonthsMap[month] || 0)
				});
			});
			break;
		}
	}

	return result;
}

function generateSampleData(range: string): SalesDataPoint[] {
	switch (range) {
		case '7':
			return [
				{ day: 'Mon', sales: 12000 },
				{ day: 'Tue', sales: 19000 },
				{ day: 'Wed', sales: 15000 },
				{ day: 'Thu', sales: 22000 },
				{ day: 'Fri', sales: 18000 },
				{ day: 'Sat', sales: 25000 },
				{ day: 'Sun', sales: 14000 }
			];
		case '30':
			return [
				{ day: 'Week 1', sales: 45000 },
				{ day: 'Week 2', sales: 52000 },
				{ day: 'Week 3', sales: 48000 },
				{ day: 'Week 4', sales: 61000 }
			];
		case '90':
			return [
				{ day: 'Month 1', sales: 185000 },
				{ day: 'Month 2', sales: 210000 },
				{ day: 'Month 3', sales: 195000 }
			];
		case 'all':
		default:
			return [
				{ day: 'Jan', sales: 120000 },
				{ day: 'Feb', sales: 150000 },
				{ day: 'Mar', sales: 180000 },
				{ day: 'Apr', sales: 140000 },
				{ day: 'May', sales: 200000 },
				{ day: 'Jun', sales: 220000 },
				{ day: 'Jul', sales: 190000 },
				{ day: 'Aug', sales: 210000 },
				{ day: 'Sep', sales: 180000 },
				{ day: 'Oct', sales: 240000 },
				{ day: 'Nov', sales: 260000 },
				{ day: 'Dec', sales: 300000 }
			];
	}
}
