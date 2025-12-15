<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';

	let email = '';
	let error = '';
	let success = '';
	let loading = false;
	let resetLink = '';

	const gotoLoginPage = () => {
		goto('/login');
	};

	async function handleForgotPassword(event: Event) {
		event.preventDefault();

		if (!email) {
			error = 'Please enter your email address';
			return;
		}

		loading = true;
		error = '';
		success = '';
		resetLink = '';

		try {
			const res = await fetch('/api/auth/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
				credentials: 'include'
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error;
				return;
			}

			success = data.message;
			email = '';

			// For testing only - remove in production
			if (data.resetLink) {
				resetLink = data.resetLink;
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			console.error('Forgot password error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<section class="flex min-h-screen items-center justify-center px-4 sm:px-0">
	<form
		on:submit|preventDefault={handleForgotPassword}
		class="flex w-full max-w-sm flex-col flex-wrap gap-4 rounded-md border p-6 shadow-xl sm:w-110 sm:max-w-110 sm:gap-6 sm:p-10"
	>
		<div class="flex flex-col gap-2 text-center">
			<h1 class="text-lg font-bold sm:text-xl">Reset Password</h1>
			<span class="text-sm sm:text-base">Enter your email to receive reset password</span>
		</div>

		{#if error}
			<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="rounded-md bg-green-50 p-3 text-sm text-green-600">
				{success}
			</div>
		{/if}

		<div class="flex flex-col gap-1">
			<Label class="text-sm font-normal sm:text-base">Email Address</Label>
			<Input
				name="email"
				bind:value={email}
				class="p-3 sm:p-5"
				type="email"
				placeholder="Enter your email address"
				required
			/>
			<Button
				class="mt-3 cursor-pointer bg-violet-500 p-4 text-base hover:bg-violet-600 active:scale-95 sm:p-6 sm:text-lg"
				type="submit"
				disabled={loading}
			>
				{loading ? 'Sending...' : 'Send Reset Email'}
			</Button>
		</div>

		<div class="flex items-center">
			<div class="flex-grow border-t border-gray-300"></div>
			<span class="mx-1 text-sm sm:text-base">Or</span>
			<div class="flex-grow border-t border-gray-300"></div>
		</div>

		<div class="flex flex-col items-center gap-2 text-xs sm:gap-1 sm:text-sm">
			<div class="flex flex-col items-center gap-1 sm:flex-row">
				<span>Remember your password? </span>
				<Label
					class="cursor-pointer border border-transparent text-xs text-blue-500 hover:border-b-blue-500 active:scale-95 sm:text-base"
					onclick={gotoLoginPage}>Sign in here</Label
				>
			</div>
		</div>
	</form>
</section>
