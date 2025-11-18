<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Menu_2 from '@tabler/icons-svelte/icons/menu-2';
	import IconX from '@tabler/icons-svelte/icons/x';
	import Dashboard from '@tabler/icons-svelte/icons/dashboard';
	import Moneybag from '@tabler/icons-svelte/icons/moneybag';
	import ShoppingCart from '@tabler/icons-svelte/icons/shopping-cart';
	import BrandMinecraft from '@tabler/icons-svelte/icons/brand-minecraft';
	import User from '@tabler/icons-svelte/icons/user';
	import Report from '@tabler/icons-svelte/icons/report';
	import Edit from '@tabler/icons-svelte/icons/edit';
	import Check from '@tabler/icons-svelte/icons/check';
	import X from '@tabler/icons-svelte/icons/x';
	import Trash from '@tabler/icons-svelte/icons/trash';

	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const logout = () => {
		goto('/login');
	};

	let MenuOpen = $state(false);
	let loading = $state(true);

	const daysSelect = [
		{ value: 'all', label: 'All Time' },
		{ value: '7', label: 'Last 7 Days' },
		{ value: '30', label: 'Last 30 Days' },
		{ value: '90', label: 'Last 90 Days' }
	];

	let salesFilter = $state('all'); // Default to All Time

	const triggerContent = $derived(
		daysSelect.find((f) => f.value === salesFilter)?.label ?? 'Filter Sales'
	);

	let userEmail = $state('');
	let userRole = $state('');

	let editingOrderId = $state<string | null>(null);
	let selectedStatus = $state<string>('');
	let deletingOrderId = $state<string | null>(null);

	interface Stats {
		totalUsers: number;
		totalOrders: number;
		totalRevenue: number;
		totalProducts: number;
	}

	interface SalesData {
		day: string;
		sales: number;
	}

	interface Activity {
		message: string;
		type: string;
		color: string;
		time: string;
	}

	interface Order {
		id: string;
		originalId: string;
		customer: string;
		email: string;
		address: string;
		amount: number;
		status: string;
		statusColor: string;
		date: string;
	}

	let stats = $state<Stats>({
		totalUsers: 0,
		totalOrders: 0,
		totalRevenue: 0,
		totalProducts: 0
	});

	let salesData = $state<SalesData[]>([]);
	let recentActivities = $state<Activity[]>([]);
	let recentOrders = $state<Order[]>([]);

	const handleMenuClick = (event: Event) => {
		event?.stopPropagation();
		MenuOpen = !MenuOpen;
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

	// Helper function for activity background colors
	function getActivityColor(type: string): string {
		switch (type) {
			case 'order':
			case 'order_update':
				return 'bg-blue-100';
			case 'payment':
				return 'bg-green-100';
			case 'product':
				return 'bg-purple-100';
			case 'order_deleted':
				return 'bg-red-100';
			default:
				return 'bg-gray-100';
		}
	}

	// Helper function for activity icon colors
	function getActivityIconColor(type: string): string {
		switch (type) {
			case 'order':
			case 'order_update':
				return 'text-blue-600';
			case 'payment':
				return 'text-green-600';
			case 'product':
				return 'text-purple-600';
			case 'order_deleted':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	}

	// Load user data
	async function loadUserData() {
		try {
			const response = await fetch('/api/auth/user');
			if (response.ok) {
				const userData = await response.json();
				userEmail = userData.email || '';
				userRole = userData.role || '';
			}
		} catch (error) {
			console.error('Error loading user data:', error);
		}
	}

	// Load dashboard data with sales filter
	async function loadDashboardData() {
		try {
			console.log('🔄 Loading dashboard data...');

			const [statsResponse, salesResponse, activitiesResponse, ordersResponse] = await Promise.all([
				fetch('/api/dashboard/stats').then((r) => r.json()),
				fetch(`/api/dashboard/sales?range=${salesFilter}`).then((r) => r.json()),
				fetch('/api/dashboard/activities').then((r) => r.json()),
				fetch('/api/dashboard/orders?limit=5').then((r) => r.json())
			]);

			console.log('✅ Data loaded successfully');

			// Set data with proper typing
			stats = statsResponse as Stats;
			salesData = salesResponse as SalesData[];
			recentActivities = activitiesResponse as Activity[];
			recentOrders = (ordersResponse as { data: Order[] }).data || [];
		} catch (error) {
			console.error('❌ Dashboard load error:', error);
			// Set safe fallback data
			stats = { totalUsers: 0, totalOrders: 0, totalRevenue: 0, totalProducts: 0 };
			salesData = getSampleSalesData(salesFilter);
			recentActivities = [];
			recentOrders = [];
		} finally {
			loading = false;
		}
	}

	// Handle sales filter change
	async function handleSalesFilterChange(newFilter: string) {
		console.log('🔄 Changing sales filter to:', newFilter);
		salesFilter = newFilter;
		await loadSalesData();
	}

	// Load only sales data when filter changes
	async function loadSalesData() {
		try {
			console.log(`🔄 Loading sales data for: ${salesFilter}`);
			const salesResponse = await fetch(`/api/dashboard/sales?range=${salesFilter}`);
			if (salesResponse.ok) {
				const salesDataResponse = await salesResponse.json();
				salesData = salesDataResponse as SalesData[];
				console.log('✅ Sales data updated:', salesData);
			} else {
				console.log('⚠️ Using sample sales data');
				salesData = getSampleSalesData(salesFilter);
			}
		} catch (error) {
			console.error('Error loading filtered sales data:', error);
			salesData = getSampleSalesData(salesFilter);
		}
	}

	// Sample data generator for different time ranges
	function getSampleSalesData(range: string): SalesData[] {
		switch (range) {
			case '7':
				return [
					{ day: 'Mon', sales: 12000 },
					{ day: 'Tue', sales: 19000 },
					{ day: 'Wed', sales: 15000 },
					{ day: 'Thu', sales: 22000 },
					{ day: 'Fri', sales: 18000 },
					{ day: 'Sat', sales: 25000 },
					{ day: 'Sun', sales: 14000 }
				];
			case '30':
				return [
					{ day: 'Week 1', sales: 45000 },
					{ day: 'Week 2', sales: 52000 },
					{ day: 'Week 3', sales: 48000 },
					{ day: 'Week 4', sales: 61000 }
				];
			case '90':
				return [
					{ day: 'Month 1', sales: 185000 },
					{ day: 'Month 2', sales: 210000 },
					{ day: 'Month 3', sales: 195000 }
				];
			case 'all':
			default:
				return [
					{ day: 'Jan', sales: 120000 },
					{ day: 'Feb', sales: 150000 },
					{ day: 'Mar', sales: 180000 },
					{ day: 'Apr', sales: 140000 },
					{ day: 'May', sales: 200000 },
					{ day: 'Jun', sales: 220000 },
					{ day: 'Jul', sales: 190000 },
					{ day: 'Aug', sales: 210000 },
					{ day: 'Sep', sales: 180000 },
					{ day: 'Oct', sales: 240000 },
					{ day: 'Nov', sales: 260000 },
					{ day: 'Dec', sales: 300000 }
				];
		}
	}

	// Update order status
	async function updateOrderStatus(orderId: string, newStatus: string) {
		try {
			const response = await fetch('/api/dashboard/orders', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					orderId,
					status: newStatus
				})
			});

			if (response.ok) {
				// Update local state
				const orderIndex = recentOrders.findIndex((order) => order.originalId === orderId);
				if (orderIndex !== -1) {
					recentOrders[orderIndex].status = newStatus;
					recentOrders[orderIndex].statusColor = getStatusColor(newStatus);
				}
				await loadDashboardData(); // Refresh data
			} else {
				alert('Failed to update order status');
			}
		} catch (error) {
			console.error('Error updating order status:', error);
			alert('Error updating order status');
		} finally {
			editingOrderId = null;
			selectedStatus = '';
		}
	}

	// Delete order function
	async function deleteOrder(orderId: string) {
		try {
			const response = await fetch('/api/dashboard/orders', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					orderId
				})
			});

			if (response.ok) {
				// Remove from local state
				recentOrders = recentOrders.filter((order) => order.originalId !== orderId);
				await loadDashboardData(); // Refresh data to get updated stats
				alert('Order deleted successfully');
			} else {
				const errorData = await response.json();
				alert(errorData.error || 'Failed to delete order');
			}
		} catch (error) {
			console.error('Error deleting order:', error);
			alert('Error deleting order');
		} finally {
			deletingOrderId = null;
		}
	}

	// Confirm delete function
	function confirmDelete(orderId: string) {
		deletingOrderId = orderId;
	}

	// Cancel delete function
	function cancelDelete() {
		deletingOrderId = null;
	}

	// Helper function for status colors
	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			Pending: 'bg-yellow-100 text-yellow-800',
			Processing: 'bg-blue-100 text-blue-800',
			Completed: 'bg-green-100 text-green-800',
			Cancelled: 'bg-red-100 text-red-800',
			Shipped: 'bg-purple-100 text-purple-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	onMount(async () => {
		await loadUserData();
		await loadDashboardData();
	});

	const maxSales = $derived(Math.max(...salesData.map((d) => d.sales), 1));
