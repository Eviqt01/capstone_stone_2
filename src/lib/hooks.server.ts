import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const authGuard: Handle = async ({ event, resolve }) => {
	const publicRoutes = [
		'/',
		'/login',
		'/Signup',
		'/forgot-password',
		'/reset-password',
		'/api/auth/login',
		'/api/auth/Signup',
		'/api/auth/user',
		'/api/auth/logout',
		'/api/products',
		'/api/create-payment',
		'/payment-success'
	];

	const isPublicRoute = publicRoutes.some(
		(route) => event.url.pathname === route || event.url.pathname.startsWith(route + '/')
	);

	const userEmail = event.cookies.get('userEmail');
	const userId = event.cookies.get('userId');
	const isAuthenticated = !!(userEmail && userId);
	const userRole = event.cookies.get('userRole') || 'user';

	if (!isPublicRoute && !isAuthenticated) {
		console.log('🔒 Auth guard: Redirecting to login from', event.url.pathname);
		throw redirect(302, `/login?redirectTo=${encodeURIComponent(event.url.pathname)}`);
	}

	const adminRoutes = ['/Dashboard', '/Inventory', '/Reports'];

	const isAdminRoute = adminRoutes.some(
		(route) => event.url.pathname === route || event.url.pathname.startsWith(route + '/')
	);

	if (isAdminRoute && isAuthenticated && userRole !== 'admin') {
		console.log('🚫 Admin access denied for user:', userEmail);
		throw redirect(302, '/User/Shop');
	}

	const userRoutes = ['/User/Shop', '/User/Report'];

	const isUserRoute = userRoutes.some(
		(route) => event.url.pathname === route || event.url.pathname.startsWith(route + '/')
	);

	if (isUserRoute && !isAuthenticated) {
		throw redirect(302, `/login?redirectTo=${encodeURIComponent(event.url.pathname)}`);
	}

	if ((event.url.pathname === '/login' || event.url.pathname === '/signup') && isAuthenticated) {
		if (userRole === 'admin') {
			throw redirect(302, '/Dashboard');
		} else {
			throw redirect(302, '/User/Shop');
		}
	}

	return resolve(event);
};

export const handle = sequence(authGuard);
