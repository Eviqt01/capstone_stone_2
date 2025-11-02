<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';

	const gotoForgotPassword = () => {
		goto('/forgot-password');
	};

	let email = '';
	let password = '';
	let rememberMe = false;
	let error = '';
	let loading = false;

	async function handleLogin() {
		loading = true;
		error = '';

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					password,
					rememberMe
				})
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error;
				return;
			}

			if (data.user.role === 'admin') {
				goto('/Dashboard');
			} else {
				goto('/User/Shop');
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			console.error('Login error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<section class="flex min-h-screen items-center justify-center px-4 sm:px-0">
	<form
		class="flex w-full max-w-sm flex-col flex-wrap gap-3 rounded-md border p-6 shadow-xl sm:w-110 sm:max-w-110 sm:gap-5 sm:p-10"
		on:submit|preventDefault={handleLogin}
	>
		<h1 class="text-center text-xl font-bold sm:text-2xl">Sign in to your account</h1>
		<div class="flex flex-col flex-wrap gap-2">
			<Label>Email Address</Label>
			<Input
				bind:value={email}
				type="email"
				name="email"
				class="p-3 sm:p-5"
				placeholder="Enter your email"
				required
			/>
		</div>
		<div class="flex flex-col flex-wrap gap-2">
			<Label>Password</Label>
			<Input
				type="password"
				bind:value={password}
				name="password"
				class="p-3 sm:p-5"
				placeholder="Enter your password"
				required
			/>
		</div>
		<div class="flex items-center justify-center">
			<div class="mr-auto flex items-center gap-1">
				<Checkbox></Checkbox>
				<Label class="text-sm sm:text-base">Remember Me</Label>
			</div>
			<Label
				class="cursor-pointer border border-transparent text-sm text-blue-500 hover:border-b-blue-500 active:scale-95 sm:text-base"
				onclick={gotoForgotPassword}>Forgot Password</Label
			>
		</div>
		<Button
			class="cursor-pointer bg-blue-700 text-base hover:bg-blue-800 active:scale-95 sm:text-lg"
			type="submit"
			disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button
		>
		<div class="flex flex-col gap-3">
			<div class="flex items-center">
				<div class="flex-grow border-t border-gray-300"></div>
				<span class="mx-1 text-sm sm:text-base">Or</span>
				<div class="flex-grow border-t border-gray-300"></div>
			</div>
			<div class="flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-2">
				<span class="text-sm sm:text-base">Don't have an account? </span>
				<Label
					class="cursor-pointer border border-transparent text-sm text-blue-500 hover:border-b-blue-500 active:scale-95 sm:text-base"
					onclick={() => goto('/Signup')}>Sign up here</Label
				>
			</div>
			{#if error}
				<p class="text-center text-red-500">{error}</p>
			{/if}
		</div>
	</form>
</section>
