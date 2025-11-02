// src/routes/api/reports/response/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body.id || body.response === undefined) {
			return json({ error: 'Report ID and response are required' }, { status: 400 });
		}

		console.log('Saving admin response for report:', body.id);

		const { data, error } = await supabase
			.from('customer_reports')
			.update({
				admin_response: body.response,
				updated_at: new Date().toISOString()
			})
			.eq('id', body.id)
			.select()
			.single();

		if (error) {
			console.error('Error saving response:', error);
			return json({ error: 'Failed to save response' }, { status: 500 });
		}

		console.log('Response saved successfully');

		return json({
			success: true,
			message: 'Response saved successfully',
			report: data
		});
	} catch (err) {
		console.error('Save response error:', err);
		return json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
	}
};
