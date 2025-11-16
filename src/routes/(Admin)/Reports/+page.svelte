<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Menu_2 from '@tabler/icons-svelte/icons/menu-2';
	import IconX from '@tabler/icons-svelte/icons/x';
	import Dashboard from '@tabler/icons-svelte/icons/dashboard';
	import BrandMinecraft from '@tabler/icons-svelte/icons/brand-minecraft';
	import Report from '@tabler/icons-svelte/icons/report';
	import ReportMedical from '@tabler/icons-svelte/icons/report-medical';
	import Hourglass from '@tabler/icons-svelte/icons/hourglass';
	import Checks from '@tabler/icons-svelte/icons/checks';
	import Trash from '@tabler/icons-svelte/icons/trash';
	import * as Select from '$lib/components/ui/select/index.js';
	import { goto } from '$app/navigation';

	const logout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/login');
	};

	let MenuOpen = $state(false);
	let reports = $state<any[]>([]);
	let stats = $state({ total: 0, new: 0, inProgress: 0, resolved: 0 });
	let loading = $state(true);
	let error = $state('');

	// Add these variables for user data
	let userEmail = $state('');
	let userRole = $state('');

	let showModal = $state(false);
	let selectedReport = $state<any>(null);
	let adminResponse = $state('');
	let savingResponse = $state(false);

	// Add state for delete confirmation
	let showDeleteModal = $state(false);
	let reportToDelete = $state<any>(null);
	let deleting = $state(false);

	const handleMenuClick = (event: Event) => {
		event?.stopPropagation();
	};

	const menubar = [
		{
			label: 'Dashboard',
			href: '/Dashboard',
			image: Dashboard
		},
		{
			label: 'Inventory',
			href: '/Inventory',
			image: BrandMinecraft
		},
		{
			label: 'Reports',
			href: '/Reports',
			image: Report
		}
	];

	const status = [
		{ value: 'All Status', label: 'All Status' },
		{ value: 'New', label: 'New' },
		{ value: 'In Progress', label: 'In Progress' },
		{ value: 'Resolved', label: 'Resolved' },
		{ value: 'Closed', label: 'Closed' }
	];

	let value = $state('All Status');

	const triggerContent = $derived(
		status.find((f) => f.value === value)?.label ?? 'Select a Status'
	);

	const priorities = [
		{ valuePrio: 'All Priority', label: 'All Priority' },
		{ valuePrio: 'Urgent - Critical Problem', label: 'Urgent - Critical Problem' },
		{ valuePrio: 'High - Urgent Issue', label: 'High - Urgent Issue' },
		{ valuePrio: 'Medium - Standard Issue', label: 'Medium - Standard Issue' },
		{ valuePrio: 'Low - General Inquiry', label: 'Low - General Inquiry' }
	];

	let valuePrio = $state('All Priority');

	const triggerContentPrio = $derived(
		priorities.find((p) => p.valuePrio === valuePrio)?.label ?? 'Select a Priority'
	);

	// Add this function to load user data
	async function loadUserData() {
		try {
			const response = await fetch('/api/auth/user');
			if (response.ok) {
				const userData = await response.json();
				userEmail = userData.email || '';
				userRole = userData.role || '';

				if (userEmail) {
					sessionStorage.setItem('userEmail', userEmail);
					sessionStorage.setItem('userRole', userRole);
				}
			} else {
				userEmail = sessionStorage.getItem('userEmail') || '';
				userRole = sessionStorage.getItem('userRole') || '';
			}
		} catch (error) {
			console.error('Error loading user data:', error);
			userEmail = sessionStorage.getItem('userEmail') || '';
			userRole = sessionStorage.getItem('userRole') || '';
		}
	}

	async function fetchReports() {
		loading = true;
		error = '';

		try {
			const params = new URLSearchParams();
			if (value !== 'All Status') params.append('status', value);
			if (valuePrio !== 'All Priority') params.append('priority', valuePrio);

			const res = await fetch(`/api/reports?${params}`);
			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Failed to fetch reports';
				return;
			}

			if (data.success) {
				reports = data.reports;
				stats = data.stats;
			}
		} catch (err) {
			console.error('Error fetching reports:', err);
			error = 'Failed to load reports';
		} finally {
			loading = false;
		}
	}

	async function updateReportStatus(reportId: number, newStatus: string) {
		try {
			const res = await fetch('/api/reports', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: reportId, status: newStatus })
			});

			if (res.ok) {
				fetchReports();
			}
		} catch (err) {
			console.error('Error updating report:', err);
		}
	}

	// ADD DELETE REPORT FUNCTION
	async function deleteReport(reportId: number) {
		deleting = true;
		try {
			const res = await fetch(`/api/reports/${reportId}`, {
				method: 'DELETE'
			});

			const data = await res.json();

			if (res.ok) {
				// Remove the report from the local state
				reports = reports.filter((report) => report.id !== reportId);
				// Update stats
				stats.total = Math.max(0, stats.total - 1);
				// Close delete modal
				closeDeleteModal();
				alert('Report deleted successfully!');
			} else {
				alert(data.error || 'Failed to delete report');
			}
		} catch (err) {
			console.error('Error deleting report:', err);
			alert('Failed to delete report');
		} finally {
			deleting = false;
		}
	}

	// ADD DELETE MODAL FUNCTIONS
	function openDeleteModal(report: any) {
		reportToDelete = report;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		reportToDelete = null;
	}

	function confirmDelete() {
		if (reportToDelete) {
			deleteReport(reportToDelete.id);
		}
	}

	function openReportModal(report: any) {
		selectedReport = report;
		adminResponse = report.admin_response || '';
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		selectedReport = null;
		adminResponse = '';
	}

	async function saveResponse() {
		if (!selectedReport) return;

		savingResponse = true;

		try {
			const res = await fetch('/api/reports/response', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: selectedReport.id,
					response: adminResponse
				})
			});

			const data = await res.json();

			if (res.ok) {
				alert('Response saved successfully!');
				closeModal();
				fetchReports();
			} else {
				alert(data.error || 'Failed to save response');
			}
		} catch (err) {
			console.error('Error saving response:', err);
			alert('Failed to save response');
		} finally {
			savingResponse = false;
		}
	}

	function getStatusColor(reportStatus: string) {
		switch (reportStatus) {
			case 'New':
				return 'bg-red-100 text-red-700';
			case 'In Progress':
				return 'bg-blue-100 text-blue-700';
			case 'Resolved':
				return 'bg-green-100 text-green-700';
			case 'Closed':
				return 'bg-gray-100 text-gray-700';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}

	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'Urgent - Critical Problem':
				return 'bg-red-100 text-red-700';
			case 'High - Urgent Issue':
				return 'bg-orange-100 text-orange-700';
			case 'Medium - Standard Issue':
				return 'bg-yellow-100 text-yellow-700';
			case 'Low - General Inquiry':
				return 'bg-green-100 text-green-700';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleString('en-US', {
			month: '2-digit',
			day: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

	onMount(() => {
		// Load user data first
		loadUserData();
		// Then load reports
		fetchReports();
	});

	$effect(() => {
		if (value || valuePrio) {
			fetchReports();
		}
	});
</script>

<main class="relative min-h-screen">
	<nav class="sticky top-0 z-20 flex border bg-white px-4 py-2 shadow-sm">
		<div class="mr-auto flex items-center gap-1">
			<Button
				class="cursor-pointer bg-white p-2 hover:bg-gray-50 active:scale-95"
				onclick={(event) => {
					handleMenuClick(event);
					MenuOpen = !MenuOpen;
				}}
			>
				{#if MenuOpen}
					<IconX class="h-5 w-5 cursor-pointer text-gray-700 duration-300 active:scale-95" />
				{:else}
					<Menu_2 class="h-5 w-5 cursor-pointer text-gray-700 duration-300 active:scale-95" />
				{/if}
			</Button>
			<h1 class="text-xl font-bold">Customer Support</h1>
			{#if MenuOpen}
				<section
					class="absolute top-13 -left-1 z-50 flex min-h-screen w-120 max-w-60 animate-in flex-col justify-center rounded-r-sm bg-gray-800 px-1 py-5 duration-300 slide-in-from-left"
				>
					<div class="flex flex-col items-center gap-2 p-2">
						<h1 class="text-xl font-bold text-white">Admin Panel</h1>
						<hr class="w-full border border-gray-700 bg-gray-800" />
					</div>
					<ul class="mb-auto animate-in duration-300 slide-in-from-left">
						{#each menubar as MenuBar}
							<li>
								<a
									href={MenuBar.href}
									class="flex cursor-pointer items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
								>
									<MenuBar.image class="mr-3 h-5 w-5" />
									{MenuBar.label}
								</a>
							</li>
						{/each}
					</ul>

					<div class="absolute right-0 bottom-0 left-0 border-t border-gray-700 bg-gray-800 p-4">
						<div class="flex items-center">
							<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
								<span class="text-sm font-medium text-white">
									{userEmail ? userEmail.charAt(0).toUpperCase() : 'A'}
								</span>
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-xs font-medium text-white">
									{#if userEmail}
										{userEmail}
									{:else}
										Loading...
									{/if}
								</p>
								<p class="truncate text-xs text-gray-400">
									{#if userRole}
										{userRole === 'admin' ? 'Administrator' : 'User'}
									{:else}
										Admin
									{/if}
								</p>
							</div>
						</div>
					</div>
				</section>
			{/if}
		</div>
		<Button
			class="cursor-pointer bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 active:scale-95"
			onclick={logout}
		>
			Logout
		</Button>
	</nav>

	<div class="relative min-h-screen">
		<div class="flex min-h-screen flex-col gap-10 p-5">
			<div class="flex flex-wrap items-center justify-center gap-4 rounded-md border p-5 shadow-sm">
				<div class="mr-auto">
					<h1 class="text-2xl font-bold">Customer Reports Management</h1>
					<p>Manage and respond to customer issues</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<Select.Root type="single" name="status" bind:value>
						<Select.Trigger class="w-[180px]">
							{triggerContent}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Status</Select.Label>
								{#each status as Status (Status.value)}
									<Select.Item value={Status.value} label={Status.label}>
										{Status.label}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
					<Select.Root type="single" name="priorities" bind:value={valuePrio}>
						<Select.Trigger class="w-[180px]">
							{triggerContentPrio}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Priorities</Select.Label>
								{#each priorities as Priorities (Priorities.valuePrio)}
									<Select.Item value={Priorities.valuePrio} label={Priorities.label}>
										{Priorities.label}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<section class="flex flex-wrap items-center justify-around gap-4">
				<div
					class="flex w-105 max-w-2xl flex-wrap items-center justify-center gap-10 rounded-md border p-5 shadow-md"
				>
					<div class="mr-auto flex flex-col gap-1">
						<h1 class="text-md">Total Reports</h1>
						<span class="text-[30px] font-bold">{stats.total}</span>
					</div>
					<Report size="34"></Report>
				</div>
				<div
					class="flex w-105 max-w-2xl flex-wrap items-center justify-center gap-10 rounded-md border p-5 shadow-md"
				>
					<div class="mr-auto flex flex-col gap-1">
						<h1 class="text-md">New Reports</h1>
						<span class="text-[30px] font-bold text-red-500">{stats.new}</span>
					</div>
					<ReportMedical size="34"></ReportMedical>
				</div>
				<div
					class="flex w-105 max-w-2xl flex-wrap items-center justify-center gap-10 rounded-md border p-5 shadow-md"
				>
					<div class="mr-auto flex flex-col gap-1">
						<h1 class="text-md">In Progress</h1>
						<span class="text-[30px] font-bold text-blue-500">{stats.inProgress}</span>
					</div>
					<Hourglass size="34"></Hourglass>
				</div>
				<div
					class="flex w-105 max-w-2xl flex-wrap items-center justify-center gap-10 rounded-md border p-5 shadow-md"
				>
					<div class="mr-auto flex flex-col gap-1">
						<h1 class="text-md">Resolved</h1>
						<span class="text-[30px] font-bold text-green-500">{stats.resolved}</span>
					</div>
					<Checks size="34"></Checks>
				</div>
			</section>

			<div>
				<div class="rounded-t-md border p-5 shadow-md">
					<h1 class="text-xl font-bold">Customer Reports</h1>
				</div>

				{#if error}
					<div class="rounded-b-md border border-t-0 bg-red-50 p-5 text-red-600">
						{error}
					</div>
				{:else if loading}
					<div class="rounded-b-md border border-t-0 p-10 text-center">
						<p>Loading reports...</p>
					</div>
				{:else if reports.length === 0}
					<div class="rounded-b-md border border-t-0 p-10 text-center">
						<p class="text-gray-600">No reports found</p>
						<p class="mt-2 text-sm text-gray-400">Submit a test report to see it here</p>
					</div>
				{:else}
					<div class="flex flex-col gap-4 rounded-b-md border border-t-0 p-5">
						{#each reports as report (report.id)}
							<div
								class="flex flex-col gap-3 rounded-md border-l-4 {report.status === 'New'
									? 'border-l-red-500'
									: report.status === 'In Progress'
										? 'border-l-blue-500'
										: 'border-l-green-500'} bg-white p-4 shadow-sm"
							>
								<div class="flex flex-wrap items-start justify-between gap-2">
									<div class="flex flex-wrap items-center gap-2">
										<h2 class="font-bold">Report {report.report_number}</h2>
										<span
											class="rounded-full px-2 py-1 text-xs font-semibold uppercase {getStatusColor(
												report.status
											)}"
										>
											{report.status}
										</span>
										<span
											class="rounded-full px-2 py-1 text-xs font-semibold uppercase {getPriorityColor(
												report.priority
											)}"
										>
											{report.priority}
										</span>
										<span class="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
											{report.issue_category}
										</span>
									</div>
									<div class="flex gap-2">
										<Button
											class="bg-blue-600 px-3 py-1 text-xs hover:bg-blue-700"
											onclick={() => openReportModal(report)}
										>
											View
										</Button>
										<Select.Root
											type="single"
											value={report.status}
											onValueChange={(newValue) =>
												newValue && updateReportStatus(report.id, newValue)}
										>
											<Select.Trigger class="w-[140px] px-3 py-1 text-xs">
												{report.status}
											</Select.Trigger>
											<Select.Content>
												<Select.Group>
													{#each status.filter((s) => s.value !== 'All Status') as statusOption}
														<Select.Item value={statusOption.value}>
															{statusOption.label}
														</Select.Item>
													{/each}
												</Select.Group>
											</Select.Content>
										</Select.Root>
										<!-- ADD DELETE BUTTON -->
										<Button
											class="bg-red-600 px-3 py-1 text-xs hover:bg-red-700"
											onclick={() => openDeleteModal(report)}
										>
											<Trash class="h-3 w-3" />
										</Button>
									</div>
								</div>

								<div class="text-sm">
									<p><strong>Customer:</strong> {report.customer_name} ({report.customer_email})</p>
									{#if report.order_number}
										<p><strong>Order:</strong> {report.order_number}</p>
									{/if}
									<!-- ADD HOME ADDRESS TO REPORT LIST -->
									{#if report.home_address}
										<p><strong>Home Address:</strong> {report.home_address}</p>
									{/if}
								</div>

								<p class="text-sm text-gray-700">
									{report.description}
								</p>

								<div class="text-xs text-gray-500">
									<p>Submitted: {formatDate(report.created_at)}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if showModal && selectedReport}
		<div
			class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-gray-800 p-4 opacity-95"
		>
			<div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
				<div class="sticky top-0 flex items-center justify-between border-b bg-white p-6">
					<h2 class="text-2xl font-bold">Report Details</h2>
					<button onclick={closeModal} class="rounded-full p-2 hover:bg-gray-100 active:scale-95">
						<IconX class="h-6 w-6" />
					</button>
				</div>

				<div class="flex flex-col gap-6 p-6">
					<div class="flex flex-wrap gap-2">
						<span class="text-lg font-bold">{selectedReport.report_number}</span>
						<span
							class="rounded-full px-3 py-1 text-sm font-semibold {getStatusColor(
								selectedReport.status
							)}"
						>
							{selectedReport.status}
						</span>
						<span
							class="rounded-full px-3 py-1 text-sm font-semibold {getPriorityColor(
								selectedReport.priority
							)}"
						>
							{selectedReport.priority}
						</span>
						<span class="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
							{selectedReport.issue_category}
						</span>
					</div>

					<div class="rounded-lg bg-gray-50 p-4">
						<h3 class="mb-2 font-semibold">Customer Information</h3>
						<div class="space-y-1 text-sm">
							<p><strong>Name:</strong> {selectedReport.customer_name}</p>
							<p><strong>Email:</strong> {selectedReport.customer_email}</p>
							<!-- ADD HOME ADDRESS TO MODAL -->
							{#if selectedReport.home_address}
								<p><strong>Home Address:</strong> {selectedReport.home_address}</p>
							{/if}
							{#if selectedReport.order_number}
								<p><strong>Order Number:</strong> {selectedReport.order_number}</p>
							{/if}
							<p><strong>Submitted:</strong> {formatDate(selectedReport.created_at)}</p>
						</div>
					</div>

					<div>
						<h3 class="mb-2 font-semibold">Problem Description</h3>
						<p class="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
							{selectedReport.description}
						</p>
					</div>

					<div>
						<h3 class="mb-2 font-semibold">Admin Response</h3>
						<textarea
							bind:value={adminResponse}
							class="w-full resize-none rounded-lg border p-4 text-sm focus:border-blue-500 focus:outline-none"
							rows="6"
							placeholder="Type your response to the customer here..."
						></textarea>
					</div>
				</div>

				<div class="sticky bottom-0 flex justify-end gap-3 border-t bg-white p-6">
					<Button
						class="cursor-pointer bg-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-300 active:scale-95"
						onclick={closeModal}
					>
						Cancel
					</Button>
					<Button
						class="cursor-pointer bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 active:scale-95"
						onclick={saveResponse}
						disabled={savingResponse}
					>
						{savingResponse ? 'Saving...' : 'Save Response'}
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Delete Confirmation Modal -->
	{#if showDeleteModal && reportToDelete}
		<div
			class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-gray-800 p-4 opacity-95"
		>
			<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
				<div class="mb-4 flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
						<Trash class="h-6 w-6 text-red-600" />
					</div>
					<div>
						<h2 class="text-xl font-bold text-gray-900">Delete Report</h2>
						<p class="text-sm text-gray-600">This action cannot be undone</p>
					</div>
				</div>

				<div class="mb-6 rounded-lg bg-red-50 p-4">
					<p class="text-sm text-red-800">
						Are you sure you want to delete report <strong>{reportToDelete.report_number}</strong>
						from
						<strong>{reportToDelete.customer_name}</strong>?
					</p>
					<p class="mt-2 text-xs text-red-700">
						This will permanently remove the report and all its data from the system.
					</p>
				</div>

				<div class="flex justify-end gap-3">
					<Button
						class="cursor-pointer bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 active:scale-95"
						onclick={closeDeleteModal}
						disabled={deleting}
					>
						Cancel
					</Button>
					<Button
						class="cursor-pointer bg-red-600 px-4 py-2 text-white hover:bg-red-700 active:scale-95"
						onclick={confirmDelete}
						disabled={deleting}
					>
						{#if deleting}
							<span class="flex items-center gap-2">
								<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
										fill="none"
									/>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								Deleting...
							</span>
						{:else}
							Delete Report
						{/if}
					</Button>
				</div>
			</div>
		</div>
	{/if}
</main>
