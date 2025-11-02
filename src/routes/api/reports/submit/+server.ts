import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (
			!body.customerName ||
			!body.customerEmail ||
			!body.issueCategory ||
			!body.priority ||
			!body.description
		) {
			return json({ error: 'All required fields must be filled' }, { status: 400 });
		}

		const priorityLevel = body.priority.split(' - ')[0];

		const { count } = await supabase
			.from('customer_reports')
			.select('*', { count: 'exact', head: true });

		const reportNumber = `#${String((count || 0) + 12345).padStart(5, '0')}`;

		console.log('Creating report:', reportNumber);

		const { data: newReport, error } = await supabase
			.from('customer_reports')
			.insert({
				report_number: reportNumber,
				customer_name: body.customerName,
				customer_email: body.customerEmail,
				issue_category: body.issueCategory,
				priority: priorityLevel,
				order_number: body.orderNumber || null,
				description: body.description,
				status: 'New'
			})
			.select()
			.single();

		if (error) {
			console.error('Database error:', error);
			return json({ error: 'Failed to submit report: ' + error.message }, { status: 500 });
		}

		console.log('Report created:', newReport);

		return json(
			{
				success: true,
				message: 'Report submitted successfully',
				report: newReport
			},
			{ status: 201 }
		);
	} catch (err) {
		console.error('Submit error:', err);
		return json(
			{
				error: err instanceof Error ? err.message : 'Server error'
			},
			{ status: 500 }
		);
	}
};
