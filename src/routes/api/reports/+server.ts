import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const status = url.searchParams.get('status');
		const priority = url.searchParams.get('priority');

		console.log('GET /api/reports called with filters:', { status, priority });

		let query = supabase
			.from('customer_reports')
			.select('*')
			.order('created_at', { ascending: false });

		if (status && status !== 'All Status') {
			query = query.eq('status', status);
		}

		if (priority && priority !== 'All Priority') {
			query = query.eq('priority', priority);
		}

		const { data: reports, error } = await query;

		if (error) {
			console.error('Database error fetching reports:', error);
			return json({ error: 'Failed to fetch reports: ' + error.message }, { status: 500 });
		}

		console.log('Successfully fetched reports:', reports?.length || 0);

		const allReports = reports || [];
		const stats = {
			total: allReports.length,
			new: allReports.filter((r) => r.status === 'New').length,
			inProgress: allReports.filter((r) => r.status === 'In Progress').length,
			resolved: allReports.filter((r) => r.status === 'Resolved').length
		};

		return json({
			success: true,
			reports: allReports,
			stats
		});
	} catch (err) {
		console.error('GET reports error:', err);
		return json(
			{
				error: err instanceof Error ? err.message : 'Server error'
			},
			{ status: 500 }
		);
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body.id || !body.status) {
			return json({ error: 'Report ID and status are required' }, { status: 400 });
		}

		const { data, error } = await supabase
			.from('customer_reports')
			.update({ status: body.status })
			.eq('id', body.id)
			.select()
			.single();

		if (error) {
			console.error('Error updating report:', error);
			return json({ error: 'Failed to update report' }, { status: 500 });
		}

		return json({ success: true, report: data });
	} catch (err) {
		console.error('Update report error:', err);
		return json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
	}
};
