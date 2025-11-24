<script lang="ts">
	import { onMount } from 'svelte';
	import ShoppingCart from '@tabler/icons-svelte/icons/shopping-cart';
	import Button from '$lib/components/ui/button/button.svelte';
	import Menu_2 from '@tabler/icons-svelte/icons/menu-2';
	import Report from '@tabler/icons-svelte/icons/report';
	import IconX from '@tabler/icons-svelte/icons/x';
	import X from '@tabler/icons-svelte/icons/x';
	import CornerUpLeft from '@tabler/icons-svelte/icons/corner-up-left';
	import Input from '$lib/components/ui/input/input.svelte';
	import { IconSearch } from '@tabler/icons-svelte';
	import { ModeWatcher } from 'mode-watcher';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';

	let { children } = $props();

	let MenuOpen = $state(false);
	let userEmail = $state('');
	let userRole = $state('');

	const handleMenuClick = (event: Event) => {
		event?.stopPropagation();
		MenuOpen = !MenuOpen;
	};

	const menuItems = [
		{
			label: 'Shop',
			href: '/User/Shop',
			image: ShoppingCart
		},
		{
			label: 'Report',
			href: '/User/Report',
			image: Report
		},
		{
			label: 'Log Out',
			href: '/',
			image: CornerUpLeft,
			action: async () => {
				try {
					const response = await fetch('/api/auth/logout', {
						method: 'POST'
					});

					if (response.ok) {
						sessionStorage.clear();

						window.location.href = '/login';
					}
				} catch (error) {
					console.error('Logout error:', error);
					sessionStorage.clear();
					window.location.href = '/login';
				}
			}
		}
	];

	interface Product {
		id: string;
		name: string;
		price: number;
		image: string;
		category: string;
		stock: number;
	}

	interface CartItem extends Product {
		quantity: number;
	}

	let products: Product[] = $state([]);
	let cart: CartItem[] = $state([]);
	let isCartVisible = $state(false);
	let searchQuery = $state('');
	let selectedCategory = $state('All');
	let isProcessingPayment = $state(false);
	let showCheckoutForm = $state(false);

	let customerName = $state('');
	let customerEmail = $state('');
	let customerPhone = $state('');
	let customerAddress = $state('');
	let paymentMethod = $state('GCASH');

	const totalItems = $derived(cart.reduce((sum, item) => sum + item.quantity, 0));
	const totalPrice = $derived(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));

	const filteredProducts = $derived.by(() => {
		let filtered = products;

		if (selectedCategory !== 'All') {
			filtered = filtered.filter((p) => p.category === selectedCategory);
		}

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
			);
		}

		return filtered;
	});

	// Function to load user data
	async function loadUserData() {
		try {
			console.log('🔄 Loading user data...');

			// First try to get from API (most reliable)
			const response = await fetch('/api/auth/user');
			if (response.ok) {
				const userData = await response.json();
				userEmail = userData.email || '';
				userRole = userData.role || '';

				// Update session storage with fresh data
				if (userEmail) {
					sessionStorage.setItem('userEmail', userEmail);
					sessionStorage.setItem('userRole', userRole);
					console.log('✅ User data loaded from API:', userEmail);
				} else {
					// If no user data from API, try session storage as fallback
					userEmail = sessionStorage.getItem('userEmail') || '';
					userRole = sessionStorage.getItem('userRole') || '';
					console.log('⚠️ Using session storage fallback:', userEmail);
				}
			} else {
				// Fallback to session storage if API fails
				userEmail = sessionStorage.getItem('userEmail') || '';
				userRole = sessionStorage.getItem('userRole') || '';
				console.log('⚠️ API failed, using session storage:', userEmail);
			}
		} catch (error) {
			console.error('❌ Error loading user data:', error);
			// Final fallback to session storage
			userEmail = sessionStorage.getItem('userEmail') || '';
			userRole = sessionStorage.getItem('userRole') || '';
		}
	}

	onMount(async () => {
		// Load user data first
		await loadUserData();

		// Then load products
		try {
			const response = await fetch('/api/products');
			if (response.ok) {
				const data = await response.json();
				products = data.products;
				console.log('Products loaded from database:', products);
			}
		} catch (error) {
			console.warn('Could not load products from database:', error);
		}

		// Check if returning from payment success
		checkPaymentReturn();
	});

	// Check if returning from payment
	function checkPaymentReturn() {
		const urlParams = new URLSearchParams(window.location.search);
		const paymentStatus = urlParams.get('payment_status');
		const orderId = urlParams.get('order_id');

		if (paymentStatus === 'success' || window.location.pathname === '/payment-success') {
			console.log('✅ Returning from successful payment');
			// Clear cart since payment was successful
			clearCart();
			// Remove success parameters from URL
			window.history.replaceState({}, '', '/User/Shop');
		} else if (paymentStatus === 'failed' || window.location.pathname === '/payment-failed') {
			console.log('❌ Returning from failed payment');
			alert('Payment was not completed. Please try again.');
			window.history.replaceState({}, '', '/User/Shop');
		}
	}

	const categories = [
		'All',
		'Guest Amenity Kit',
		'Dental Kit',
		'Soap',
		'Shampoo',
		'Toothbrush',
		'Toothpaste',
		'Hotel Slippers',
		'Bundles'
	];

	const showCart = () => {
		isCartVisible = true;
	};

	const hideCart = () => {
		isCartVisible = false;
	};

	const addToCart = (productId: string) => {
		const product = products.find((p) => p.id === productId);
		if (!product) return;

		if (product.stock <= 0) {
			alert('Sorry, this product is out of stock!');
			return;
		}

		const existingItem = cart.find((item) => item.id === productId);
		const currentCartQty = existingItem ? existingItem.quantity : 0;

		if (currentCartQty >= product.stock) {
			alert(`Sorry, only ${product.stock} items available in stock!`);
			return;
		}

		const existingItemIndex = cart.findIndex((item) => item.id === productId);

		if (existingItemIndex !== -1) {
			cart[existingItemIndex] = {
				...cart[existingItemIndex],
				quantity: cart[existingItemIndex].quantity + 1
			};
		} else {
			cart = [...cart, { ...product, quantity: 1 }];
		}
	};

	const removeFromCart = (productId: string) => {
		cart = cart.filter((item) => item.id !== productId);
	};

	const updateQuantity = (productId: string, newQuantity: number) => {
		if (newQuantity <= 0) {
			removeFromCart(productId);
			return;
		}

		const itemIndex = cart.findIndex((item) => item.id === productId);
		if (itemIndex !== -1) {
			cart[itemIndex] = { ...cart[itemIndex], quantity: newQuantity };
		}
	};

	const decreaseQuantity = (productId: string) => {
		const item = cart.find((item) => item.id === productId);
		if (item) {
			updateQuantity(productId, item.quantity - 1);
		}
	};

	const increaseQuantity = (productId: string) => {
		const item = cart.find((item) => item.id === productId);
		if (item) {
			const product = products.find((p) => p.id === productId);
			if (product && item.quantity >= product.stock) {
				alert(`Sorry, only ${product.stock} items available in stock!`);
				return;
			}
			updateQuantity(productId, item.quantity + 1);
		}
	};

	const clearCart = () => {
		cart = [];
	};

	const selectCategory = (category: string) => {
		selectedCategory = category;
	};

	const proceedToCheckout = () => {
		showCheckoutForm = true;
	};

	const cancelCheckout = () => {
		showCheckoutForm = false;
		customerName = '';
		customerEmail = '';
		customerPhone = '';
		customerAddress = '';
	};

	const processPayment = async () => {
		if (!customerName || !customerEmail || !customerPhone || !customerAddress) {
			alert('Please fill in all customer details including address');
			return;
		}

		if (cart.length === 0) {
			alert('Your cart is empty');
			return;
		}

		isProcessingPayment = true;

		try {
			const orderData = {
				amount: totalPrice,
				currency: 'PHP',
				customer: {
					name: customerName,
					email: customerEmail,
					phone: customerPhone,
					address: customerAddress
				},
				items: cart.map((item) => ({
					id: item.id,
					name: item.name,
					price: item.price,
					quantity: item.quantity,
					category: item.category
				})),
				paymentMethod: paymentMethod,
				successUrl: `${window.location.origin}/payment-success?payment_status=success`,
				failureUrl: `${window.location.origin}/payment-failed?payment_status=failed`
			};

			console.log('🔄 Sending payment request...');

			const response = await fetch('/api/create-payment', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(orderData)
			});

			const data = await response.json();

			if (response.ok && data.success) {
				console.log('✅ Payment created, redirecting to Xendit...');
				console.log('📋 Order status:', data.status);

				window.location.href = data.paymentUrl;
			} else {
				throw new Error(data.error || 'Payment creation failed');
			}
		} catch (error) {
			console.error('💥 Payment error:', error);
			alert(`Payment failed: ${error.message}. Please check your details and try again.`);
		} finally {
			isProcessingPayment = false;
		}
	};
