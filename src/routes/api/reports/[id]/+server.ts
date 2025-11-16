import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const reportId = params.id;

		const { error } = await supabase.from('customer_reports').delete().eq('id', reportId);

		if (error) {
			console.error('Error deleting report:', error);
			return json(
				{
					success: false,
					error: 'Failed to delete report from database'
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Report deleted successfully'
		});
	} catch (error) {
		console.error('Error in delete report API:', error);
		return json(
			{
				success: false,
				error: 'Internal server error'
			},
			{ status: 500 }
		);
	}
};
