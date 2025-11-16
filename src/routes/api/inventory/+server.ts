import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

// Activity recording function
async function recordActivity(message: string, type: string = 'product', color: string = 'green') {
	try {
		const activity = {
			message,
			type,
			color,
			created_at: new Date().toISOString()
		};

		const { error } = await supabase.from('activities').insert([activity]);

		if (error) {
			console.error('Failed to record activity:', error);
		} else {
			console.log('✅ Activity recorded:', message);
		}
	} catch (error) {
		console.error('Activity recording error:', error);
	}
}

export const POST: RequestHandler = async ({ request }) => {
	console.log('🔄 Add product API called');

	try {
		const productData = await request.json();
		console.log('📦 Received product data:', productData);

		// Validate required fields
		if (
			!productData.name ||
			!productData.price ||
			!productData.category ||
			!productData.stock ||
			!productData.image
		) {
			return json(
				{
					success: false,
					error: 'All fields are required: name, price, category, stock, and image'
				},
				{ status: 400 }
			);
		}

		// Generate a unique product ID
		const productId = generateProductId();
		const now = new Date().toISOString();

		const productWithId = {
			id: productId,
			name: productData.name,
			price: parseFloat(productData.price),
			category: productData.category,
			stock: parseInt(productData.stock),
			image: productData.image,
			created_at: now,
			updated_at: now
		};

		console.log('💾 Inserting into database with ID:', productId);

		const { data: product, error } = await supabase
			.from('products')
			.insert([productWithId])
			.select()
			.single();

		if (error) {
			console.error('❌ Database error:', error);
			return json(
				{
					success: false,
					error: `Database error: ${error.message}`
				},
				{ status: 500 }
			);
		}

		console.log('✅ Product added successfully:', product);

		// Record activity
		await recordActivity(`New product added: ${productData.name}`, 'product', 'green');

		return json({
			success: true,
			product
		});
	} catch (error) {
		console.error('💥 Add product error:', error);
		return json(
			{
				success: false,
				error: 'Server error: ' + (error instanceof Error ? error.message : 'Unknown error')
			},
			{ status: 500 }
		);
	}
};

function generateProductId(): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substr(2, 9);
	return `prod_${timestamp}_${random}`;
}
