import type { Cookies } from '@sveltejs/kit';

export interface LoadContext {
	cookies: Cookies;
	url: URL;
}

export interface UserData {
	email: string;
	role: string;
	id: string;
}
