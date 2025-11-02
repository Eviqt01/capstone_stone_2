<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4"
>
	<div class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
		<div class="mb-6 flex justify-center">
			<div class="rounded-full bg-red-100 p-4">
				<svg class="h-16 w-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</div>
		</div>
		<h1 class="mb-2 text-3xl font-bold text-gray-800">Payment Failed</h1>
		<p class="mb-6 text-gray-600">Sorry, your payment could not be processed. Please try again.</p>
		<button
			onclick={() => goto('/')}
			class="inline-block rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-600 hover:to-blue-700"
		>
			Try Again
		</button>
	</div>
</div>
