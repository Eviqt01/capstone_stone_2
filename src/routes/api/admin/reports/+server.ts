import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const page = parseInt(url.searchParams.get('page') || '1');
		const status = url.searchParams.get('status') || '';
		const priority = url.searchParams.get('priority') || '';
		const search = url.searchParams.get('search') || '';
		const limit = 10;
		const skip = (page - 1) * limit;

		let query = supabase.from('customer_reports').select('*', { count: 'exact' });

		if (status) {
			query = query.eq('status', status);
		}
		if (priority) {
			query = query.eq('priority', priority);
		}
		if (search) {
			query = query.or(
				`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,report_number.ilike.%${search}%`
			);
		}

		query = query.order('created_at', { ascending: false }).range(skip, skip + limit - 1);

		const { data: reports, count, error } = await query;

		if (error) throw error;

		return json({
			reports: reports || [],
			pagination: {
				page,
				totalPages: Math.ceil((count || 0) / limit),
				total: count || 0
			}
		});
	} catch (error) {
		console.error('Reports fetch error:', error);
		return json({ error: 'Failed to fetch reports' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const { reportId, admin_response, status } = await request.json();

		if (!reportId) {
			return json({ error: 'Report ID is required' }, { status: 400 });
		}

		const updateData: any = {
			updated_at: new Date().toISOString()
		};

		if (admin_response !== undefined) {
			updateData.admin_response = admin_response;
			updateData.responded_at = new Date().toISOString();
		}
		if (status) {
			updateData.status = status;
		}

		const { data: report, error } = await supabase
			.from('customer_reports')
			.update(updateData)
			.eq('id', reportId)
			.select()
			.single();

		if (error) throw error;

		return json({
			success: true,
			report
		});
	} catch (error) {
		console.error('Report update error:', error);
		return json({ error: 'Failed to update report' }, { status: 500 });
	}
};
