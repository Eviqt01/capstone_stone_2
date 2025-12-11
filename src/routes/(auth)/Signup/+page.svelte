<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Copyright from '@tabler/icons-svelte/icons/copyright';
	import { goto } from '$app/navigation';

	let formData = {
		email: '',
		password: '',
		confirmPassword: '',
		fullName: '',
		age: '',
		address: ''
	};
	let error = '';
	let loading = false;

	async function handleSignup() {
		if (formData.password !== formData.confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		loading = true;
		error = '';

		try {
			const res = await fetch('/api/auth/Signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: formData.email,
					password: formData.password,
					fullName: formData.fullName,
					age: parseInt(formData.age),
					address: formData.address
				})
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error;
				return;
			}

			goto('/login');
		} catch (err) {
			error = 'An error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<section class="flex min-h-screen flex-col items-center justify-center gap-3 px-4 sm:gap-5 sm:px-0">
	<form
		class="flex w-full max-w-sm flex-col gap-3 rounded-lg border p-6 text-center shadow-md sm:w-110 sm:max-w-110 sm:gap-5 sm:p-10"
		on:submit|preventDefault={handleSignup}
	>
		<div class="flex flex-col items-center">
			<h1 class="text-lg font-bold sm:text-xl">Create Account</h1>
			<span class="text-center text-sm sm:text-base">Sign up for a new account</span>
		</div>
		<div class="flex flex-col gap-2">
			<Label class="text-sm sm:text-base">Full Name</Label>
			<Input
				name="fullName"
				bind:value={formData.fullName}
				class="p-3 sm:p-5"
				type="text"
				placeholder="Enter your full name"
				required
			/>
		</div>
		<div class="flex flex-col gap-2">
			<Label class="text-sm sm:text-base">Email Address</Label>
			<Input
				name="email"
				bind:value={formData.email}
				class="p-3 sm:p-5"
				type="email"
				placeholder="Enter your Email Address"
				required
			/>
		</div>
		<div class="flex flex-col gap-2">
			<Label class="text-sm sm:text-base">Age</Label>
			<Input
				name="age"
				bind:value={formData.age}
				class="p-3 sm:p-5"
				type="number"
				placeholder="Enter your age"
				min="0"
				required
			/>
		</div>
		<div class="flex flex-col gap-2">
			<Label class="text-sm sm:text-base">Address</Label>
			<Input
				name="address"
				bind:value={formData.address}
				class="p-3 sm:p-5"
				type="text"
				placeholder="Enter your address"
				required
			/>
		</div>
		<div class="flex flex-col gap-2">
			<Label class="text-sm sm:text-base">Password</Label>
			<Input
				name="password"
				bind:value={formData.password}
				class="p-3 sm:p-5"
				type="password"
				placeholder="Enter your password"
				required
			/>
		</div>
		<div class="flex flex-col gap-2">
			<Label class="text-sm sm:text-base">Confirm Password</Label>
			<Input
				name="confirmPassword"
				bind:value={formData.confirmPassword}
				class="p-3 sm:p-5"
				type="password"
				placeholder="Confirm your password"
				required
			/>
		</div>
		<Button
			class="cursor-pointer bg-green-600 text-sm hover:bg-green-700 active:scale-95 sm:text-base"
			type="submit"
			disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</Button
		>
		<div class="flex items-center">
			<div class="flex-grow border-t border-gray-300"></div>
			<span class="mx-1 text-sm sm:text-base">Or</span>
			<div class="flex-grow border-t border-gray-300"></div>
		</div>
		<div class="mr-auto ml-auto flex flex-col items-center gap-1 text-xs sm:flex-row sm:text-sm">
			<span>Already have an account?</span>
			<Label
				class="cursor-pointer border border-transparent text-xs text-blue-500 hover:border-b-blue-500 active:scale-95 sm:text-base"
				onclick={() => goto('/login')}>Sign in here</Label
			>
		</div>
		{#if error}
			<p class="text-red-500">{error}</p>
		{/if}
	</form>
	<footer
		class="flex flex-wrap items-center gap-2 px-2 text-center text-xs text-gray-600 sm:text-sm"
	>
		<Copyright></Copyright>
		<h1>2025 Group 6 Project BSIT 4i</h1>
	</footer>
</section>
