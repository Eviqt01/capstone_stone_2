import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import ExcelJS from 'exceljs';

// Type Definitions
interface Filters {
	timeFilter?: string;
	status?: string;
}

interface Order {
	id: string;
	customer_name: string;
	customer_email: string;
	customer_phone: string | null;
	customer_address: string;
	comments: string | null;
	total: number;
	status: string;
	payment_method: string | null;
	created_at: string;
	deleted_at: string | null;
}

interface OrderItem {
	order_id: string;
	product_id: string;
	product_name: string;
	quantity: number;
	price: number;
}

interface Product {
	id: string;
	name: string;
	category: string;
	price: number;
	stock: number;
	description: string | null;
	image: string;
	created_at: string;
}

interface CustomerStats {
	name: string;
	email: string;
	phone: string;
	address: string;
	order_count: number;
	total_spent: number;
}

interface DateSales {
	sales: number;
	count: number;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const dataType: string = body.dataType;
		const filters: Filters = body.filters || {};

		console.log(`📊 Exporting ${dataType} data...`);

		const workbook = new ExcelJS.Workbook();
		workbook.creator = 'Laveona Hotel Supplies';
		workbook.lastModifiedBy = 'Admin Dashboard';
		workbook.created = new Date();
		workbook.modified = new Date();

		let fileName = '';

		switch (dataType) {
			case 'orders':
				await exportOrders(workbook, filters);
				fileName = `Orders_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
				break;

			case 'sales':
				await exportSales(workbook, filters);
				fileName = `Sales_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
				break;

			case 'products':
				await exportProducts(workbook);
				fileName = `Products_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
				break;

			case 'customers':
				await exportCustomers(workbook);
				fileName = `Customers_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
				break;

			default:
				return json({ error: 'Invalid data type' }, { status: 400 });
		}

		// Generate Excel buffer
		const buffer = await workbook.xlsx.writeBuffer();

		// Convert to base64 for response
		const base64 = Buffer.from(buffer).toString('base64');

		return json({
			success: true,
			fileName,
			data: base64,
			mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		});
	} catch (error) {
		console.error('💥 Export error:', error);
		return json(
			{
				error: 'Failed to export data',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

// Helper function to get start date from filter
function getStartDateFromFilter(filter: string): Date | null {
	const now = new Date();

	switch (filter) {
		case 'today':
			now.setHours(0, 0, 0, 0);
			return now;
		case 'yesterday':
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			yesterday.setHours(0, 0, 0, 0);
			return yesterday;
		case '7':
			now.setDate(now.getDate() - 7);
			return now;
		case '30':
			now.setDate(now.getDate() - 30);
			return now;
		case '90':
			now.setDate(now.getDate() - 90);
			return now;
		case 'this_month':
			return new Date(now.getFullYear(), now.getMonth(), 1);
		case 'last_month':
			return new Date(now.getFullYear(), now.getMonth() - 1, 1);
		case 'this_year':
			return new Date(now.getFullYear(), 0, 1);
		default:
			return null;
	}
}

// Export Orders Function
async function exportOrders(workbook: ExcelJS.Workbook, filters: Filters) {
	const worksheet = workbook.addWorksheet('Orders');

	// Define columns first
	worksheet.columns = [
		{ header: 'Order ID', key: 'id', width: 25 },
		{ header: 'Customer Name', key: 'customer_name', width: 25 },
		{ header: 'Customer Email', key: 'customer_email', width: 30 },
		{ header: 'Customer Phone', key: 'customer_phone', width: 20 },
		{ header: 'Customer Address', key: 'customer_address', width: 40 },
		{ header: 'Comments', key: 'comments', width: 40 },
		{ header: 'Total Amount', key: 'total', width: 15 },
		{ header: 'Status', key: 'status', width: 15 },
		{ header: 'Payment Method', key: 'payment_method', width: 20 },
		{ header: 'Created Date', key: 'created_at', width: 20 },
		{ header: 'Deleted Date', key: 'deleted_at', width: 20 }
	];

	// Apply filters to query
	let query = supabase
		.from('orders')
		.select(
			'id, customer_name, customer_email, customer_phone, customer_address, comments, total, status, payment_method, created_at, deleted_at'
		)
		.order('created_at', { ascending: false });

	// Apply time filter if provided
	if (filters.timeFilter && filters.timeFilter !== 'all') {
		const startDate = getStartDateFromFilter(filters.timeFilter);
		if (startDate) {
			query = query.gte('created_at', startDate.toISOString());
		}
	}

	// Apply status filter if provided
	if (filters.status && filters.status !== 'all') {
		query = query.eq('status', filters.status);
	}

	const { data: orders, error } = await query;

	if (error) throw error;

	// Add header row styling
	const headerRow = worksheet.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF2E5D9C' }
	};
	headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

	// Add data rows
	if (orders && orders.length > 0) {
		orders.forEach((order: Order, index: number) => {
			const row = worksheet.addRow({
				id: order.id,
				customer_name: order.customer_name,
				customer_email: order.customer_email,
				customer_phone: order.customer_phone || '',
				customer_address: order.customer_address,
				comments: order.comments || '',
				total: order.total,
				status: order.status,
				payment_method: order.payment_method || '',
				created_at: new Date(order.created_at).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				}),
				deleted_at: order.deleted_at ? new Date(order.deleted_at).toLocaleDateString('en-US') : ''
			});

			// Alternate row coloring
			if (index % 2 === 0) {
				row.eachCell((cell) => {
					cell.fill = {
						type: 'pattern',
						pattern: 'solid',
						fgColor: { argb: 'FFF0F8FF' }
					};
				});
			}
		});

		// Add summary row
		worksheet.addRow({}); // Empty row
		const totalAmount = orders.reduce((sum: number, order: Order) => sum + (order.total || 0), 0);

		const summaryRow = worksheet.addRow({
			customer_name: 'TOTAL:',
			total: totalAmount
		});

		summaryRow.font = { bold: true };
		summaryRow.eachCell((cell) => {
			cell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFE8F5E8' }
			};
		});
	} else {
		// Add "No data" message if no orders
		worksheet.addRow(['No orders found for the selected filters']);
	}

	// Try to add order items if available
	try {
		await addOrderItemsSheet(workbook, orders || []);
	} catch (error) {
		console.warn('Could not add order items sheet:', error);
	}
}

