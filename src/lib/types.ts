export interface User {
	id: string;
	email: string;
	full_name: string;
	role: 'user' | 'admin';
	age: number;
	address: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}