</script>

<nav
	class="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 shadow-sm backdrop-blur-md"
>
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
		<h1 class="text-xl font-bold text-gray-800">Laveona Hotel Supplies</h1>

		{#if userEmail}
			<div class="ml-4 hidden items-center gap-2 rounded-full bg-blue-50 px-3 py-1 sm:flex">
				<div class="h-2 w-2 rounded-full bg-green-500"></div>
				<span class="text-sm font-medium text-blue-700">Welcome, {userEmail.split('@')[0]}</span>
			</div>
		{/if}
	</div>

	<div class="flex items-center gap-3">
		<Button onclick={toggleMode} variant="outline" size="icon" class="cursor-pointer">
			<SunIcon
				class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
			/>
			<MoonIcon
				class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
			/>
			<span class="sr-only">Toggle theme</span>
		</Button>

		{@render children?.()}
		<ModeWatcher />
		<button
			onclick={showCart}
			class="group relative rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
		>
			<ShoppingCart class="size-6 text-white transition-transform group-hover:rotate-12" />
			{#if totalItems > 0}
				<span
					class="absolute -top-1 -right-1 flex h-6 w-6 animate-in items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-600 text-xs font-bold text-white shadow-md ring-2 ring-white zoom-in-50 dark:ring-gray-800"
				>
					{totalItems}
				</span>
			{/if}
		</button>
	</div>
	{#if MenuOpen}
		<section
			class="absolute top-20 left-0 z-10 flex min-h-75 w-120 max-w-60 animate-in flex-col justify-center rounded-sm bg-gray-800 px-1 py-5 duration-300 slide-in-from-left"
		>
			<div class="flex flex-col items-center gap-2 p-2">
				<h1 class="text-xl font-bold text-white">User Panel</h1>
				<hr class="w-full border border-gray-700 bg-gray-800" />
			</div>
			<ul class="mb-auto animate-in duration-300 slide-in-from-left">
				{#each menuItems as MenuItems}
					<li>
						{#if MenuItems.action}
							<button
								onclick={MenuItems.action}
								class="flex w-full cursor-pointer items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
							>
								<MenuItems.image class="mr-3 h-5 w-5" />
								{MenuItems.label}
							</button>
						{:else}
							<a
								href={MenuItems.href}
								class="flex cursor-pointer items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
							>
								<MenuItems.image class="mr-3 h-5 w-5" />
								{MenuItems.label}
							</a>
						{/if}
					</li>
				{/each}
			</ul>

			<div class="absolute right-0 bottom-0 left-0 border-t border-gray-700 bg-gray-800 p-4">
				<div class="flex items-center">
					<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
						<span class="text-sm font-medium text-white">
							{userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
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
								{userRole === 'admin' ? 'Administrator' : 'Customer'}
							{:else}
								User
							{/if}
						</p>
					</div>
				</div>
			</div>
		</section>
	{/if}
</nav>

<section
	class="relative flex min-h-screen flex-col gap-10 bg-gradient-to-br from-gray-50 to-blue-50/30 p-10 dark:from-gray-950 dark:to-blue-950/20"
>
	<div class="mx-auto w-full max-w-7xl flex-col gap-5">
		<div class="mb-6 flex items-center gap-3">
			<div class="relative flex-1">
				<Input
					type="text"
					bind:value={searchQuery}
					class="h-12 rounded-full border-2 bg-background pr-5 pl-12 shadow-sm transition-all focus:border-blue-500 focus:shadow-md dark:border-gray-700"
					placeholder="Search products..."
				/>
				<IconSearch class="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
			</div>
		</div>

		<div class="mb-8 overflow-x-auto pb-2">
			<ul class="flex gap-3">
				{#each categories as category}
					<li>
						<button
							onclick={() => selectCategory(category)}
							class="cursor-pointer rounded-full border-2 px-6 py-2.5 font-medium whitespace-nowrap shadow-sm transition-all duration-300 active:scale-95 {selectedCategory ===
							category
								? 'border-blue-500 bg-blue-500 text-white shadow-md dark:border-blue-600 dark:bg-blue-600'
								: 'border-blue-200 bg-background text-foreground hover:border-blue-500 hover:bg-blue-500 hover:text-white hover:shadow-md dark:border-blue-900 dark:hover:border-blue-600 dark:hover:bg-blue-600'}"
						>
							{category}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<div
		class="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
	>
		{#if filteredProducts.length === 0}
			<div class="col-span-full py-20 text-center">
				<p class="text-2xl font-semibold text-gray-400 dark:text-gray-600">No products found</p>
				<p class="mt-2 text-gray-500 dark:text-gray-500">Try adjusting your search or filter</p>
			</div>
		{:else}
			{#each filteredProducts as product (product.id)}
				<div
					class="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-gray-800"
				>
					<div class="relative overflow-hidden bg-muted">
						<img
							src={product.image}
							class="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-110"
							alt={product.name}
						/>
						<div
							class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
						></div>

						<div class="absolute top-3 right-3 flex flex-col gap-2">
							<span
								class="rounded-full bg-white/90 px-3 py-1 text-center text-xs font-semibold text-blue-600 shadow-md backdrop-blur-sm dark:bg-gray-900/90 dark:text-blue-400"
							>
								{product.category}
							</span>
							<span
								class="rounded-full bg-white/90 px-3 py-1 text-center text-xs font-semibold text-gray-700 shadow-md backdrop-blur-sm dark:bg-gray-900/90 dark:text-gray-300"
							>
								Stock: {product.stock}
							</span>
						</div>

						{#if product.stock === 0}
							<span
								class="absolute top-3 left-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-md"
							>
								Out of Stock
							</span>
						{:else if product.stock <= 10}
							<span
								class="absolute top-3 left-3 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-white shadow-md"
							>
								Only {product.stock} left!
							</span>
						{/if}
					</div>
					<div class="flex flex-1 flex-col gap-3 p-5">
						<h2 class="line-clamp-2 text-lg font-semibold text-card-foreground">{product.name}</h2>
						<div class="mt-auto flex items-center justify-between">
							<span class="text-2xl font-bold text-blue-600 dark:text-blue-400"
								>₱{product.price.toLocaleString()}</span
							>
						</div>
						<Button
							disabled={product.stock === 0}
							class="w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 font-semibold shadow-md transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800"
							onclick={() => addToCart(product.id)}
						>
							{#if product.stock === 0}
								Out of Stock
							{:else}
								Add to Cart
							{/if}
						</Button>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if isCartVisible}
		<button
			onclick={hideCart}
			class="fixed inset-0 z-50 animate-in bg-black/40 backdrop-blur-sm duration-200 fade-in"
			aria-label="Close cart"
		></button>

		<div
			class="fixed top-0 right-0 z-50 flex h-screen w-full max-w-md animate-in flex-col bg-background shadow-2xl duration-300 slide-in-from-right dark:border-l dark:border-gray-800"
		>
			<div
				class="flex items-center justify-between border-b bg-gradient-to-r from-blue-500 to-blue-600 p-6 dark:from-blue-600 dark:to-blue-700"
			>
				<div class="flex items-center gap-3">
					<ShoppingCart class="size-6 text-white" />
					<h2 class="text-2xl font-bold text-white">Cart ({totalItems})</h2>
				</div>
				<button
					onclick={hideCart}
					class="rounded-full bg-white/20 p-2 text-white transition-all hover:bg-white/30 active:scale-95"
				>
					<X class="size-6" />
				</button>
			</div>

			<div class="flex-1 overflow-y-auto p-6">
				{#if cart.length === 0}
					<div class="flex h-full flex-col items-center justify-center text-muted-foreground">
						<ShoppingCart class="mb-4 size-20 opacity-30" />
						<p class="text-lg font-medium">Your cart is empty</p>
						<p class="text-sm">Start adding some products!</p>
					</div>
				{:else}
					<div class="mb-4 flex items-center justify-between">
						<p class="text-sm text-muted-foreground">
							{cart.length}
							{cart.length === 1 ? 'item' : 'items'} in cart
						</p>
						<button
							onclick={clearCart}
							class="text-sm font-medium text-red-600 hover:text-red-700 active:scale-95 dark:text-red-500 dark:hover:text-red-400"
						>
							Clear All
						</button>
					</div>
					<div class="space-y-4">
						{#each cart as item (item.id)}
							<div
								class="group relative overflow-hidden rounded-xl border-2 bg-card p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:hover:border-blue-700"
							>
								<div class="flex gap-4">
									<div class="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
										<img src={item.image} class="h-full w-full object-cover" alt={item.name} />
									</div>
									<div class="flex min-w-0 flex-1 flex-col justify-between">
										<div>
											<h3 class="line-clamp-1 font-semibold text-card-foreground">{item.name}</h3>
											<p class="text-xs text-muted-foreground">{item.category}</p>
											<p class="text-sm text-muted-foreground">
												₱{item.price.toLocaleString()} each
											</p>
										</div>
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-2">
												<button
													onclick={() => decreaseQuantity(item.id)}
													class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-bold text-foreground transition-all hover:bg-blue-500 hover:text-white active:scale-90"
												>
													-
												</button>
												<span class="w-8 text-center font-bold">{item.quantity}</span>
												<button
													onclick={() => increaseQuantity(item.id)}
													class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-bold text-foreground transition-all hover:bg-blue-500 hover:text-white active:scale-90"
												>
													+
												</button>
											</div>
											<button
												onclick={() => removeFromCart(item.id)}
												class="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-all hover:bg-red-500 hover:text-white active:scale-95 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-600"
											>
												Remove
											</button>
										</div>
									</div>
								</div>
								<div class="mt-2 flex justify-end">
									<span class="font-bold text-blue-600 dark:text-blue-400"
										>₱{(item.price * item.quantity).toLocaleString()}</span
									>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="border-t bg-muted/50 p-6 dark:border-gray-800">
				{#if !showCheckoutForm}
					<div class="mb-4 space-y-2 px-2 sm:px-0">
						<div class="flex items-center justify-between text-sm text-muted-foreground">
							<span>Items ({totalItems})</span>
							<span>₱{totalPrice.toLocaleString()}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-base font-semibold text-foreground sm:text-lg">Total:</span>
							<span class="text-xl font-bold text-blue-600 sm:text-2xl dark:text-blue-400"
								>₱{totalPrice.toLocaleString()}</span
							>
						</div>
					</div>
					<Button
						disabled={cart.length === 0}
						onclick={proceedToCheckout}
						class="w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-base font-semibold shadow-lg transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400 sm:py-4 sm:text-lg dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800"
					>
						Proceed to Checkout
					</Button>
				{:else}
					<div class="space-y-4 px-2 sm:px-0">
						<div class="mb-4 flex items-center justify-between border-b pb-3 dark:border-gray-700">
							<h3 class="text-base font-semibold text-foreground sm:text-lg">Checkout</h3>
							<button
								onclick={cancelCheckout}
								class="touch-manipulation text-sm text-muted-foreground hover:text-foreground"
							>
								← Back
							</button>
						</div>

						<div class="space-y-3">
							<div>
								<label class="mb-1 block text-sm font-medium text-foreground" for="customername"
									>Full Name</label
								>
								<Input
									type="text"
									bind:value={customerName}
									placeholder="Juan Dela Cruz"
									class="w-full text-base"
									name="customername"
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-foreground" for="customeremail"
									>Email</label
								>
								<Input
									type="email"
									bind:value={customerEmail}
									placeholder="juan@example.com"
									class="w-full text-base"
									name="customeremail"
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-foreground" for="customerphone"
									>Phone</label
								>
								<Input
									type="tel"
									bind:value={customerPhone}
									placeholder="+63 912 345 6789"
									class="w-full text-base"
									name="customerphone"
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-foreground" for="customeraddress"
									>Home Address</label
								>
								<Input
									type="text"
									bind:value={customerAddress}
									placeholder="123 Main Street, City"
									class="w-full text-base"
									name="customeraddress"
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-foreground" for="paymentmethod"
									>Payment Method</label
								>

								<!-- Mobile: Dropdown Select -->
								<div class="sm:hidden">
									<select
										bind:value={paymentMethod}
										name="paymentmethod"
										class="w-full rounded-lg border-2 border-gray-200 bg-background p-3 text-base font-medium text-foreground transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-700"
									>
										<option value="GCASH">GCash</option>
										<option value="PAYMAYA">Maya</option>
										<option value="GRABPAY">GrabPay</option>
										<option value="SHOPEEPAY">ShopeePay</option>
										<option value="CREDIT_CARD">Credit/Debit Card</option>
									</select>
								</div>

								<!-- Desktop: Button Cards -->
								<div class="hidden space-y-2 sm:block">
									<button
										type="button"
										onclick={() => (paymentMethod = 'GCASH')}
										class="flex w-full touch-manipulation items-center justify-between rounded-lg border-2 p-3 transition-all {paymentMethod ===
										'GCASH'
											? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
											: 'border-gray-200 bg-background dark:border-gray-700'}"
									>
										<span class="font-medium text-foreground">GCash</span>
										{#if paymentMethod === 'GCASH'}
											<span class="text-lg text-blue-600 dark:text-blue-400">✓</span>
										{/if}
									</button>

									<button
										type="button"
										onclick={() => (paymentMethod = 'PAYMAYA')}
										class="flex w-full touch-manipulation items-center justify-between rounded-lg border-2 p-3 transition-all {paymentMethod ===
										'PAYMAYA'
											? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
											: 'border-gray-200 bg-background dark:border-gray-700'}"
									>
										<span class="font-medium text-foreground">Maya</span>
										{#if paymentMethod === 'PAYMAYA'}
											<span class="text-lg text-blue-600 dark:text-blue-400">✓</span>
										{/if}
									</button>

									<button
										type="button"
										onclick={() => (paymentMethod = 'GRABPAY')}
										class="flex w-full touch-manipulation items-center justify-between rounded-lg border-2 p-3 transition-all {paymentMethod ===
										'GRABPAY'
											? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
											: 'border-gray-200 bg-background dark:border-gray-700'}"
									>
										<span class="font-medium text-foreground">GrabPay</span>
										{#if paymentMethod === 'GRABPAY'}
											<span class="text-lg text-blue-600 dark:text-blue-400">✓</span>
										{/if}
									</button>

									<button
										type="button"
										onclick={() => (paymentMethod = 'SHOPEEPAY')}
										class="flex w-full touch-manipulation items-center justify-between rounded-lg border-2 p-3 transition-all {paymentMethod ===
										'SHOPEEPAY'
											? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
											: 'border-gray-200 bg-background dark:border-gray-700'}"
									>
										<span class="font-medium text-foreground">ShopeePay</span>
										{#if paymentMethod === 'SHOPEEPAY'}
											<span class="text-lg text-blue-600 dark:text-blue-400">✓</span>
										{/if}
									</button>

									<button
										type="button"
										onclick={() => (paymentMethod = 'CREDIT_CARD')}
										class="flex w-full touch-manipulation items-center justify-between rounded-lg border-2 p-3 transition-all {paymentMethod ===
										'CREDIT_CARD'
											? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
											: 'border-gray-200 bg-background dark:border-gray-700'}"
									>
										<span class="font-medium text-foreground">Credit/Debit Card</span>
										{#if paymentMethod === 'CREDIT_CARD'}
											<span class="text-lg text-blue-600 dark:text-blue-400">✓</span>
										{/if}
									</button>
								</div>
							</div>
						</div>

						<div class="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
							<div class="flex items-center justify-between text-sm">
								<span class="font-medium text-foreground">Total:</span>
								<span class="text-lg font-bold text-blue-600 sm:text-xl dark:text-blue-400"
									>₱{totalPrice.toLocaleString()}</span
								>
							</div>
						</div>

						<Button
							onclick={processPayment}
							disabled={isProcessingPayment}
							class="w-full cursor-pointer touch-manipulation rounded-xl bg-gradient-to-r from-green-500 to-green-600 py-3 text-base font-semibold shadow-lg transition-all hover:from-green-600 hover:to-green-700 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400 sm:py-4 sm:text-lg"
						>
							{#if isProcessingPayment}
								Processing...
							{:else}
								Pay ₱{totalPrice.toLocaleString()}
							{/if}
						</Button>

						<p class="text-center text-xs text-muted-foreground">🔒 Secured by Xendit</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</section>