// Add Order Items Sheet
async function addOrderItemsSheet(workbook: ExcelJS.Workbook, orders: Order[]) {
	try {
		// First, get all order items
		const orderIds = orders.map((order) => order.id);

		if (orderIds.length === 0) return;

		const { data: orderItems, error } = await supabase
			.from('order_items')
			.select('*')
			.in('order_id', orderIds);

		if (error) {
			console.warn('Could not fetch order items:', error);
			return;
		}

		if (!orderItems || orderItems.length === 0) return;

		const worksheet = workbook.addWorksheet('Order Items');

		// Define columns
		worksheet.columns = [
			{ header: 'Order ID', key: 'order_id', width: 25 },
			{ header: 'Product Name', key: 'product_name', width: 30 },
			{ header: 'Quantity', key: 'quantity', width: 15 },
			{ header: 'Unit Price', key: 'price', width: 15 },
			{ header: 'Total Price', key: 'total_price', width: 15 }
		];

		// Add header row styling
		const headerRow = worksheet.getRow(1);
		headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
		headerRow.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FF4CAF50' }
		};
		headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

		// Add order items to sheet
		orderItems.forEach((item: OrderItem, index: number) => {
			const totalPrice = (item.quantity || 0) * (item.price || 0);
			const row = worksheet.addRow({
				order_id: item.order_id,
				product_name: item.product_name || 'Unknown Product',
				quantity: item.quantity || 0,
				price: item.price || 0,
				total_price: totalPrice
			});

			// Alternate row coloring
			if (index % 2 === 0) {
				row.eachCell((cell) => {
					cell.fill = {
						type: 'pattern',
						pattern: 'solid',
						fgColor: { argb: 'FFF1F8E9' }
					};
				});
			}
		});

		// Add summary
		const totalItems = orderItems.reduce(
			(sum: number, item: OrderItem) => sum + (item.quantity || 0),
			0
		);
		const totalRevenue = orderItems.reduce((sum: number, item: OrderItem) => {
			return sum + (item.quantity || 0) * (item.price || 0);
		}, 0);

		worksheet.addRow({}); // Empty row

		const totalItemsRow = worksheet.addRow({
			product_name: 'TOTAL ITEMS:',
			quantity: totalItems
		});

		const totalRevenueRow = worksheet.addRow({
			product_name: 'TOTAL REVENUE:',
			total_price: totalRevenue
		});

		[totalItemsRow, totalRevenueRow].forEach((row) => {
			row.font = { bold: true };
			row.eachCell((cell) => {
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'FFE8F5E8' }
				};
			});
		});
	} catch (error) {
		console.warn('Error creating order items sheet:', error);
	}
}

