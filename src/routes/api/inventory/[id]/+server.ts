import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

async function recordActivity(message: string, type: string = 'product', color: string = 'red') {
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

export const PATCH: RequestHandler = async ({ request, params }) => {
	try {
		const { id } = params;
		const updates = await request.json();

		console.log(`🔄 Updating product ${id}:`, updates);

		const { data: currentProduct } = await supabase
			.from('products')
			.select('name, stock')
			.eq('id', id)
			.single();

		const { data: product, error } = await supabase
			.from('products')
			.update({
				...updates,
				updated_at: new Date().toISOString()
			})
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;

		if (updates.stock !== undefined && currentProduct) {
			await recordActivity(
				`Stock updated for ${currentProduct.name}: ${updates.stock} units`,
				'product',
				'yellow'
			);
		}

		return json({ success: true, product });
	} catch (error) {
		console.error('Update product error:', error);
		return json({ success: false, error: 'Failed to update product' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		console.log(`🗑️ Deleting product ${id}`);

		const { data: product } = await supabase.from('products').select('name').eq('id', id).single();

		const { error } = await supabase.from('products').delete().eq('id', id);

		if (error) throw error;

		if (product) {
			await recordActivity(`Product deleted: ${product.name}`, 'product', 'red');
		}

		return json({ success: true });
	} catch (error) {
		console.error('Delete product error:', error);
		return json({ success: false, error: 'Failed to delete product' }, { status: 500 });
	}
};
