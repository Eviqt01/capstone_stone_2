import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
	try {
		const { data: products, error } = await supabase
			.from('products')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Products error:', error);
			return json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
		}

		return json({
			success: true,
			products:
				products?.map((p) => ({
					id: p.id,
					name: p.name,
					price: p.price,
					image: p.image,
					category: p.category,
					stock: p.stock
				})) || []
		});
	} catch (error) {
		console.error('Products error:', error);
		return json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
	}
};