// Export Sales Function
async function exportSales(workbook: ExcelJS.Workbook, filters: Filters) {
	const worksheet = workbook.addWorksheet('Sales Report');

	// Define columns first
	worksheet.columns = [
		{ header: 'Date', key: 'date', width: 20 },
		{ header: 'Sales (₱)', key: 'sales', width: 20 },
		{ header: 'Order Count', key: 'order_count', width: 15 }
	];

	let query = supabase
		.from('orders')
		.select('id, total, created_at, status')
		.eq('status', 'Completed')
		.order('created_at', { ascending: true });

	// Apply time filter
	if (filters.timeFilter && filters.timeFilter !== 'all') {
		const startDate = getStartDateFromFilter(filters.timeFilter);
		if (startDate) {
			query = query.gte('created_at', startDate.toISOString());
		}
	}

	const { data: orders, error } = await query;
	if (error) throw error;

	// Group by date
	const salesByDate: Record<string, DateSales> = {};
	orders?.forEach((order: { created_at: string; total: number }) => {
		const date = new Date(order.created_at).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});

		if (!salesByDate[date]) {
			salesByDate[date] = { sales: 0, count: 0 };
		}

		salesByDate[date].sales += order.total || 0;
		salesByDate[date].count += 1;
	});

	// Add header row styling
	const headerRow = worksheet.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF9C27B0' }
	};
	headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

	// Add sales data
	const dates = Object.keys(salesByDate).sort();

	if (dates.length > 0) {
		dates.forEach((date, index) => {
			const row = worksheet.addRow({
				date,
				sales: salesByDate[date].sales,
				order_count: salesByDate[date].count
			});

			// Alternate row coloring
			if (index % 2 === 0) {
				row.eachCell((cell) => {
					cell.fill = {
						type: 'pattern',
						pattern: 'solid',
						fgColor: { argb: 'FFF3E5F5' }
					};
				});
			}
		});

		// Add summary
		const totalSales = dates.reduce(
			(sum: number, date: string) => sum + salesByDate[date].sales,
			0
		);
		const totalOrders = dates.reduce(
			(sum: number, date: string) => sum + salesByDate[date].count,
			0
		);

		worksheet.addRow({}); // Empty row

		const summaryRow = worksheet.addRow({
			date: 'TOTAL:',
			sales: totalSales,
			order_count: totalOrders
		});

		summaryRow.font = { bold: true };
		summaryRow.eachCell((cell) => {
			cell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFE8F5E8' }
			};
		});
	} else {
		worksheet.addRow(['No sales data found for the selected filters']);
	}
}

// Export Products Function
async function exportProducts(workbook: ExcelJS.Workbook) {
	const worksheet = workbook.addWorksheet('Products');

	// Define columns first
	worksheet.columns = [
		{ header: 'Product ID', key: 'id', width: 20 },
		{ header: 'Product Name', key: 'name', width: 30 },
		{ header: 'Category', key: 'category', width: 20 },
		{ header: 'Price (₱)', key: 'price', width: 15 },
		{ header: 'Stock', key: 'stock', width: 15 },
		{ header: 'Description', key: 'description', width: 40 },
		{ header: 'Image URL', key: 'image', width: 40 },
		{ header: 'Created Date', key: 'created_at', width: 20 }
	];

	const { data: products, error } = await supabase
		.from('products')
		.select('*')
		.order('name', { ascending: true });

	if (error) throw error;

	// Add header row styling
	const headerRow = worksheet.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFFF9800' }
	};
	headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

	// Add data
	if (products && products.length > 0) {
		products.forEach((product: Product, index: number) => {
			const row = worksheet.addRow({
				id: product.id,
				name: product.name,
				category: product.category,
				price: product.price,
				stock: product.stock,
				description: product.description || '',
				image: product.image,
				created_at: new Date(product.created_at).toLocaleDateString('en-US')
			});

			// Alternate row coloring
			if (index % 2 === 0) {
				row.eachCell((cell) => {
					cell.fill = {
						type: 'pattern',
						pattern: 'solid',
						fgColor: { argb: 'FFFFF3E0' }
					};
				});
			}

			// Highlight low stock
			if (product.stock < 10) {
				const stockCell = row.getCell('stock');
				stockCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'FFFFCDD2' }
				};
			}
		});

		// Add summary
		const totalProducts = products.length;
		const totalStock = products.reduce(
			(sum: number, product: Product) => sum + (product.stock || 0),
			0
		);
		const totalValue = products.reduce(
			(sum: number, product: Product) => sum + (product.price || 0) * (product.stock || 0),
			0
		);

		worksheet.addRow({}); // Empty row

		const summary1 = worksheet.addRow({
			name: 'TOTAL PRODUCTS:',
			stock: totalProducts
		});

		const summary2 = worksheet.addRow({
			name: 'TOTAL STOCK:',
			stock: totalStock
		});

		const summary3 = worksheet.addRow({
			name: 'TOTAL INVENTORY VALUE:',
			price: totalValue
		});

		[summary1, summary2, summary3].forEach((row) => {
			row.font = { bold: true };
			row.eachCell((cell) => {
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'FFE8F5E8' }
				};
			});
		});
	} else {
		worksheet.addRow(['No products found']);
	}
}

