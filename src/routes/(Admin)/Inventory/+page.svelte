<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Menu_2 from '@tabler/icons-svelte/icons/menu-2';
	import IconX from '@tabler/icons-svelte/icons/x';
	import Search from '@tabler/icons-svelte/icons/search';
	import * as Select from '$lib/components/ui/select/index.js';
	import Dashboard from '@tabler/icons-svelte/icons/dashboard';
	import Check from '@lucide/svelte/icons/check';
	import AlertTriangle from '@tabler/icons-svelte/icons/alert-triangle';
	import Report from '@tabler/icons-svelte/icons/report';
	import { goto } from '$app/navigation';
	import BrandMinecraft from '@tabler/icons-svelte/icons/brand-minecraft';
	import { onMount } from 'svelte';
	import Upload from '@tabler/icons-svelte/icons/upload';

	interface Product {
		id: string;
		name: string;
		price: number;
		image: string;
		category: string;
		stock: number;
	}

	const logout = () => {
		goto('/login');
	};

	let MenuOpen = $state(false);

	// Add these variables for user data
	let userEmail = $state('');
	let userRole = $state('');

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

	let showAddProductModal = $state(false);
	let products: Product[] = $state([]);
	let searchQuery = $state('');
	let loading = $state(true);

	let newProduct = $state({
		name: '',
		price: '',
		category: '',
		stock: '',
		image: '',
		imageFile: null as File | null
	});

	let imagePreview = $state('');
	let isSubmitting = $state(false);
	let formError = $state('');

	let totalProducts = $derived(products.length);
	let inStockProducts = $derived(products.filter((p) => p.stock > 10).length);
	let lowStockProducts = $derived(products.filter((p) => p.stock > 0 && p.stock <= 10).length);
	let outOfStockProducts = $derived(products.filter((p) => p.stock === 0).length);

	const catergoryValue = [
		{ value: 'All', label: 'All Categories' },
		{ value: 'Clothing', label: 'Clothing' },
		{ value: 'Shoes', label: 'Shoes' },
		{ value: 'Electronics', label: 'Electronics' },
		{ value: 'Books', label: 'Books' },
		{ value: 'Sports', label: 'Sports' },
		{ value: 'Bags', label: 'Bags' },
		{ value: 'Home', label: 'Home' }
	];

	let value = $state('All');

	const triggerContent = $derived(
		catergoryValue.find((f) => f.value === value)?.label ?? 'All Categories'
	);

	const filteredProducts = $derived.by(() => {
		let filtered = products;

		if (value !== 'All') {
			filtered = filtered.filter((p) => p.category === value);
		}

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
			);
		}

		return filtered;
	});

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

	onMount(async () => {
		// Load user data first
		await loadUserData();
		// Then load products
		await loadProducts();
	});

	async function loadProducts() {
		loading = true;
		try {
			const response = await fetch('/api/products');
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					products = data.products;
				} else {
					console.error('API error:', data.error);
				}
			}
		} catch (error) {
			console.warn('Could not load products from database:', error);
		} finally {
			loading = false;
		}
	}

	async function recordActivity(
		message: string,
		type: string = 'product',
		color: string = 'green'
	) {
		try {
			const response = await fetch('/api/activities', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message,
					type,
					color,
					created_at: new Date().toISOString()
				})
			});

			if (!response.ok) {
				console.error('Failed to record activity');
			}
		} catch (error) {
			console.error('Activity recording error:', error);
		}
	}

	const deleteProduct = async (productId: string) => {
		if (!confirm('Are you sure you want to delete this product?')) {
			return;
		}

		try {
			const response = await fetch(`/api/inventory/${productId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				products = products.filter((p) => p.id !== productId);
				console.log('Product deleted successfully');
			} else {
				const data = await response.json();
				alert(data.error || 'Failed to delete product');
				await loadProducts();
			}
		} catch (error) {
			console.error('Delete product error:', error);
			alert('Failed to delete product');
			await loadProducts();
		}
	};

	function openAddProductModal() {
		showAddProductModal = true;
	}

	function closeAddProductModal() {
		showAddProductModal = false;
		resetForm();
	}

	function resetForm() {
		newProduct = {
			name: '',
			price: '',
			category: '',
			stock: '',
			image: '',
			imageFile: null
		};
		imagePreview = '';
		formError = '';
	}

	function handleImageFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			newProduct.imageFile = file;
			newProduct.image = '';

			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function handleImageUrlChange(url: string) {
		newProduct.image = url;
		newProduct.imageFile = null;
		imagePreview = url;
	}

	async function addProduct(event: Event) {
		event.preventDefault();
		formError = '';
		console.log('🔄 Starting add product process...');
		console.log('📸 Image value:', newProduct.image);

		if (!newProduct.name || !newProduct.price || !newProduct.category || !newProduct.stock) {
			formError = 'Please fill in all required fields';
			console.log('❌ Form validation failed - missing basic fields');
			return;
		}

		if (!newProduct.image && !newProduct.imageFile) {
			formError = 'Please provide an image URL or upload an image file';
			console.log('❌ No image provided');
			return;
		}

		if (newProduct.imageFile && !newProduct.image) {
			try {
				newProduct.image = await fileToBase64(newProduct.imageFile);
				console.log('📁 File converted to base64');
			} catch (error) {
				formError = 'Failed to process image file';
				console.error('❌ File conversion error:', error);
				return;
			}
		}

		if (parseFloat(newProduct.price) <= 0) {
			formError = 'Price must be greater than 0';
			return;
		}

		if (parseInt(newProduct.stock) < 0) {
			formError = 'Stock cannot be negative';
			return;
		}

		isSubmitting = true;

		try {
			const productData = {
				name: newProduct.name.trim(),
				price: parseFloat(newProduct.price),
				category: newProduct.category,
				stock: parseInt(newProduct.stock),
				image: newProduct.image
			};

			console.log('📤 Sending product data to API:', productData);

			const response = await fetch('/api/inventory', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(productData)
			});

			console.log('📥 API response status:', response.status);

			const data = await response.json();
			console.log('📥 API response data:', data);

			if (response.ok && data.success) {
				console.log('✅ Product added successfully!');
				products = [...products, data.product];
				closeAddProductModal();
				alert('✅ Product added successfully!');
			} else {
				formError = data.error || 'Failed to add product. Please try again.';
				console.error('❌ API error:', data);
			}
		} catch (error) {
			console.error('💥 Add product error:', error);
			formError = 'Failed to add product. Please check your connection and try again.';
		} finally {
			isSubmitting = false;
		}
	}

	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = (error) => reject(error);
		});
	}

	let showEditProductModal = $state(false);
	let editingProduct = $state<Product | null>(null);
	let editFormData = $state({
		name: '',
		price: '',
		category: '',
		stock: '',
		image: ''
	});
	let editImagePreview = $state('');
	let editImageFile = $state(null as File | null);
	let isEditing = $state(false);
	let editFormError = $state('');

	function openEditProductModal(product: Product) {
		editingProduct = product;
		editFormData = {
			name: product.name,
			price: product.price.toString(),
			category: product.category,
			stock: product.stock.toString(),
			image: product.image
		};
		editImagePreview = product.image;
		editImageFile = null;
		showEditProductModal = true;
		editFormError = '';
	}
	function handleEditImageFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			editImageFile = file;

			if (file.size > 2 * 1024 * 1024) {
				editFormError = 'Image size should be less than 2MB';
				return;
			}

			if (!file.type.startsWith('image/')) {
				editFormError = 'Please select a valid image file';
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				editImagePreview = e.target?.result as string;
				editFormData.image = '';
			};
			reader.readAsDataURL(file);
		}
	}

	function handleEditImageUrlChange(url: string) {
		editFormData.image = url;
		editImageFile = null;
		editImagePreview = url;
	}

	function closeEditProductModal() {
		showEditProductModal = false;
		editingProduct = null;
		editImagePreview = '';
		editImageFile = null;
		editFormError = '';
	}

	async function updateProduct(event: Event) {
		event.preventDefault();
		editFormError = '';

		if (!editingProduct) return;

		if (
			!editFormData.name ||
			!editFormData.price ||
			!editFormData.category ||
			!editFormData.stock
		) {
			editFormError = 'Please fill in all required fields';
			return;
		}

		if (!editFormData.image && !editImageFile) {
			editFormError = 'Please provide either an image URL or upload an image file';
			return;
		}

		if (parseFloat(editFormData.price) <= 0) {
			editFormError = 'Price must be greater than 0';
			return;
		}

		if (parseInt(editFormData.stock) < 0) {
			editFormError = 'Stock cannot be negative';
			return;
		}

		isEditing = true;

		try {
			let imageUrl = editFormData.image;

			if (editImageFile) {
				console.log('Processing uploaded file for edit...');
				imageUrl = await fileToBase64(editImageFile);

				if (!imageUrl) {
					editFormError = 'Failed to process image file. Please try another image.';
					isEditing = false;
					return;
				}
			}

			const updateData = {
				name: editFormData.name.trim(),
				price: parseFloat(editFormData.price),
				category: editFormData.category,
				stock: parseInt(editFormData.stock),
				image: imageUrl,
				updated_at: new Date().toISOString()
			};

			console.log('🔄 Updating product:', editingProduct.id, updateData);

			const response = await fetch(`/api/inventory/${editingProduct.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			const data = await response.json();

			if (response.ok && data.success) {
				const productIndex = products.findIndex((p) => p.id === editingProduct!.id);
				if (productIndex !== -1) {
					products[productIndex] = { ...products[productIndex], ...updateData };
				}

				closeEditProductModal();
				alert('✅ Product updated successfully!');
			} else {
				editFormError = data.error || 'Failed to update product';
				console.error('❌ Update error:', data);
			}
		} catch (error) {
			console.error('💥 Update product error:', error);
			editFormError = 'Failed to update product. Please check your connection.';
		} finally {
			isEditing = false;
		}
	}
</script>

<div class="relative min-h-screen bg-gray-50">
	<nav class="sticky top-0 z-20 flex border bg-white px-4 py-2 shadow-sm">
		<div class="mr-auto flex items-center gap-1">
			<Button
				class="cursor-pointer bg-white p-2 hover:bg-gray-50 active:scale-95"
				onclick={handleMenuClick}
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
			<h1 class="text-xl font-bold">Inventory</h1>
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

	<main class="relative min-h-screen flex-col gap-6 p-6">
		<div>
			<h1 class="text-3xl font-bold">Inventory Management</h1>
			<p class="text-gray-500">Track and manage your product inventory</p>
		</div>

		<section class="flex items-center justify-evenly gap-4 p-10">
			<div class="flex w-75 max-w-150 items-center gap-4 rounded-md bg-white p-5 shadow">
				<BrandMinecraft size="35" class="rounded-sm bg-blue-100 text-blue-500"></BrandMinecraft>
				<div>
					<h1 class="text-lg">Total Products</h1>
					<span class="text-2xl font-bold">{totalProducts}</span>
				</div>
			</div>
			<div class="flex w-75 max-w-150 items-center gap-4 rounded-md bg-white p-5 shadow">
				<Check size="35" class="rounded-sm bg-green-100 text-green-500"></Check>
				<div>
					<h1 class="text-lg">In Stock</h1>
					<span class="text-2xl font-bold">{inStockProducts}</span>
				</div>
			</div>
			<div class="flex w-75 max-w-150 items-center gap-4 rounded-md bg-white p-5 shadow">
				<AlertTriangle size="35" class="rounded-sm bg-yellow-100 text-yellow-500"></AlertTriangle>
				<div>
					<h1 class="text-lg">Low Stock</h1>
					<span class="text-2xl font-bold">{lowStockProducts}</span>
				</div>
			</div>
			<div class="flex w-75 max-w-150 items-center gap-4 rounded-md bg-white p-5 shadow">
				<IconX size="35" class="rounded-sm bg-red-100 text-red-500"></IconX>
				<div>
					<h1 class="text-lg">Out of Stock</h1>
					<span class="text-2xl font-bold">{outOfStockProducts}</span>
				</div>
			</div>
		</section>

		<section class="relative flex justify-center gap-2 rounded-md bg-white px-5 py-6 shadow">
			<div class="flex items-center gap-3">
				<Search size="20" class="absolute left-8"></Search>
				<Input
					type="text"
					bind:value={searchQuery}
					class="w-100 max-w-200 px-8"
					placeholder="Search products..."
				/>
			</div>
			<div class="flex gap-3">
				<Select.Root type="single" name="favoriteFruit" bind:value>
					<Select.Trigger class="w-[180px]">
						{triggerContent}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Categories</Select.Label>
							{#each catergoryValue as CatergoryValue (CatergoryValue.value)}
								<Select.Item value={CatergoryValue.value} label={CatergoryValue.label}>
									{CatergoryValue.label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>

			<Button class="ml-auto bg-blue-500" onclick={openAddProductModal}>+ Add Products</Button>
		</section>

		<table class="mt-10 w-full rounded-md border border-gray-200">
			<thead class="bg-gray-100 text-gray-700">
				<tr>
					<th class="px-4 py-3 text-left">Product</th>
					<th class="px-4 py-3">Category</th>
					<th class="px-4 py-3">Stock</th>
					<th class="px-4 py-3">Price</th>
					<th class="px-4 py-3">Status</th>
					<th class="px-4 py-3">Actions</th>
				</tr>
			</thead>

			<tbody class="bg-white">
				{#if loading}
					<tr>
						<td colspan="6" class="px-4 py-8 text-center">
							<p class="text-gray-500">Loading products...</p>
						</td>
					</tr>
				{:else if filteredProducts.length === 0}
					<tr>
						<td colspan="6" class="px-4 py-8 text-center">
							<p class="text-gray-500">No products found</p>
						</td>
					</tr>
				{:else}
					{#each filteredProducts as product (product.id)}
						<tr class="text-center hover:bg-gray-50">
							<td class="px-4 py-3">
								<div class="flex items-center gap-3">
									<img
										src={product.image}
										alt={product.name}
										class="h-10 w-10 rounded object-cover"
									/>
									<span class="text-left">
										<div class="font-medium">{product.name}</div>
										<div class="text-xs text-gray-500">ID: {product.id.substring(0, 8)}...</div>
									</span>
								</div>
							</td>
							<td class="px-4 py-3">
								<span
									class="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
								>
									{product.category}
								</span>
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-center gap-2">
									<span
										class="font-semibold {product.stock === 0
											? 'text-red-600'
											: product.stock <= 10
												? 'text-yellow-600'
												: 'text-green-600'}"
									>
										{product.stock}
									</span>
								</div>
							</td>
							<td class="px-4 py-3 font-semibold">₱{product.price.toLocaleString()}</td>
							<td class="px-4 py-3">
								<span
									class="inline-flex rounded-full px-3 py-1 text-xs font-medium {product.stock === 0
										? 'bg-red-100 text-red-800'
										: product.stock <= 10
											? 'bg-yellow-100 text-yellow-800'
											: 'bg-green-100 text-green-800'}"
								>
									{#if product.stock === 0}
										Out of Stock
									{:else if product.stock <= 10}
										Low Stock
									{:else}
										In Stock
									{/if}
								</span>
							</td>
							<td class="px-4 py-3">
								<div class="flex justify-center gap-2">
									<Button
										class="cursor-pointer rounded-md bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600 active:scale-95"
										onclick={() => openEditProductModal(product)}
									>
										Edit
									</Button>

									<Button
										class="cursor-pointer rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 active:scale-95"
										onclick={() => deleteProduct(product.id)}
									>
										Delete
									</Button>
								</div>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
		{#if showAddProductModal}
			<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
				<div class="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
					<div class="mb-6 flex items-center justify-between">
						<h2 class="text-2xl font-bold">Add New Product</h2>
						<button
							onclick={closeAddProductModal}
							class="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
						>
							<IconX class="h-5 w-5" />
						</button>
					</div>

					{#if formError}
						<div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
							{formError}
						</div>
					{/if}

					<form onsubmit={addProduct} class="space-y-4">
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700" for="newproduct"
									>Product Name *</label
								>
								<Input
									type="text"
									bind:value={newProduct.name}
									class="w-full"
									placeholder="Enter product name"
									required
									name="newproduct"
								/>
							</div>

							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700" for="category"
									>Category *</label
								>
								<Select.Root type="single" bind:value={newProduct.category} name="category">
									<Select.Trigger class="w-full">
										{newProduct.category || 'Select Category'}
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											<Select.Label>Categories</Select.Label>
											{#each catergoryValue.filter((f) => f.value !== 'All') as CatergoryValue (CatergoryValue.value)}
												<Select.Item value={CatergoryValue.value} label={CatergoryValue.label}>
													{CatergoryValue.label}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
							</div>

							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700" for="priceproduct"
									>Price (₱) *</label
								>
								<Input
									type="number"
									bind:value={newProduct.price}
									class="w-full"
									placeholder="0.00"
									min="0"
									step="0.01"
									required
									name="priceproduct"
								/>
							</div>

							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700" for="stockproduct"
									>Stock *</label
								>
								<Input
									type="number"
									bind:value={newProduct.stock}
									class="w-full"
									placeholder="0"
									min="0"
									required
									name="stockproduct"
								/>
							</div>
						</div>

						<div>
							<span class="mb-2 block text-sm font-medium text-gray-700">Product Image *</span>

							{#if imagePreview}
								<div class="mb-3 flex justify-center">
									<img
										src={imagePreview}
										alt="Preview"
										class="h-32 w-32 rounded-lg border object-cover"
									/>
								</div>
							{/if}

							<div class="space-y-3">
								<div>
									<label class="mb-1 block text-sm text-gray-600" for="productimage"
										>Or enter image URL:</label
									>
									<Input
										type="url"
										bind:value={newProduct.image}
										class="w-full"
										placeholder="https://example.com/image.jpg"
										oninput={(e) => handleImageUrlChange(e.target.value)}
										name="productimage"
									/>
								</div>

								<div>
									<label class="mb-1 block text-sm text-gray-600" for="fileimage"
										>Or upload image:</label
									>
									<label
										class="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-blue-500"
									>
										<Upload class="h-5 w-5 text-gray-400" />
										<span class="text-sm text-gray-600">
											{newProduct.imageFile ? newProduct.imageFile.name : 'Choose image file'}
										</span>
										<input
											type="file"
											class="hidden"
											accept="image/*"
											onchange={handleImageFileSelect}
											name="fileimage"
										/>
									</label>
								</div>
							</div>
						</div>

						<div class="flex justify-end gap-3 pt-4">
							<Button
								type="button"
								onclick={closeAddProductModal}
								class="bg-gray-500 hover:bg-gray-600"
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" class="bg-blue-500 hover:bg-blue-600" disabled={isSubmitting}>
								{#if isSubmitting}
									Adding...
								{:else}
									Add Product
								{/if}
							</Button>
						</div>
					</form>
				</div>
			</div>
		{/if}
		{#if showEditProductModal}
			<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
				<div class="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
					<div class="mb-6 flex items-center justify-between">
						<h2 class="text-2xl font-bold">Edit Product</h2>
						<button
							onclick={closeEditProductModal}
							class="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
						>
							<IconX class="h-5 w-5" />
						</button>
					</div>

					{#if editFormError}
						<div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
							{editFormError}
						</div>
					{/if}

					<form onsubmit={updateProduct} class="space-y-4">
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700" for="editName"
									>Product Name *</label
								>
								<Input
									type="text"
									bind:value={editFormData.name}
									class="w-full"
									placeholder="Enter product name"
									required
									name="editName"
								/>
							</div>

							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700" for="editCategory"
									>Category *</label
								>
								<Select.Root type="single" bind:value={editFormData.category} name="editCategory">
									<Select.Trigger class="w-full">
										{editFormData.category || 'Select Category'}
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											<Select.Label>Categories</Select.Label>
											{#each catergoryValue.filter((f) => f.value !== 'All') as CatergoryValue (CatergoryValue.value)}
												<Select.Item value={CatergoryValue.value} label={CatergoryValue.label}>
													{CatergoryValue.label}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
							</div>

							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700" for="editPrice"
									>Price (₱) *</label
								>
								<Input
									type="number"
									bind:value={editFormData.price}
									class="w-full"
									placeholder="0.00"
									min="0"
									step="0.01"
									required
									name="editPrice"
								/>
							</div>

							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700" for="editStock"
									>Stock *</label
								>
								<Input
									type="number"
									bind:value={editFormData.stock}
									class="w-full"
									placeholder="0"
									min="0"
									required
									name="editStock"
								/>
							</div>
						</div>

						<div>
							<span class="mb-2 block text-sm font-medium text-gray-700">Product Image *</span>

							{#if editImagePreview}
								<div class="mb-3 flex flex-col items-center">
									<img
										src={editImagePreview}
										alt="Preview"
										class="h-32 w-32 rounded-lg border object-cover"
									/>
									<p class="mt-1 text-xs text-green-600">✅ Image preview</p>
								</div>
							{/if}

							<div class="space-y-3">
								<div>
									<label class="mb-1 block text-sm text-gray-600" for="editUrlImage">
										Option 1: Enter image URL
									</label>
									<Input
										type="url"
										bind:value={editFormData.image}
										class="w-full"
										placeholder="https://example.com/image.jpg"
										oninput={(e) => handleEditImageUrlChange(e.target.value)}
										name="editUrlImage"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm text-gray-600" for="editImageUpload">
										Option 2: Upload new image
									</label>
									<label
										class="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-blue-500"
									>
										<Upload class="h-5 w-5 text-gray-400" />
										<span class="text-sm text-gray-600">
											{editImageFile
												? `Selected: ${editImageFile.name}`
												: 'Click to choose image file'}
										</span>
										<input
											type="file"
											class="hidden"
											accept="image/*"
											onchange={handleEditImageFileSelect}
											name="editImageUpload"
										/>
									</label>
								</div>
							</div>

							<div class="mt-3 rounded-lg bg-blue-50 p-3">
								<p class="text-xs text-blue-700">
									💡 <strong>Current image:</strong>
									{editingProduct?.image.substring(0, 50)}...
									{#if editImageFile}
										<br />🔄 <strong>New image:</strong> {editImageFile.name}
									{/if}
								</p>
							</div>
						</div>

						<div class="flex justify-end gap-3 pt-4">
							<Button
								type="button"
								onclick={closeEditProductModal}
								class="bg-gray-500 hover:bg-gray-600"
								disabled={isEditing}
							>
								Cancel
							</Button>
							<Button type="submit" class="bg-green-500 hover:bg-green-600" disabled={isEditing}>
								{#if isEditing}
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
										Updating...
									</span>
								{:else}
									Update Product
								{/if}
							</Button>
						</div>
					</form>
				</div>
			</div>
		{/if}
	</main>
</div>
