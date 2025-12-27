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
	import Archive from '@tabler/icons-svelte/icons/archive';
	import Refresh from '@tabler/icons-svelte/icons/refresh';
	import Message from '@tabler/icons-svelte/icons/message';
	import Download from '@tabler/icons-svelte/icons/download';
	import Users from '@tabler/icons-svelte/icons/users';
	import Package from '@tabler/icons-svelte/icons/package';
	import TrendingUp from '@tabler/icons-svelte/icons/trending-up';

	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const logout = () => {
		goto('/login');
	};

	let MenuOpen = $state(false);
	let loading = $state(true);

	// Sales filter options
	const salesFilterOptions = [
		{ value: 'all', label: 'All Time' },
		{ value: '7', label: 'Last 7 Days' },
		{ value: '30', label: 'Last 30 Days' },
		{ value: '90', label: 'Last 90 Days' }
	];

	// Orders filter options (more detailed)
	const ordersFilterOptions = [
		{ value: 'all', label: 'All Time' },
		{ value: 'today', label: 'Today' },
		{ value: 'yesterday', label: 'Yesterday' },
		{ value: '7', label: 'Last 7 Days' },
		{ value: '30', label: 'Last 30 Days' },
		{ value: '90', label: 'Last 90 Days' },
		{ value: 'this_month', label: 'This Month' },
		{ value: 'last_month', label: 'Last Month' },
		{ value: 'this_year', label: 'This Year' }
	];

	let salesFilter = $state('all');
	let ordersFilter = $state('all'); // New: orders time filter
	let activeTab = $state('active');
	let exportLoading = $state(false);
	let exportType = $state<string | null>(null);
	let showExportMenu = $state(false);

	const salesFilterContent = $derived(
		salesFilterOptions.find((f) => f.value === salesFilter)?.label ?? 'Filter Sales'
	);

	const ordersFilterContent = $derived(
		ordersFilterOptions.find((f) => f.value === ordersFilter)?.label ?? 'Filter Orders'
	);

	let userEmail = $state('');
	let userRole = $state('');

	let editingOrderId = $state<string | null>(null);
	let selectedStatus = $state<string>('');
	let deletingOrderId = $state<string | null>(null);
	let restoringOrderId = $state<string | null>(null);
	let viewingCommentsOrder = $state<Order | null>(null);

	interface Stats {
		totalUsers: number;
		totalOrders: number;
		totalRevenue: number;
		totalProducts: number;
		totalDeletedOrders: number;
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
		phone: string;
		address: string;
		comments: string;
		amount: number;
		status: string;
		statusColor: string;
		date: string;
		created_at: string;
		deleted_at: string | null;
	}

	let stats = $state<Stats>({
		totalUsers: 0,
		totalOrders: 0,
		totalRevenue: 0,
		totalProducts: 0,
		totalDeletedOrders: 0
	});

	let salesData = $state<SalesData[]>([]);
	let recentActivities = $state<Activity[]>([]);
	let recentOrders = $state<Order[]>([]);
	let deletedOrders = $state<Order[]>([]);

	// Filtered orders based on time filter
	let filteredRecentOrders = $derived.by(() => {
		if (ordersFilter === 'all' || !recentOrders.length) return recentOrders;

		const now = new Date();
		let startDate = new Date();

		switch (ordersFilter) {
			case 'today':
				startDate.setHours(0, 0, 0, 0);
				break;
			case 'yesterday':
				startDate.setDate(now.getDate() - 1);
				startDate.setHours(0, 0, 0, 0);
				const yesterdayEnd = new Date(startDate);
				yesterdayEnd.setHours(23, 59, 59, 999);
				return recentOrders.filter((order) => {
					const orderDate = new Date(order.created_at || order.date);
					return orderDate >= startDate && orderDate <= yesterdayEnd;
				});
			case '7':
				startDate.setDate(now.getDate() - 7);
				break;
			case '30':
				startDate.setDate(now.getDate() - 30);
				break;
			case '90':
				startDate.setDate(now.getDate() - 90);
				break;
			case 'this_month':
				startDate = new Date(now.getFullYear(), now.getMonth(), 1);
				break;
			case 'last_month':
				startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
				return recentOrders.filter((order) => {
					const orderDate = new Date(order.created_at || order.date);
					return orderDate >= startDate && orderDate <= lastMonthEnd;
				});
			case 'this_year':
				startDate = new Date(now.getFullYear(), 0, 1);
				break;
			default:
				return recentOrders;
		}

		return recentOrders.filter((order) => {
			const orderDate = new Date(order.created_at || order.date);
			return orderDate >= startDate;
		});
	});

	// Filtered deleted orders based on time filter
	let filteredDeletedOrders = $derived.by(() => {
		if (ordersFilter === 'all' || !deletedOrders.length) return deletedOrders;

		const now = new Date();
		let startDate = new Date();

		switch (ordersFilter) {
			case 'today':
				startDate.setHours(0, 0, 0, 0);
				break;
			case 'yesterday':
				startDate.setDate(now.getDate() - 1);
				startDate.setHours(0, 0, 0, 0);
				const yesterdayEnd = new Date(startDate);
				yesterdayEnd.setHours(23, 59, 59, 999);
				return deletedOrders.filter((order) => {
					const orderDate = new Date(order.created_at || order.date);
					return orderDate >= startDate && orderDate <= yesterdayEnd;
				});
			case '7':
				startDate.setDate(now.getDate() - 7);
				break;
			case '30':
				startDate.setDate(now.getDate() - 30);
				break;
			case '90':
				startDate.setDate(now.getDate() - 90);
				break;
			case 'this_month':
				startDate = new Date(now.getFullYear(), now.getMonth(), 1);
				break;
			case 'last_month':
				startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
				return deletedOrders.filter((order) => {
					const orderDate = new Date(order.created_at || order.date);
					return orderDate >= startDate && orderDate <= lastMonthEnd;
				});
			case 'this_year':
				startDate = new Date(now.getFullYear(), 0, 1);
				break;
			default:
				return deletedOrders;
		}

		return deletedOrders.filter((order) => {
			const orderDate = new Date(order.created_at || order.date);
			return orderDate >= startDate;
		});
	});

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
			case 'order_restored':
				return 'bg-yellow-100';
			default:
				return 'bg-gray-100';
		}
	}

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
			case 'order_restored':
				return 'text-yellow-600';
			default:
				return 'text-gray-600';
		}
	}

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

	async function loadDashboardData() {
		try {
			console.log('🔄 Loading dashboard data...');

			const [statsResponse, salesResponse, activitiesResponse, ordersResponse] = await Promise.all([
				fetch('/api/dashboard/stats').then((r) => r.json()),
				fetch(`/api/dashboard/sales?range=${salesFilter}`).then((r) => r.json()),
				fetch('/api/dashboard/activities').then((r) => r.json()),
				fetch('/api/dashboard/orders?limit=50&showDeleted=false').then((r) => r.json()) // Increased limit for filtering
			]);

			console.log('✅ Data loaded successfully');

			stats = statsResponse as Stats;
			salesData = salesResponse as SalesData[];
			recentActivities = activitiesResponse as Activity[];

			// Transform orders to include created_at for filtering
			const ordersData = (ordersResponse as { data: Order[] }).data || [];
			recentOrders = ordersData.map((order) => ({
				...order,
				created_at: order.created_at || order.date // Fallback to date if created_at doesn't exist
			}));

			await loadDeletedOrders();
		} catch (error) {
			console.error('❌ Dashboard load error:', error);
			stats = {
				totalUsers: 0,
				totalOrders: 0,
				totalRevenue: 0,
				totalProducts: 0,
				totalDeletedOrders: 0
			};
			salesData = getSampleSalesData(salesFilter);
			recentActivities = [];
			recentOrders = [];
			deletedOrders = [];
		} finally {
			loading = false;
		}
	}

	async function loadDeletedOrders() {
		try {
			const response = await fetch('/api/dashboard/orders?limit=100&showDeleted=true');
			if (response.ok) {
				const data = await response.json();
				const ordersData = data.data || [];
				deletedOrders = ordersData.map((order) => ({
					...order,
					created_at: order.created_at || order.date // Fallback to date if created_at doesn't exist
				}));
			}
		} catch (error) {
			console.error('Error loading deleted orders:', error);
			deletedOrders = [];
		}
	}

	function toggleOrdersView() {
		activeTab = activeTab === 'active' ? 'deleted' : 'active';
	}

	async function handleSalesFilterChange(newFilter: string) {
		console.log('🔄 Changing sales filter to:', newFilter);
		salesFilter = newFilter;
		await loadSalesData();
	}

	// Handle orders filter change
	async function handleOrdersFilterChange(newFilter: string) {
		console.log('🔄 Changing orders filter to:', newFilter);
		ordersFilter = newFilter;
		// No need to reload data, filtering is done client-side with derived store
	}

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
				const orderIndex = recentOrders.findIndex((order) => order.originalId === orderId);
				if (orderIndex !== -1) {
					recentOrders[orderIndex].status = newStatus;
					recentOrders[orderIndex].statusColor = getStatusColor(newStatus);
				}
				await loadDashboardData();
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

	async function softDeleteOrder(orderId: string) {
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
				const deletedOrder = recentOrders.find((order) => order.originalId === orderId);
				if (deletedOrder) {
					deletedOrder.deleted_at = new Date().toISOString();
					deletedOrders = [deletedOrder, ...deletedOrders];
					recentOrders = recentOrders.filter((order) => order.originalId !== orderId);
				}
				await loadDashboardData();
				alert('Order moved to trash successfully');
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

	async function restoreOrder(orderId: string) {
		try {
			const response = await fetch('/api/dashboard/orders/restore', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					orderId
				})
			});

			if (response.ok) {
				const restoredOrder = deletedOrders.find((order) => order.originalId === orderId);
				if (restoredOrder) {
					restoredOrder.deleted_at = null;
					recentOrders = [restoredOrder, ...recentOrders];
					deletedOrders = deletedOrders.filter((order) => order.originalId !== orderId);
				}
				await loadDashboardData();
				alert('Order restored successfully');
			} else {
				const errorData = await response.json();
				alert(errorData.error || 'Failed to restore order');
			}
		} catch (error) {
			console.error('Error restoring order:', error);
			alert('Error restoring order');
		} finally {
			restoringOrderId = null;
		}
	}

	function confirmDelete(orderId: string) {
		deletingOrderId = orderId;
	}

	function cancelDelete() {
		deletingOrderId = null;
	}

	function confirmRestore(orderId: string) {
		restoringOrderId = orderId;
	}

	function cancelRestore() {
		restoringOrderId = null;
	}

	function viewComments(order: Order) {
		viewingCommentsOrder = order;
	}

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			Pending: 'bg-yellow-100 text-yellow-800',
			Processing: 'bg-blue-100 text-blue-800',
			Completed: 'bg-green-100 text-green-800',
			Cancelled: 'bg-red-100 text-red-800',
			Shipped: 'bg-purple-100 text-purple-800',
			Failed: 'bg-gray-100 text-gray-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	// Export data to Excel
	async function exportToExcel(dataType: string) {
		try {
			exportLoading = true;
			exportType = dataType;

			console.log(`📤 Exporting ${dataType} data...`);

			// Prepare filters based on current view
			const filters = {
				timeFilter: ordersFilter, // Use current orders filter
				status: 'all' // You can add status filter later if needed
			};

			const response = await fetch('/api/dashboard/export', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					dataType,
					filters
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				// Convert base64 to blob
				const byteCharacters = atob(result.data);
				const byteNumbers = new Array(byteCharacters.length);
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], { type: result.mimeType });

				// Create download link
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = result.fileName;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);

				console.log('✅ Export completed:', result.fileName);
				alert(
					`✅ ${dataType.charAt(0).toUpperCase() + dataType.slice(1)} data exported successfully!`
				);
			} else {
				console.error('❌ Export failed:', result);
				alert(`Export failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('💥 Export error:', error);
			alert(`Export error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			exportLoading = false;
			exportType = null;
			showExportMenu = false;
		}
	}

	// Close export menu when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (showExportMenu && !target.closest('.export-menu')) {
			showExportMenu = false;
		}
	}

	onMount(async () => {
		await loadUserData();
		await loadDashboardData();

		// Add click outside listener
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
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
			<!-- Stats Cards -->
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
						<h3 class="text-sm font-medium text-gray-600">Deleted Orders</h3>
						<span class="text-2xl font-bold text-gray-900">{stats.totalDeletedOrders}</span>
					</div>
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
						<Archive class="h-6 w-6 text-red-600" />
					</div>
				</div>
			</div>

			<!-- Export Controls -->
			<div class="rounded-lg border bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-800">Data Export</h2>
					<div class="export-menu relative">
						<button
							onclick={() => (showExportMenu = !showExportMenu)}
							disabled={exportLoading}
							class="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if exportLoading}
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
								></div>
								<span>Exporting {exportType}...</span>
							{:else}
								<Download class="h-4 w-4" />
								<span>Export Data</span>
							{/if}
						</button>

						{#if showExportMenu && !exportLoading}
							<div
								class="absolute top-full right-0 z-20 mt-2 w-56 rounded-lg border bg-white p-2 shadow-lg"
							>
								<div class="space-y-1">
									<button
										onclick={() => exportToExcel('orders')}
										class="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
									>
										<ShoppingCart class="h-4 w-4 text-blue-500" />
										<div class="flex-1">
											<p class="font-medium">Export Orders</p>
											<p class="text-xs text-gray-500">All order data with details</p>
										</div>
									</button>

									<button
										onclick={() => exportToExcel('sales')}
										class="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-green-50 hover:text-green-600"
									>
										<TrendingUp class="h-4 w-4 text-green-500" />
										<div class="flex-1">
											<p class="font-medium">Export Sales Report</p>
											<p class="text-xs text-gray-500">Sales data by date</p>
										</div>
									</button>

									<button
										onclick={() => exportToExcel('products')}
										class="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
									>
										<Package class="h-4 w-4 text-orange-500" />
										<div class="flex-1">
											<p class="font-medium">Export Products</p>
											<p class="text-xs text-gray-500">Product inventory data</p>
										</div>
									</button>

									<button
										onclick={() => exportToExcel('customers')}
										class="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-600"
									>
										<Users class="h-4 w-4 text-purple-500" />
										<div class="flex-1">
											<p class="font-medium">Export Customers</p>
											<p class="text-xs text-gray-500">Customer information</p>
										</div>
									</button>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
						<div class="flex items-center gap-3">
							<div class="rounded-lg bg-blue-100 p-2">
								<ShoppingCart class="h-6 w-6 text-blue-600" />
							</div>
							<div>
								<p class="text-sm font-medium text-blue-800">Orders Data</p>
								<p class="text-xs text-blue-600">Includes all order details</p>
							</div>
						</div>
					</div>

					<div class="rounded-lg border border-green-200 bg-green-50 p-4">
						<div class="flex items-center gap-3">
							<div class="rounded-lg bg-green-100 p-2">
								<TrendingUp class="h-6 w-6 text-green-600" />
							</div>
							<div>
								<p class="text-sm font-medium text-green-800">Sales Report</p>
								<p class="text-xs text-green-600">Daily sales analytics</p>
							</div>
						</div>
					</div>

					<div class="rounded-lg border border-orange-200 bg-orange-50 p-4">
						<div class="flex items-center gap-3">
							<div class="rounded-lg bg-orange-100 p-2">
								<Package class="h-6 w-6 text-orange-600" />
							</div>
							<div>
								<p class="text-sm font-medium text-orange-800">Products</p>
								<p class="text-xs text-orange-600">Inventory & stock data</p>
							</div>
						</div>
					</div>

					<div class="rounded-lg border border-purple-200 bg-purple-50 p-4">
						<div class="flex items-center gap-3">
							<div class="rounded-lg bg-purple-100 p-2">
								<Users class="h-6 w-6 text-purple-600" />
							</div>
							<div>
								<p class="text-sm font-medium text-purple-800">Customers</p>
								<p class="text-xs text-purple-600">Customer profiles & history</p>
							</div>
						</div>
					</div>
				</div>

				<div class="mt-4 rounded-lg bg-gray-50 p-4">
					<span class="font-medium">Export Tip:</span> Data is filtered based on your current view settings.
					Use the time filters above to export specific date ranges.
				</div>
			</div>

			<!-- Sales Overview and Recent Activities -->
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<!-- Sales Overview -->
				<div class="rounded-lg border bg-white p-6 shadow-sm">
					<div class="mb-6 flex items-center justify-between">
						<h2 class="text-lg font-semibold text-gray-800">Sales Overview</h2>

						<div class="flex items-center gap-2">
							<div class="flex gap-2">
								{#each salesFilterOptions as filter}
									<button
										onclick={() => handleSalesFilterChange(filter.value)}
										class="rounded-lg px-3 py-1 text-sm font-medium transition-all {salesFilter ===
										filter.value
											? 'bg-blue-500 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
									>
										{filter.label}
									</button>
								{/each}
							</div>
							<button
								onclick={() => exportToExcel('sales')}
								disabled={exportLoading && exportType === 'sales'}
								class="flex items-center gap-2 rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white transition-all hover:bg-green-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
								title="Export Sales Report"
							>
								{#if exportLoading && exportType === 'sales'}
									<div
										class="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"
									></div>
								{:else}
									<Download class="h-3 w-3" />
								{/if}
								<span class="hidden sm:inline">Export</span>
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

				<!-- Recent Activities -->
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

			<!-- Orders Section with Tabs -->
			<div class="rounded-lg border bg-white p-6 shadow-sm">
				<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<h2 class="text-lg font-semibold text-gray-800">
						{activeTab === 'active' ? 'Recent Orders' : 'Deleted Orders'}
						<span class="ml-2 text-sm font-normal text-gray-500">
							({activeTab === 'active' ? filteredRecentOrders.length : filteredDeletedOrders.length}
							orders)
						</span>
					</h2>
					<div class="flex flex-wrap gap-3">
						<!-- Orders Time Filter -->
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium text-gray-600">Filter by:</span>
							<div class="flex flex-wrap gap-1">
								{#each ordersFilterOptions.slice(0, 4) as filter}
									<button
										onclick={() => handleOrdersFilterChange(filter.value)}
										class="rounded-lg px-3 py-1 text-xs font-medium transition-all sm:text-sm {ordersFilter ===
										filter.value
											? 'bg-blue-500 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
									>
										{filter.label}
									</button>
								{/each}

								<!-- Dropdown for additional filters -->
								<div class="relative">
									<button
										onclick={() => {
											const dropdown = document.getElementById('moreFilters');
											if (dropdown) dropdown.classList.toggle('hidden');
										}}
										class="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 sm:text-sm"
									>
										More...
									</button>
									<div
										id="moreFilters"
										class="absolute top-full right-0 z-10 mt-1 hidden w-48 rounded-lg border bg-white p-2 shadow-lg"
									>
										{#each ordersFilterOptions.slice(4) as filter}
											<button
												onclick={() => {
													handleOrdersFilterChange(filter.value);
													const dropdown = document.getElementById('moreFilters');
													if (dropdown) dropdown.classList.add('hidden');
												}}
												class="block w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 {ordersFilter ===
												filter.value
													? 'bg-blue-50 text-blue-600'
													: ''}"
											>
												{filter.label}
											</button>
										{/each}
									</div>
								</div>
							</div>
						</div>

						<!-- Export and View Toggle Buttons -->
						<div class="flex gap-2">
							<button
								onclick={() => exportToExcel('orders')}
								disabled={exportLoading && exportType === 'orders'}
								class="flex items-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-xs font-medium text-white transition-all hover:bg-green-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
								title="Export Orders to Excel"
							>
								{#if exportLoading && exportType === 'orders'}
									<div
										class="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"
									></div>
								{:else}
									<Download class="h-3 w-3 sm:h-4 sm:w-4" />
								{/if}
								<span class="hidden sm:inline">Export</span>
							</button>

							<button
								onclick={toggleOrdersView}
								class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all {activeTab ===
								'deleted'
									? 'bg-green-500 text-white hover:bg-green-600'
									: 'bg-blue-500 text-white hover:bg-blue-600'}"
							>
								{#if activeTab === 'active'}
									<Archive class="h-4 w-4" />
									View Deleted ({stats.totalDeletedOrders})
								{:else}
									<Refresh class="h-4 w-4" />
									View Active
								{/if}
							</button>
						</div>
					</div>
				</div>

				<!-- Active Orders Filter Status -->
				{#if activeTab === 'active' && ordersFilter !== 'all'}
					<div class="mb-4 rounded-lg bg-blue-50 p-3">
						<p class="text-sm text-blue-700">
							📅 Showing orders from: <span class="font-semibold">{ordersFilterContent}</span>
							<span class="ml-2 text-xs text-blue-600">
								({filteredRecentOrders.length} of {recentOrders.length} total orders)
							</span>
						</p>
					</div>
				{/if}

				<!-- Deleted Orders Filter Status -->
				{#if activeTab === 'deleted' && ordersFilter !== 'all'}
					<div class="mb-4 rounded-lg bg-red-50 p-3">
						<p class="text-sm text-red-700">
							📅 Showing deleted orders from: <span class="font-semibold"
								>{ordersFilterContent}</span
							>
							<span class="ml-2 text-xs text-red-600">
								({filteredDeletedOrders.length} of {deletedOrders.length} total deleted orders)
							</span>
						</p>
					</div>
				{/if}

				<!-- Active Orders Table -->
				{#if activeTab === 'active'}
					{#if filteredRecentOrders.length > 0}
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead>
									<tr class="border-b bg-gray-50">
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">ORDER ID</th
										>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">CUSTOMER</th
										>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">EMAIL</th>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">PHONE</th>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">ADDRESS</th>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">COMMENTS</th
										>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">AMOUNT</th>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">STATUS</th>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">DATE</th>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">ACTIONS</th>
									</tr>
								</thead>
								<tbody class="divide-y">
									{#each filteredRecentOrders as order}
										<tr class="transition-colors hover:bg-gray-50">
											<td class="px-4 py-4 text-sm font-medium text-gray-900">{order.id}</td>
											<td class="px-4 py-4 text-sm text-gray-700">{order.customer}</td>
											<td class="px-4 py-4 text-sm text-blue-600">{order.email}</td>
											<td class="px-4 py-4 text-sm text-gray-700">{order.phone}</td>
											<td class="max-w-xs truncate px-4 py-4 text-sm text-gray-700"
												>{order.address}</td
											>
											<td class="max-w-xs truncate px-4 py-4 text-sm text-gray-700">
												{#if order.comments && order.comments.trim() !== ''}
													{order.comments}
												{:else}
													<span class="text-gray-400 italic">No comments</span>
												{/if}
											</td>
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
														<option value="Processing">Processing</option>
														<option value="Completed">Completed</option>
														<option value="Cancelled">Cancelled</option>
														<option value="Shipped">Shipped</option>
														<option value="Failed">Failed</option>
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
															class="cursor-pointer rounded bg-green-500 p-1 text-white transition-colors hover:bg-green-600 active:scale-95"
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
													{:else}
														<button
															onclick={() => viewComments(order)}
															class="cursor-pointer rounded bg-blue-500 p-1 text-white transition-colors hover:bg-blue-600 active:scale-95"
															title="View Full Details"
														>
															<Message class="h-4 w-4" />
														</button>
														<button
															onclick={() => {
																editingOrderId = order.originalId;
																selectedStatus = order.status;
															}}
															class="cursor-pointer rounded bg-yellow-500 p-1 text-white transition-colors hover:bg-yellow-600 active:scale-95"
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
							<p class="text-gray-500">
								{#if ordersFilter === 'all'}
									No active orders
								{:else}
									No orders found for <span class="font-semibold">{ordersFilterContent}</span>
								{/if}
							</p>
						</div>
					{/if}
				{:else}
					<!-- Deleted Orders Table -->
					{#if filteredDeletedOrders.length > 0}
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead>
									<tr class="border-b bg-gray-50">
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">ORDER ID</th
										>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">CUSTOMER</th
										>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">EMAIL</th>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">ADDRESS</th>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">COMMENTS</th
										>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">AMOUNT</th>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">STATUS</th>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
											>DELETED ON</th
										>
										<th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">ACTIONS</th>
									</tr>
								</thead>
								<tbody class="divide-y">
									{#each filteredDeletedOrders as order}
										<tr class="transition-colors hover:bg-gray-50">
											<td class="px-4 py-4 text-sm font-medium text-gray-900">{order.id}</td>
											<td class="px-4 py-4 text-sm text-gray-700">{order.customer}</td>
											<td class="px-4 py-4 text-sm text-blue-600">{order.email}</td>
											<td class="max-w-xs truncate px-4 py-4 text-sm text-gray-700"
												>{order.address}</td
											>
											<td class="max-w-xs truncate px-4 py-4 text-sm text-gray-700">
												{#if order.comments && order.comments.trim() !== ''}
													{order.comments}
												{:else}
													<span class="text-gray-400 italic">No comments</span>
												{/if}
											</td>
											<td class="px-4 py-4 text-sm font-semibold text-gray-900"
												>₱{order.amount.toFixed(2)}</td
											>
											<td class="px-4 py-4">
												<span
													class="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
												>
													{order.status}
												</span>
											</td>
											<td class="px-4 py-4 text-sm text-gray-600">
												{#if order.deleted_at}
													{new Date(order.deleted_at).toLocaleDateString()}
												{/if}
											</td>
											<td class="px-4 py-4">
												<div class="flex gap-2">
													<button
														onclick={() => viewComments(order)}
														class="cursor-pointer rounded bg-blue-500 p-1 text-white transition-colors hover:bg-blue-600 active:scale-95"
														title="View Full Details"
													>
														<Message class="h-4 w-4" />
													</button>
													<button
														onclick={() => confirmRestore(order.originalId)}
														class="cursor-pointer rounded bg-green-500 p-1 text-white transition-colors hover:bg-green-600 active:scale-95"
														title="Restore Order"
													>
														<Refresh class="h-4 w-4" />
													</button>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="py-8 text-center">
							<p class="text-gray-500">
								{#if ordersFilter === 'all'}
									No deleted orders
								{:else}
									No deleted orders found for <span class="font-semibold"
										>{ordersFilterContent}</span
									>
								{/if}
							</p>
						</div>
					{/if}
				{/if}
			</div>
		{/if}

		<!-- Delete Confirmation Modal -->
		{#if deletingOrderId}
			<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
				<div class="mx-4 max-w-md rounded-lg bg-white p-6">
					<h3 class="mb-2 text-lg font-semibold text-gray-800">Move to Trash</h3>
					<p class="mb-4 text-gray-600">
						Are you sure you want to move this order to trash? You can restore it later.
					</p>
					<div class="flex justify-end gap-3">
						<button
							onclick={cancelDelete}
							class="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 active:scale-95"
						>
							Cancel
						</button>
						<button
							onclick={() => softDeleteOrder(deletingOrderId!)}
							class="cursor-pointer rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 active:scale-95"
						>
							Move to Trash
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Restore Confirmation Modal -->
		{#if restoringOrderId}
			<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
				<div class="mx-4 max-w-md rounded-lg bg-white p-6">
					<h3 class="mb-2 text-lg font-semibold text-gray-800">Restore Order</h3>
					<p class="mb-4 text-gray-600">
						Are you sure you want to restore this order? It will be moved back to active orders.
					</p>
					<div class="flex justify-end gap-3">
						<button
							onclick={cancelRestore}
							class="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 active:scale-95"
						>
							Cancel
						</button>
						<button
							onclick={() => restoreOrder(restoringOrderId!)}
							class="cursor-pointer rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 active:scale-95"
						>
							Restore Order
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Comments/Details View Modal -->
		{#if viewingCommentsOrder}
			<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
				<div class="mx-4 max-w-2xl rounded-lg bg-white p-6">
					<div class="mb-4 flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-800">
							Order Details - {viewingCommentsOrder.id}
						</h3>
						<button
							onclick={() => (viewingCommentsOrder = null)}
							class="rounded-full p-1 hover:bg-gray-100"
						>
							<IconX class="h-5 w-5 text-gray-500" />
						</button>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="space-y-3">
							<div>
								<span class="text-sm font-medium text-gray-600">Customer Name:</span>
								<p class="text-gray-900">{viewingCommentsOrder.customer}</p>
							</div>
							<div>
								<span class="text-sm font-medium text-gray-600">Email:</span>
								<p class="text-gray-900">{viewingCommentsOrder.email}</p>
							</div>
							<div>
								<span class="text-sm font-medium text-gray-600">Phone:</span>
								<p class="text-gray-900">{viewingCommentsOrder.phone}</p>
							</div>
							<div>
								<span class="text-sm font-medium text-gray-600">Address:</span>
								<p class="text-gray-900">{viewingCommentsOrder.address}</p>
							</div>
						</div>
						<div class="space-y-3">
							<div>
								<span class="text-sm font-medium text-gray-600">Amount:</span>
								<p class="text-lg font-bold text-green-600">
									₱{viewingCommentsOrder.amount.toFixed(2)}
								</p>
							</div>
							<div>
								<span class="text-sm font-medium text-gray-600">Status:</span>
								<span
									class="inline-flex rounded-full px-3 py-1 text-xs font-medium {viewingCommentsOrder.statusColor}"
								>
									{viewingCommentsOrder.status}
								</span>
							</div>
							<div>
								<span class="text-sm font-medium text-gray-600">Order Date:</span>
								<p class="text-gray-900">{viewingCommentsOrder.date}</p>
							</div>
							{#if viewingCommentsOrder.deleted_at}
								<div>
									<span class="text-sm font-medium text-gray-600">Deleted On:</span>
									<p class="text-gray-900">
										{new Date(viewingCommentsOrder.deleted_at).toLocaleDateString()}
									</p>
								</div>
							{/if}
						</div>
					</div>

					<div class="mt-6">
						<h4 class="mb-2 text-sm font-medium text-gray-600">Customer Comments/Suggestions:</h4>
						<div class="rounded-lg bg-gray-50 p-4">
							{#if viewingCommentsOrder.comments && viewingCommentsOrder.comments.trim() !== ''}
								<p class="whitespace-pre-wrap text-gray-700">{viewingCommentsOrder.comments}</p>
							{:else}
								<p class="text-gray-400 italic">No comments provided by customer</p>
							{/if}
						</div>
					</div>

					<div class="mt-6 flex justify-end">
						<button
							onclick={() => (viewingCommentsOrder = null)}
							class="cursor-pointer rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 active:scale-95"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>
