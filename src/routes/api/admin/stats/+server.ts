import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
	try {
		const { count: totalReports, error: totalError } = await supabase
			.from('customer_reports')
			.select('*', { count: 'exact', head: true });

		const { data: statusData, error: statusError } = await supabase
			.from('customer_reports')
			.select('status');

		const { data: priorityData, error: priorityError } = await supabase
			.from('customer_reports')
			.select('priority');

		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const { count: newReports, error: newError } = await supabase
			.from('customer_reports')
			.select('*', { count: 'exact', head: true })
			.gte('created_at', sevenDaysAgo.toISOString());

		if (totalError || statusError || priorityError || newError) {
			console.error('Reports stats error:', { totalError, statusError, priorityError, newError });
		}

		const statusCounts = {
			New: statusData?.filter((r) => r.status === 'New').length || 0,
			'In Progress': statusData?.filter((r) => r.status === 'In Progress').length || 0,
			Resolved: statusData?.filter((r) => r.status === 'Resolved').length || 0,
			Closed: statusData?.filter((r) => r.status === 'Closed').length || 0
		};

		const priorityCounts = {
			Low: priorityData?.filter((r) => r.priority.includes('Low')).length || 0,
			Medium: priorityData?.filter((r) => r.priority.includes('Medium')).length || 0,
			High: priorityData?.filter((r) => r.priority.includes('High')).length || 0,
			Urgent: priorityData?.filter((r) => r.priority.includes('Urgent')).length || 0
		};

		return json({
			totalReports: totalReports || 0,
			newReportsThisWeek: newReports || 0,
			statusCounts,
			priorityCounts
		});
	} catch (error) {
		console.error('Reports stats error:', error);
		return json({
			totalReports: 0,
			newReportsThisWeek: 0,
			statusCounts: { New: 0, 'In Progress': 0, Resolved: 0, Closed: 0 },
			priorityCounts: { Low: 0, Medium: 0, High: 0, Urgent: 0 }
		});
	}
};
