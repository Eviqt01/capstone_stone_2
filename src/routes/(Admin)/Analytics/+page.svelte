<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Menu_2 from '@tabler/icons-svelte/icons/menu-2';
	import IconX from '@tabler/icons-svelte/icons/x';
	import Dashboard from '@tabler/icons-svelte/icons/dashboard';
	import ShoppingCart from '@tabler/icons-svelte/icons/shopping-cart';
	import BrandProducthunt from '@tabler/icons-svelte/icons/brand-producthunt';
	import User from '@tabler/icons-svelte/icons/user';
	import ChartBar from '@tabler/icons-svelte/icons/chart-bar';
	import BuildingWarehouse from '@tabler/icons-svelte/icons/building-warehouse';
	import Report from '@tabler/icons-svelte/icons/report';
	import Settings from '@tabler/icons-svelte/icons/settings';
	import { goto } from '$app/navigation';

	const logout = () => {
		goto('/login');
	};

	let MenuOpen = $state(false);

	const handleMenuClick = (event: Event) => {
		event?.stopPropagation();
	};
</script>

<div class="relative min-h-screen">
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
					<IconX
						class="h-5 w-5 cursor-pointer text-gray-700 duration-300 active:scale-95 dark:text-gray-300"
					/>
				{:else}
					<Menu_2
						class="h-5 w-5 cursor-pointer text-gray-700 duration-300 active:scale-95 dark:text-gray-300"
					/>
				{/if}
			</Button>
			<h1 class="text-xl font-bold">Analytics</h1>
		</div>
		<Button
			class="cursor-pointer bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 active:scale-95"
			onclick={logout}
		>
			Logout
		</Button>
	</nav>

	<main class="relative min-h-screen">
		<div class="p-6">
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<div class="flex items-center gap-4 rounded-lg border bg-white p-6 shadow-sm">
					<div class="flex flex-1 flex-col gap-1">
						<h3 class="text-sm font-medium text-gray-600">Total Users</h3>
						<span class="text-2xl font-bold text-gray-900">1,234</span>
						<span class="flex items-center text-sm text-green-600">
							<span class="mr-1">↗️</span>
							+12% from last month
						</span>
					</div>
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl">
						👥
					</div>
				</div>

				<div class="flex items-center gap-4 rounded-lg border bg-white p-6 shadow-sm">
					<div class="flex flex-1 flex-col gap-1">
						<h3 class="text-sm font-medium text-gray-600">Total Orders</h3>
						<span class="text-2xl font-bold text-gray-900">856</span>
						<span class="flex items-center text-sm text-green-600">
							<span class="mr-1">↗️</span>
							+8% from last month
						</span>
					</div>
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl">
						🛒
					</div>
				</div>

				<div class="flex items-center gap-4 rounded-lg border bg-white p-6 shadow-sm">
					<div class="flex flex-1 flex-col gap-1">
						<h3 class="text-sm font-medium text-gray-600">Revenue</h3>
						<span class="text-2xl font-bold text-gray-900">₱45,678</span>
						<span class="flex items-center text-sm text-green-600">
							<span class="mr-1">↗️</span>
							+15% from last month
						</span>
					</div>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-xl"
					>
						💰
					</div>
				</div>

				<div class="flex items-center gap-4 rounded-lg border bg-white p-6 shadow-sm">
					<div class="flex flex-1 flex-col gap-1">
						<h3 class="text-sm font-medium text-gray-600">Total Products</h3>
						<span class="text-2xl font-bold text-gray-900">342</span>
						<span class="flex items-center text-sm text-red-600">
							<span class="mr-1">↘️</span>
							-2% from last month
						</span>
					</div>
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">
						📦
					</div>
				</div>
			</div>
		</div>

		{#if MenuOpen}
			<section
				class="absolute top-0 flex min-h-screen w-120 max-w-60 animate-in flex-col justify-center rounded-r-sm bg-gray-800 px-1 py-5 duration-300 slide-in-from-left"
			>
				<div class="flex flex-col items-center gap-2 p-2">
					<h1 class="text-xl font-bold text-white">Admin Panel</h1>
					<hr class="w-full border border-gray-700 bg-gray-800" />
				</div>
				<ul class=" mb-auto animate-in duration-300 slide-in-from-left">
					<li>
						<a
							href="/Dashboard"
							class="flex cursor-pointer items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
						>
							<Dashboard class="mr-3"></Dashboard>
							Dashboard
						</a>
					</li>
					<li>
						<a
							href="/Users"
							class="flex cursor-pointer items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
						>
							<User class="mr-3"></User>
							Users
						</a>
					</li>
					<li>
						<a
							href="/Products"
							class="flex cursor-pointer items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
						>
							<BrandProducthunt class="mr-3"></BrandProducthunt>
							Products
						</a>
					</li>
					<li>
						<a
							href="/Orders"
							class="flex cursor-pointer items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
						>
							<ShoppingCart class="mr-3"></ShoppingCart>
							Orders
						</a>
					</li>
					<li>
						<a
							href="/Analytics"
							class="flex cursor-pointer items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
						>
							<ChartBar class="mr-3"></ChartBar>
							Analytics
						</a>
					</li>

					<li>
						<a
							href="/Inventory"
							class="flex cursor-pointer items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
						>
							<BuildingWarehouse class="mr-3"></BuildingWarehouse>
							Inventory
						</a>
					</li>
					<li>
						<a
							href="/Reports"
							class="flex cursor-pointer items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
						>
							<Report class="mr-3"></Report>
							Reports
						</a>
					</li>
					<li>
						<a
							href="/Settings"
							class="flex cursor-pointer items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
						>
							<Settings class="mr-3"></Settings>
							Settings
						</a>
					</li>
				</ul>

				<div class="absolute right-0 bottom-0 left-0 border-t border-gray-700 bg-gray-800 p-4">
					<div class="flex items-center">
						<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-600">
							<span class="text-sm font-medium text-white">A</span>
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-white">Admin User</p>
							<p class="truncate text-xs text-gray-400">jayajyeviota101@gmail.com</p>
						</div>
					</div>
				</div>
			</section>
		{/if}
	</main>
</div>
