<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { goto } from '$app/navigation';

	let formData = $state({
		customerName: '',
		customerEmail: '',
		issueCategory: '',
		priority: '',
		orderNumber: '',
		description: ''
	});

	let error = $state('');
	let success = $state('');
	let loading = $state(false);

	const issueCategory = [
		{ Issuevalue: 'Technical Issue', label: 'Technical Issue' },
		{ Issuevalue: 'Billing Problem', label: 'Billing Problem' },
		{ Issuevalue: 'Product Issue', label: 'Product Issue' },
		{ Issuevalue: 'Shipping Problem', label: 'Shipping Problem' },
		{ Issuevalue: 'Account Issue', label: 'Account Issue' },
		{ Issuevalue: 'Other', label: 'Other' }
	];

	const prioritiesValue = [
		{ priorityvalue: 'Low - General Inquiry', label: 'Low - General Inquiry' },
		{ priorityvalue: 'Medium - Standard Issue', label: 'Medium - Standard Issue' },
		{ priorityvalue: 'High - Urgent Issue', label: 'High - Urgent Issue' },
		{ priorityvalue: 'Urgent - Critical Problem', label: 'Urgent - Critical Problem' }
	];

	const triggerContent = $derived(
		issueCategory.find((f) => f.Issuevalue === formData.issueCategory)?.label ?? 'Select a Category'
	);

	const triggerContentpriority = $derived(
		prioritiesValue.find((p) => p.priorityvalue === formData.priority)?.label ?? 'Select a Level'
	);

	async function handleSubmit() {
		error = '';
		success = '';

		if (
			!formData.customerName ||
			!formData.customerEmail ||
			!formData.issueCategory ||
			!formData.priority ||
			!formData.description
		) {
			error = 'Please fill in all required fields';
			return;
		}

		loading = true;

		try {
			const res = await fetch('/api/reports/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customerName: formData.customerName,
					customerEmail: formData.customerEmail,
					issueCategory: formData.issueCategory,
					priority: formData.priority,
					orderNumber: formData.orderNumber,
					description: formData.description
				})
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error;
				return;
			}

			success =
				'Your report has been submitted successfully! Report number: ' + data.report.report_number;

			formData = {
				customerName: '',
				customerEmail: '',
				issueCategory: '',
				priority: '',
				orderNumber: '',
				description: ''
			};

			setTimeout(() => {
				goto('/User/Shop');
			}, 2000);
		} catch (err) {
			error = 'An error occurred. Please try again.';
			console.error('Submit error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<section class="flex min-h-screen items-center justify-center p-4">
	<form
		on:submit|preventDefault={handleSubmit}
		class="flex w-full max-w-2xl flex-col gap-7 rounded-md border p-10 shadow-md"
	>
		<div class="flex flex-col items-center gap-2">
			<h1 class="text-xl font-bold">Report a Problem</h1>
			<p class="text-center text-sm">
				We're here to help! Please describe your issue and we'll get back to you soon.
			</p>
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

		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
			<div class="flex flex-1 flex-col gap-1">
				<h1 class="text-sm">Your Name *</h1>
				<Input
					bind:value={formData.customerName}
					class="w-full px-4 py-3"
					type="text"
					placeholder="John Doe"
					required
				/>
			</div>
			<div class="flex flex-1 flex-col gap-1">
				<h1 class="text-sm">Email Address *</h1>
				<Input
					bind:value={formData.customerEmail}
					class="w-full px-4 py-3"
					type="email"
					placeholder="john@example.com"
					required
				/>
			</div>
		</div>

		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
			<div class="flex flex-1 flex-col gap-1">
				<h1 class="text-sm">Issue Category *</h1>
				<Select.Root type="single" bind:value={formData.issueCategory}>
					<Select.Trigger class="w-full px-4 py-3">
						{triggerContent}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Select a Category</Select.Label>
							{#each issueCategory as IssueCategory (IssueCategory.Issuevalue)}
								<Select.Item value={IssueCategory.Issuevalue} label={IssueCategory.label}>
									{IssueCategory.label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>

			<div class="flex flex-1 flex-col gap-1">
				<h1 class="text-sm">Issue Level *</h1>
				<Select.Root type="single" bind:value={formData.priority}>
					<Select.Trigger class="w-full px-4 py-3">
						{triggerContentpriority}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Select a Level</Select.Label>
							{#each prioritiesValue as PrioritiesValue (PrioritiesValue.priorityvalue)}
								<Select.Item value={PrioritiesValue.priorityvalue} label={PrioritiesValue.label}>
									{PrioritiesValue.label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<div class="flex flex-col gap-1">
			<h1 class="text-sm">Order Number (if applicable)</h1>
			<Input
				bind:value={formData.orderNumber}
				type="text"
				placeholder="e.g., #12345"
				class="px-4 py-3"
			/>
		</div>

		<div class="flex flex-col gap-1">
			<h1 class="text-sm">Describe Your Problem *</h1>
			<textarea
				bind:value={formData.description}
				class="text-md min-h-30 w-full resize-none rounded-md border p-3"
				placeholder="Please describe your issue in detail..."
				required
			></textarea>
		</div>

		<Button
			class="cursor-pointer bg-blue-700 font-bold hover:bg-blue-800 active:scale-95"
			type="submit"
			disabled={loading}
		>
			{loading ? 'Submitting...' : 'Submit Report'}
		</Button>
	</form>
</section>