// Export Customers Function
async function exportCustomers(workbook: ExcelJS.Workbook) {
	const worksheet = workbook.addWorksheet('Customers');

	// Define columns first
	worksheet.columns = [
		{ header: 'Customer Name', key: 'name', width: 25 },
		{ header: 'Email', key: 'email', width: 30 },
		{ header: 'Phone', key: 'phone', width: 20 },
		{ header: 'Address', key: 'address', width: 40 },
		{ header: 'Order Count', key: 'order_count', width: 15 },
		{ header: 'Total Spent (₱)', key: 'total_spent', width: 20 },
		{ header: 'Average Order Value', key: 'avg_order_value', width: 20 }
	];

	// Get unique customers from orders
	const { data: orders, error } = await supabase
		.from('orders')
		.select('customer_name, customer_email, customer_phone, customer_address, total')
		.order('created_at', { ascending: false });

	if (error) throw error;

	// Get unique customers by email and calculate stats
	const customerMap = new Map<string, CustomerStats>();

	orders?.forEach(
		(order: {
			customer_name: string;
			customer_email: string;
			customer_phone: string;
			customer_address: string;
			total: number;
		}) => {
			if (!order.customer_email) return;

			if (!customerMap.has(order.customer_email)) {
				customerMap.set(order.customer_email, {
					name: order.customer_name || '',
					email: order.customer_email,
					phone: order.customer_phone || '',
					address: order.customer_address || '',
					order_count: 1,
					total_spent: order.total || 0
				});
			} else {
				const customer = customerMap.get(order.customer_email)!;
				customer.order_count += 1;
				customer.total_spent += order.total || 0;
			}
		}
	);

	const customersArray = Array.from(customerMap.values());

	// Add header row styling
	const headerRow = worksheet.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF2196F3' }
	};
	headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

	// Add data
	if (customersArray.length > 0) {
		customersArray.forEach((customer: CustomerStats, index: number) => {
			const avgOrderValue =
				customer.order_count > 0 ? customer.total_spent / customer.order_count : 0;

			const row = worksheet.addRow({
				name: customer.name,
				email: customer.email,
				phone: customer.phone,
				address: customer.address,
				order_count: customer.order_count,
				total_spent: customer.total_spent,
				avg_order_value: avgOrderValue.toFixed(2)
			});

			// Alternate row coloring
			if (index % 2 === 0) {
				row.eachCell((cell) => {
					cell.fill = {
						type: 'pattern',
						pattern: 'solid',
						fgColor: { argb: 'FFE3F2FD' }
					};
				});
			}
		});

		// Add summary
		const totalCustomers = customersArray.length;
		const totalOrders = customersArray.reduce(
			(sum: number, customer: CustomerStats) => sum + customer.order_count,
			0
		);
		const totalRevenue = customersArray.reduce(
			(sum: number, customer: CustomerStats) => sum + customer.total_spent,
			0
		);
		const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

		worksheet.addRow({}); // Empty row

		const summary1 = worksheet.addRow({
			name: 'TOTAL CUSTOMERS:',
			order_count: totalCustomers
		});

		const summary2 = worksheet.addRow({
			name: 'TOTAL ORDERS:',
			order_count: totalOrders
		});

		const summary3 = worksheet.addRow({
			name: 'TOTAL REVENUE:',
			total_spent: totalRevenue
		});

		const summary4 = worksheet.addRow({
			name: 'AVERAGE ORDER VALUE:',
			avg_order_value: avgOrderValue.toFixed(2)
		});

		[summary1, summary2, summary3, summary4].forEach((row) => {
			row.font = { bold: true };
			row.eachCell((cell) => {
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'FFE8F5E8' }
				};
			});
		});
	} else {
		worksheet.addRow(['No customer data found']);
	}
}
