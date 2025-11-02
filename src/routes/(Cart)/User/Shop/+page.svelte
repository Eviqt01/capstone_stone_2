<script lang="ts">
	import { onMount } from 'svelte';
	import ShoppingCart from '@tabler/icons-svelte/icons/shopping-cart';
	import Button from '$lib/components/ui/button/button.svelte';
	import X from '@tabler/icons-svelte/icons/x';
	import Input from '$lib/components/ui/input/input.svelte';
	import { IconSearch } from '@tabler/icons-svelte';
	import { ModeWatcher } from 'mode-watcher';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';

	let { children } = $props();

	interface Product {
		id: number;
		name: string;
		price: number;
		image: string;
		category: string;
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
	let paymentMethod = $state('EWALLET');

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

	onMount(async () => {
		try {
			const response = await fetch('/src/routes/(Cart)/products.json');
			if (response.ok) {
				const data = await response.json();
				products = data.map((p: Product) => ({
					...p,
					category: p.category || 'Uncategorized'
				}));
				console.log('Products loaded from JSON:', products);
				return;
			}
		} catch (error) {
			console.warn('Could not load products.json, using fallback data:', error);
		}

		products = [
			{
				id: 1,
				name: 'Facial Tissue Paper',
				price: 30,
				image: '/src/lib/images/Facial-Tissue-Paper.jpg',
				category: 'Home'
			},
			{
				id: 2,
				name: 'Hawk',
				price: 999,
				image: '/src/lib/images/hawk.webp',
				category: 'Bags'
			},
			{
				id: 3,
				name: 'Dark Blue Fade Jeans',
				price: 550,
				image: '/src/lib/images/darkBlueJeans.webp',
				category: 'Clothing'
			},
			{
				id: 4,
				name: 'Air Jordan 1 low',
				price: 2500,
				image: '/src/lib/images/Air-Jordan-1.webp',
				category: 'Shoes'
			},
			{
				id: 5,
				name: 'Wistoria Dress',
				price: 1999,
				image: '/src/lib/images/Wistoria.webp',
				category: 'Clothing'
			},
			{
				id: 6,
				name: 'Programming Book',
				price: 599,
				image: '/src/lib/images/book-placeholder.jpg',
				category: 'Books'
			},
			{
				id: 7,
				name: 'Basketball',
				price: 899,
				image: '/src/lib/images/basketball-placeholder.jpg',
				category: 'Sports'
			},
			{
				id: 8,
				name: 'Laptop Charger',
				price: 1299,
				image: '/src/lib/images/charger-placeholder.jpg',
				category: 'Electronics'
			}
		];
		console.log('Using fallback products:', products);
	});

	const categories = ['All', 'Clothing', 'Shoes', 'Electronics', 'Books', 'Sports', 'Bags', 'Home'];

	const showCart = () => {
		isCartVisible = true;
	};

	const hideCart = () => {
		isCartVisible = false;
	};

	const addToCart = (productId: number) => {
		const product = products.find((p) => p.id === productId);
		if (!product) return;

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

	const removeFromCart = (productId: number) => {
		cart = cart.filter((item) => item.id !== productId);
	};

	const updateQuantity = (productId: number, newQuantity: number) => {
		if (newQuantity <= 0) {
			removeFromCart(productId);
			return;
		}

		const itemIndex = cart.findIndex((item) => item.id === productId);
		if (itemIndex !== -1) {
			cart[itemIndex] = { ...cart[itemIndex], quantity: newQuantity };
		}
	};

	const decreaseQuantity = (productId: number) => {
		const item = cart.find((item) => item.id === productId);
		if (item) {
			updateQuantity(productId, item.quantity - 1);
		}
	};

	const increaseQuantity = (productId: number) => {
		const item = cart.find((item) => item.id === productId);
		if (item) {
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
	};

	const processPayment = async () => {
		if (!customerName || !customerEmail || !customerPhone) {
			alert('Please fill in all customer details');
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
					phone: customerPhone
				},
				items: cart.map((item) => ({
					id: item.id,
					name: item.name,
					price: item.price,
					quantity: item.quantity,
					category: item.category
				})),
				paymentMethod: paymentMethod,
				successUrl: window.location.origin + '/payment-success',
				failureUrl: window.location.origin + '/payment-failed'
			};

			const response = await fetch('/api/create-payment', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(orderData)
			});

			const data = await response.json();

			if (data.success && data.paymentUrl) {
				window.location.href = data.paymentUrl;
			} else {
				throw new Error(data.error || 'Payment creation failed');
			}
		} catch (error) {
			console.error('Payment error:', error);
			alert('Payment failed. Please try again.');
			isProcessingPayment = false;
		}
	};
</script>

<nav
	class="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 shadow-sm backdrop-blur-md"
