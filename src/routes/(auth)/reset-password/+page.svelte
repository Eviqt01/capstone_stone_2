<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	$: token = $page.url.searchParams.get('token') || '';

	let newPassword = '';
	let confirmPassword = '';
	let error = '';
	let success = '';
	let loading = false;

	async function handleResetPassword() {
		if (!newPassword || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (newPassword.length < 6) {
			error = 'Password must be at least 6 characters long';
			return;
		}

		if (!token) {
			error = 'Invalid reset link. Please request a new one.';
			return;
		}

		loading = true;
		error = '';
		success = '';

		try {
			const res = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					token,
					newPassword
				})
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error;
				return;
			}

			success = data.message;

			setTimeout(() => {
				goto('/login');
			}, 2000);
		} catch (err) {
			error = 'An error occurred. Please try again.';
			console.error('Reset password error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<section class="flex min-h-screen items-center justify-center px-4 sm:px-0">
	<form
		on:submit|preventDefault={handleResetPassword}
		class="flex w-full max-w-sm flex-col gap-4 rounded-md border p-6 shadow-xl sm:w-110 sm:max-w-110 sm:gap-5 sm:p-10"
	>
		<div class="flex flex-col items-center gap-2">
			<h1 class="text-center text-xl font-bold sm:text-2xl">Reset Your Password</h1>
			<p class="text-center text-sm text-gray-600 sm:text-base">Enter your new password below</p>
		</div>

		{#if error}
			<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="rounded-md bg-green-50 p-3 text-sm text-green-600">
				{success}
				<p class="mt-1 text-xs">Redirecting to login...</p>
			</div>
		{/if}

		{#if !token}
			<div class="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
				Invalid reset link. Please request a new password reset.
			</div>
		{/if}

		<div class="flex flex-col gap-2">
			<Label>New Password</Label>
			<Input
				type="password"
				name="newPassword"
				bind:value={newPassword}
				class="p-3 sm:p-5"
				placeholder="Enter new password"
				disabled={!token}
				required
			/>
		</div>

		<div class="flex flex-col gap-2">
			<Label>Confirm New Password</Label>
			<Input
				type="password"
				name="confirmPassword"
				bind:value={confirmPassword}
				class="p-3 sm:p-5"
				placeholder="Confirm new password"
				disabled={!token}
				required
			/>
		</div>

		<Button
			class="cursor-pointer bg-blue-700 text-base hover:bg-blue-800 active:scale-95 sm:text-lg"
			type="submit"
			disabled={loading || !token || success !== ''}
		>
			{loading ? 'Resetting...' : 'Reset Password'}
		</Button>

		<div class="flex flex-col gap-3">
			<div class="flex items-center">
				<div class="flex-grow border-t border-gray-300"></div>
				<span class="mx-1 text-sm sm:text-base">Or</span>
				<div class="flex-grow border-t border-gray-300"></div>
			</div>
			<div class="flex flex-col items-center justify-center gap-1 text-sm sm:flex-row sm:gap-2">
				<span>Remember your password?</span>
				<Label
					class="cursor-pointer border border-transparent text-blue-500 hover:border-b-blue-500 active:scale-95"
					onclick={() => goto('/login')}>Back to Login</Label
				>
			</div>
		</div>
	</form>
</section>
