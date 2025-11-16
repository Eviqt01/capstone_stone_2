<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		setTimeout(() => {
			goto('/User/Shop');
		}, 5000);
	});
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4"
>
	<div class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
		<div class="mb-6 flex justify-center">
			<div class="rounded-full bg-green-100 p-4">
				<svg class="h-16 w-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			</div>
		</div>
		<h1 class="mb-2 text-3xl font-bold text-gray-800">Payment Successful!</h1>
		<p class="mb-6 text-gray-600">Thank you for your purchase. Your order has been confirmed.</p>
		<a
			href="/User/Shop"
			class="inline-block rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-600 hover:to-blue-700"
		>
			Back to Store
		</a>
	</div>
</div>
