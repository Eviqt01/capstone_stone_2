import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Validate required fields
		if (
			!body.customerName ||
			!body.customerEmail ||
			!body.issueCategory ||
			!body.priority ||
			!body.description
		) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		console.log('Submitting new report:', body);

		// Generate a report number
		const reportNumber = 'RPT-' + Date.now();

		// Insert into database
		const { data, error } = await supabase
			.from('customer_reports')
			.insert([
				{
					customer_name: body.customerName,
					customer_email: body.customerEmail,
					issue_category: body.issueCategory,
					priority: body.priority,
					order_number: body.orderNumber || null,
					description: body.description,
					home_address: body.homeAddress || null,
					report_number: reportNumber,
					status: 'New',
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}
			])
			.select()
			.single();

		if (error) {
			console.error('Database error creating report:', error);
			return json({ error: 'Failed to create report: ' + error.message }, { status: 500 });
		}

		console.log('Report created successfully:', data);

		return json({
			success: true,
			message: 'Report submitted successfully',
			report: data
		});
	} catch (err) {
		console.error('Submit report error:', err);
		return json(
			{
				error: err instanceof Error ? err.message : 'Server error'
			},
			{ status: 500 }
		);
	}
};