</script>

<div class="relative min-h-screen bg-gray-50">
	<nav class="sticky top-0 z-20 flex border-b bg-white px-4 py-3 shadow-sm">
		<div class="mr-auto flex items-center gap-2">
			<Button
				class="cursor-pointer bg-white p-2 hover:bg-gray-50 active:scale-95"
				onclick={handleMenuClick}
			>
				{#if MenuOpen}
					<IconX class="h-5 w-5 cursor-pointer text-gray-700" />
				{:else}
					<Menu_2 class="h-5 w-5 cursor-pointer text-gray-700" />
				{/if}
			</Button>
			<h1 class="text-xl font-bold text-gray-800">Dashboard</h1>
		</div>
		{#if MenuOpen}
			<section
				class="absolute top-15 left-0 z-50 flex min-h-100 w-120 max-w-60 animate-in flex-col justify-center rounded-r-sm bg-gray-800 px-1 py-5 duration-300 slide-in-from-left"
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
		<Button
			class="cursor-pointer bg-red-500 px-5 py-2 text-sm font-bold text-white hover:bg-red-600 active:scale-95"
			onclick={logout}
		>
			Logout
		</Button>
	</nav>

	<main class="relative flex min-h-screen flex-col gap-6 p-6">
		{#if loading}
			<div class="flex flex-col items-center justify-center py-20">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
				></div>
				<p class="mt-4 text-gray-600">Loading dashboard...</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<div class="flex items-center gap-4 rounded-lg border bg-white p-6 shadow-sm">
					<div class="flex flex-1 flex-col gap-1">
						<h3 class="text-sm font-medium text-gray-600">Total Users</h3>
						<span class="text-2xl font-bold text-gray-900">{stats.totalUsers}</span>
					</div>
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
						<User class="h-6 w-6 text-blue-600" />
					</div>
				</div>

				<div class="flex items-center gap-4 rounded-lg border bg-white p-6 shadow-sm">
					<div class="flex flex-1 flex-col gap-1">
						<h3 class="text-sm font-medium text-gray-600">Total Orders</h3>
						<span class="text-2xl font-bold text-gray-900">{stats.totalOrders}</span>
					</div>
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
						<ShoppingCart class="h-6 w-6 text-green-600" />
					</div>
				</div>

				<div class="flex items-center gap-4 rounded-lg border bg-white p-6 shadow-sm">
					<div class="flex flex-1 flex-col gap-1">
						<h3 class="text-sm font-medium text-gray-600">Revenue</h3>
						<span class="text-2xl font-bold text-gray-900"
							>₱{stats.totalRevenue.toLocaleString()}</span
						>
					</div>
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
						<Moneybag class="h-6 w-6 text-yellow-600" />
					</div>
				</div>

				<div class="flex items-center gap-4 rounded-lg border bg-white p-6 shadow-sm">
					<div class="flex flex-1 flex-col gap-1">
						<h3 class="text-sm font-medium text-gray-600">Total Products</h3>
						<span class="text-2xl font-bold text-gray-900">{stats.totalProducts}</span>
					</div>
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
						<BrandMinecraft class="h-6 w-6 text-red-600" />
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<div class="rounded-lg border bg-white p-6 shadow-sm">
					<div class="mb-6 flex items-center justify-between">
						<h2 class="text-lg font-semibold text-gray-800">Sales Overview</h2>

						<div class="flex gap-2">
							<button
								onclick={() => handleSalesFilterChange('all')}
								class="rounded-lg px-3 py-1 text-sm font-medium transition-all {salesFilter ===
								'all'
									? 'bg-blue-500 text-white'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
							>
								All Time
							</button>
							<button
								onclick={() => handleSalesFilterChange('7')}
								class="rounded-lg px-3 py-1 text-sm font-medium transition-all {salesFilter === '7'
									? 'bg-blue-500 text-white'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
							>
								7 Days
							</button>
							<button
								onclick={() => handleSalesFilterChange('30')}
								class="rounded-lg px-3 py-1 text-sm font-medium transition-all {salesFilter === '30'
									? 'bg-blue-500 text-white'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
							>
								30 Days
							</button>
							<button
								onclick={() => handleSalesFilterChange('90')}
								class="rounded-lg px-3 py-1 text-sm font-medium transition-all {salesFilter === '90'
									? 'bg-blue-500 text-white'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
							>
								90 Days
							</button>
						</div>
					</div>
					{#if salesData.length > 0}
						<div class="flex h-64 items-end justify-between gap-2">
							{#each salesData as data}
								<div class="flex flex-1 flex-col items-center gap-2">
									<div class="relative flex w-full justify-center">
										<div
											class="w-3/4 rounded-t-lg bg-blue-500 transition-all duration-300 hover:bg-blue-600"
											style="height: {(data.sales / maxSales) * 180}px;"
											title="₱{data.sales.toLocaleString()}"
										></div>
									</div>
									<span class="text-xs font-medium text-gray-600">{data.day}</span>
									<span class="text-xs font-bold text-blue-600">₱{data.sales.toLocaleString()}</span
									>
								</div>
							{/each}
						</div>
						<div class="mt-4 text-center text-sm text-gray-500">
							Total Sales: ₱{salesData.reduce((sum, data) => sum + data.sales, 0).toLocaleString()}
						</div>
					{:else}
						<div class="flex h-64 items-center justify-center">
							<p class="text-gray-500">No sales data available</p>
						</div>
					{/if}
				</div>

				<div class="rounded-lg border bg-white p-6 shadow-sm">
					<h2 class="mb-6 text-lg font-semibold text-gray-800">Recent Activity</h2>
					{#if recentActivities.length > 0}
						<div class="space-y-4">
							{#each recentActivities as activity}
								<div class="flex items-start gap-3">
									<div
										class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full {getActivityColor(
											activity.type
										)}"
									>
										{#if activity.type === 'order' || activity.type === 'order_update' || activity.message.includes('order')}
											<ShoppingCart class="h-5 w-5 {getActivityIconColor(activity.type)}" />
										{:else if activity.type === 'payment' || activity.message.includes('payment') || activity.message.includes('paid')}
											<Moneybag class="h-5 w-5 {getActivityIconColor(activity.type)}" />
										{:else if activity.type === 'product' || activity.message.includes('product') || activity.message.includes('inventory')}
											<BrandMinecraft class="h-5 w-5 {getActivityIconColor(activity.type)}" />
										{:else if activity.type === 'order_deleted' || activity.message.includes('deleted') || activity.message.includes('removed')}
											<X class="h-5 w-5 {getActivityIconColor(activity.type)}" />
										{:else}
											<span class="text-lg">📝</span>
										{/if}
									</div>
									<div class="flex-1">
										<p class="text-sm font-medium text-gray-900">{activity.message}</p>
										<p class="text-xs text-gray-500">{activity.time}</p>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="flex h-64 items-center justify-center">
							<p class="text-gray-500">No recent activities</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Recent Orders Table -->
			<div class="rounded-lg border bg-white p-6 shadow-sm">
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-800">Recent Orders</h2>
				</div>
				{#if recentOrders.length > 0}
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-b bg-gray-50">
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">ORDER ID</th>
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">CUSTOMER</th>
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">EMAIL</th>
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">ADDRESS</th>
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">AMOUNT</th>
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">STATUS</th>
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">DATE</th>
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">ACTIONS</th>
								</tr>
							</thead>
							<tbody class="divide-y">
								{#each recentOrders as order}
									<tr class="transition-colors hover:bg-gray-50">
										<td class="px-4 py-4 text-sm font-medium text-gray-900">{order.id}</td>
										<td class="px-4 py-4 text-sm text-gray-700">{order.customer}</td>
										<td class="px-4 py-4 text-sm text-blue-600">{order.email}</td>
										<td class="max-w-xs truncate px-4 py-4 text-sm text-gray-600"
											>{order.address}</td
										>
										<td class="px-4 py-4 text-sm font-semibold text-gray-900"
											>₱{order.amount.toFixed(2)}</td
										>
										<td class="px-4 py-4">
											{#if editingOrderId === order.originalId}
												<select
													bind:value={selectedStatus}
													class="rounded border border-gray-300 px-2 py-1 text-sm"
												>
													<option value="Pending">Pending</option>
													<option value="Completed">Completed</option>
													<option value="Cancelled">Cancelled</option>
												</select>
											{:else}
												<span
													class="inline-flex rounded-full px-3 py-1 text-xs font-medium {order.statusColor}"
												>
													{order.status}
												</span>
											{/if}
										</td>
										<td class="px-4 py-4 text-sm text-gray-600">{order.date}</td>
										<td class="px-4 py-4">
											<div class="flex gap-2">
												{#if editingOrderId === order.originalId}
													<button
														onclick={() => updateOrderStatus(order.originalId, selectedStatus)}
														class="rounded bg-green-500 p-1 text-white transition-colors hover:bg-green-600"
														title="Save"
													>
														<Check class="h-4 w-4" />
													</button>
													<button
														onclick={() => {
															editingOrderId = null;
															selectedStatus = '';
														}}
														class="cursor-pointer rounded bg-red-500 p-1 text-white transition-colors hover:bg-red-600 active:scale-95"
														title="Cancel"
													>
														<X class="h-4 w-4" />
													</button>
												{:else if deletingOrderId === order.originalId}
													<button
														onclick={() => deleteOrder(order.originalId)}
														class="rounded bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
														title="Confirm Delete"
													>
														<Check class="h-4 w-4" />
													</button>
													<button
														onclick={cancelDelete}
														class="rounded bg-gray-500 p-1 text-white transition-colors hover:bg-gray-600"
														title="Cancel Delete"
													>
														<X class="h-4 w-4" />
													</button>
												{:else}
													<button
														onclick={() => {
															editingOrderId = order.originalId;
															selectedStatus = order.status;
														}}
														class="cursor-pointer rounded bg-blue-500 p-1 text-white transition-colors hover:bg-blue-600 active:scale-95"
														title="Edit Status"
													>
														<Edit class="h-4 w-4" />
													</button>
													<button
														onclick={() => confirmDelete(order.originalId)}
														class="cursor-pointer rounded bg-red-500 p-1 text-white transition-colors hover:bg-red-600 active:scale-95"
														title="Delete Order"
													>
														<Trash class="h-4 w-4" />
													</button>
												{/if}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="py-8 text-center">
						<p class="text-gray-500">No recent orders</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Delete Confirmation Modal -->
		{#if deletingOrderId}
			<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
				<div class="mx-4 max-w-md rounded-lg bg-white p-6">
					<h3 class="mb-2 text-lg font-semibold text-gray-800">Confirm Delete</h3>
					<p class="mb-4 text-gray-600">
						Are you sure you want to delete this order? This action cannot be undone.
					</p>
					<div class="flex justify-end gap-3">
						<button
							onclick={cancelDelete}
							class="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 active:scale-95"
						>
							Cancel
						</button>
						<button
							onclick={() => deleteOrder(deletingOrderId!)}
							class="cursor-pointer rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 active:scale-95"
						>
							Delete Order
						</button>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>
