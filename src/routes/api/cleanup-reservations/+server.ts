import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
	try {
		const result = await cleanupExpiredReservations();
		return json({
			success: true,
			message: `Cleaned up ${result.cleanedCount} expired reservations`
		});
	} catch (error) {
		console.error('Cleanup error:', error);
		return json({ success: false, error: 'Cleanup failed' }, { status: 500 });
	}
};

async function cleanupExpiredReservations() {
	try {
		const { data: expiredReservations, error } = await supabase
			.from('stock_reservations')
			.select('reservation_id, product_id, quantity')
			.eq('status', 'reserved')
			.lt('expires_at', new Date().toISOString());

		if (error) throw error;

		let cleanedCount = 0;
		for (const reservation of expiredReservations || []) {
			await releaseReservedStock(reservation.reservation_id);
			cleanedCount++;
		}

		console.log(`Cleaned up ${cleanedCount} expired reservations`);
		return { cleanedCount };
	} catch (error) {
		console.error('Cleanup error:', error);
		throw error;
	}
}

async function releaseReservedStock(reservationId: string): Promise<void> {
	try {
		const { data: reservations, error } = await supabase
			.from('stock_reservations')
			.select('product_id, quantity')
			.eq('reservation_id', reservationId)
			.eq('status', 'reserved');

		if (error) throw error;

		for (const reservation of reservations || []) {
			await supabase.rpc('increment_stock', {
				product_id: reservation.product_id,
				quantity: reservation.quantity
			});
		}

		await supabase
			.from('stock_reservations')
			.update({ status: 'released' })
			.eq('reservation_id', reservationId);
	} catch (error) {
		console.error('Error releasing reserved stock:', error);
	}
}