>
	<h1 class=" text-2xl font-bold">Product Store</h1>

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
						<span
							class="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-blue-600 shadow-md backdrop-blur-sm dark:bg-gray-900/90 dark:text-blue-400"
						>
							{product.category}
						</span>
					</div>
					<div class="flex flex-1 flex-col gap-3 p-5">
						<h2 class="line-clamp-2 text-lg font-semibold text-card-foreground">{product.name}</h2>
						<div class="mt-auto flex items-center justify-between">
							<span class="text-2xl font-bold text-blue-600 dark:text-blue-400"
								>₱{product.price.toLocaleString()}</span
							>
						</div>
						<Button
							class="w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 font-semibold shadow-md transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg active:scale-95 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800"
							onclick={() => addToCart(product.id)}
						>
							Add to Cart
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
					<div class="mb-4 space-y-2">
						<div class="flex items-center justify-between text-sm text-muted-foreground">
							<span>Items ({totalItems})</span>
							<span>₱{totalPrice.toLocaleString()}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-lg font-semibold text-foreground">Total:</span>
							<span class="text-2xl font-bold text-blue-600 dark:text-blue-400"
								>₱{totalPrice.toLocaleString()}</span
							>
						</div>
					</div>
					<Button
						disabled={cart.length === 0}
						onclick={proceedToCheckout}
						class="w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 text-lg font-semibold shadow-lg transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800"
					>
						Proceed to Checkout
					</Button>
				{:else}
					<div class="space-y-4">
						<div class="mb-4 flex items-center justify-between border-b pb-3 dark:border-gray-700">
							<h3 class="text-lg font-semibold text-foreground">Checkout</h3>
							<button
								onclick={cancelCheckout}
								class="text-sm text-muted-foreground hover:text-foreground"
							>
								← Back
							</button>
						</div>

						<div class="space-y-3">
							<div>
								<label class="mb-1 block text-sm font-medium text-foreground" for="CustomerName"
									>Full Name</label
								>
								<Input
									type="text"
									bind:value={customerName}
									placeholder="Juan Dela Cruz"
									class="w-full"
									name="CustomerName"
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-foreground" for="CustomerEmail"
									>Email</label
								>
								<Input
									type="email"
									bind:value={customerEmail}
									placeholder="juan@example.com"
									class="w-full"
									name="CustomerEmail"
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-foreground" for="Telephone"
									>Phone</label
								>
								<Input
									type="tel"
									bind:value={customerPhone}
									placeholder="+63 912 345 6789"
									class="w-full"
									name="Telephone"
								/>
							</div>

							<div>
								<span class="mb-2 block text-sm font-medium text-foreground">Payment Method</span>
								<div class="space-y-2">
									<Button
										onclick={() => (paymentMethod = 'EWALLET')}
										class="flex w-full items-center justify-between rounded-lg border-2 p-3 transition-all {paymentMethod ===
										'EWALLET'
											? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
											: 'border-gray-200 bg-background dark:border-gray-700'}"
									>
										<span class="font-medium text-foreground">E-Wallet (GCash, PayMaya)</span>
										{#if paymentMethod === 'EWALLET'}
											<span class="text-blue-600 dark:text-blue-400">✓</span>
										{/if}
									</Button>

									<Button
										onclick={() => (paymentMethod = 'VIRTUAL_ACCOUNT')}
										class="flex w-full items-center justify-between rounded-lg border-2 p-3 transition-all {paymentMethod ===
										'VIRTUAL_ACCOUNT'
											? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
											: 'border-gray-200 bg-background dark:border-gray-700'}"
									>
										<span class="font-medium text-foreground">Bank Transfer</span>
										{#if paymentMethod === 'VIRTUAL_ACCOUNT'}
											<span class="text-blue-600 dark:text-blue-400">✓</span>
										{/if}
									</Button>

									<Button
										onclick={() => (paymentMethod = 'CREDIT_CARD')}
										class="flex w-full items-center justify-between rounded-lg border-2 p-3 transition-all {paymentMethod ===
										'CREDIT_CARD'
											? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
											: 'border-gray-200 bg-background dark:border-gray-700'}"
									>
										<span class="font-medium text-foreground">Credit/Debit Card</span>
										{#if paymentMethod === 'CREDIT_CARD'}
											<span class="text-blue-600 dark:text-blue-400">✓</span>
										{/if}
									</Button>
								</div>
							</div>
						</div>

						<div class="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
							<div class="flex items-center justify-between text-sm">
								<span class="font-medium text-foreground">Total:</span>
								<span class="text-xl font-bold text-blue-600 dark:text-blue-400"
									>₱{totalPrice.toLocaleString()}</span
								>
							</div>
						</div>

						<Button
							onclick={processPayment}
							disabled={isProcessingPayment}
							class="w-full cursor-pointer rounded-xl bg-gradient-to-r from-green-500 to-green-600 py-4 text-lg font-semibold shadow-lg transition-all hover:from-green-600 hover:to-green-700 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
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
