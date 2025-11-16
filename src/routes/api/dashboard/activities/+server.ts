import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
	try {
		const { data: activities, error } = await supabase
			.from('activities')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(10);

		if (error) throw error;

		const formattedActivities =
			activities?.map((activity) => ({
				message: activity.message,
				type: activity.type,
				color: activity.color,
				time: new Date(activity.created_at).toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})
			})) || [];

		return json(formattedActivities);
	} catch (error) {
		console.error('Activities error:', error);
		return json([]);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { message, type, color } = await request.json();

		const { data, error } = await supabase
			.from('activities')
			.insert([
				{
					message,
					type,
					color,
					created_at: new Date().toISOString()
				}
			])
			.select();

		if (error) throw error;

		return json({ success: true, activity: data[0] });
	} catch (error) {
		console.error('Create activity error:', error);
		return json({ error: 'Failed to create activity' }, { status: 500 });
	}
};
