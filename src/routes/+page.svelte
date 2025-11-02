<script lang="ts">
	import { goto } from '$app/navigation';
	import About from './(nav-bar)/(About)/about.svelte';
	import Help from './(nav-bar)/(Help)/help.svelte';
	import Footer from './(footer)/footer.svelte';
	import IconMenu2 from '@tabler/icons-svelte/icons/menu-2';
	import IconX from '@tabler/icons-svelte/icons/x';
	import Button from '$lib/components/ui/button/button.svelte';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';
	import image01 from '$lib/images/image01.png';

	let { children } = $props();

	const Components = [
		{
			label: 'Home',
			href: '/'
		},
		{
			label: 'About',
			href: '#about'
		},
		{
			label: 'Help',
			href: '#help'
		}
	];
	const gotoLoginPage = () => {
		goto('/login');
	};

	let MenuOpen = $state(false);

	const closeMenu = () => {
		MenuOpen = false;
	};

	const handleMenuClick = (event: Event) => {
		event?.stopPropagation();
	};
</script>

<nav
	class="sticky top-0 z-10 flex items-center gap-2 bg-white p-2 shadow-sm transition-colors duration-200 dark:bg-gray-900"
>
	<h1 class="font-serif font-semibold text-gray-900 dark:text-white">Eviota 4i</h1>
	<ModeWatcher />
	<Button
		onclick={toggleMode}
		variant="outline"
		size="icon"
		class="relative cursor-pointer overflow-hidden border-gray-300 hover:bg-gray-100 active:scale-95 dark:border-gray-600 dark:hover:bg-gray-800"
	>
		<SunIcon
			class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 text-yellow-500 transition-all duration-300 dark:scale-0 dark:-rotate-90"
		/>
		<MoonIcon
			class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 text-blue-400 transition-all duration-300 dark:scale-100 dark:rotate-0"
		/>
		<span class="sr-only">Toggle theme</span>
	</Button>
	{@render children?.()}
	<ul class="ml-auto hidden gap-8 md:flex">
		{#each Components as component}
			<li
				class="border-b-2 border-transparent p-1 transition-all duration-200 hover:border-b-purple-600 active:scale-95"
			>
				<a
					href={component.href}
					class="text-gray-700 transition-colors duration-200 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400"
				>
					{component.label}
				</a>
			</li>
		{/each}
	</ul>

	<div class="ml-auto flex items-center gap-2 md:ml-4">
		<Button
			variant="outline"
			size="icon"
			class="border-gray-300 hover:bg-gray-100 active:scale-95 md:hidden dark:border-gray-600 dark:hover:bg-gray-800"
			onclick={(event) => {
				handleMenuClick(event);
				MenuOpen = !MenuOpen;
			}}
		>
			{#if MenuOpen}
				<IconX
					class="cursor-pinter h-5 w-5 text-gray-700 duration-300 active:scale-95 dark:text-gray-300"
				/>
			{:else}
				<IconMenu2
					class="h-5 w-5 cursor-pointer text-gray-700 duration-300 active:scale-95 dark:text-gray-300"
				/>
			{/if}
			<span class="sr-only">Toggle menu</span>
		</Button>
	</div>

	{#if MenuOpen}
		<div
			class="absolute top-full right-0 flex min-w-[150px] flex-col gap-1 rounded-lg border border-gray-200 bg-white px-2 py-2 shadow-lg duration-300 md:hidden dark:border-gray-700 dark:bg-gray-800"
			role="menu"
		>
			{#each Components as component}
				<a
					href={component.href}
					class="block rounded-md p-2 text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-purple-600 active:scale-95 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-purple-400"
					onclick={closeMenu}
					role="menuitem"
				>
					{component.label}
				</a>
			{/each}
		</div>
	{/if}
</nav>
<main
	class="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 px-2 py-4 transition-colors duration-300 sm:px-4 sm:py-8 md:py-16 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20"
>
	<div class="container mx-auto w-full max-w-7xl">
		<div
			class="grid min-h-[calc(100vh-2rem)] items-center gap-4 sm:min-h-[calc(100vh-4rem)] sm:gap-8 lg:grid-cols-2 lg:gap-16"
		>
			<div class="w-full space-y-4 text-center sm:space-y-6 md:space-y-8 lg:text-left">
				<div>
					<h1
						class="font-serif text-2xl leading-tight font-bold break-words text-slate-800 transition-colors duration-300 sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl dark:text-gray-100"
					>
						<span
							class="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-indigo-400"
						>
							Discover
						</span>
						Your Style.
					</h1>
					<h2
						class="mt-2 font-serif text-xl leading-tight font-bold break-words text-slate-700 transition-colors duration-300 sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl dark:text-gray-200"
					>
						Shop the Latest<br class="hidden sm:block" />
						<span
							class="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-indigo-400"
						>
							Trends Effortlessly
						</span>
					</h2>
				</div>

				<div
					class="rounded-xl border border-white/20 bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 sm:rounded-2xl sm:p-6 dark:border-gray-700/50 dark:bg-gray-800/60"
				>
					<h3
						class="mb-2 font-serif text-lg font-medium text-slate-800 transition-colors duration-300 sm:mb-3 sm:text-xl md:text-2xl dark:text-gray-100"
					>
						Find the Perfect Look for Every Occasion.
					</h3>

					<p
						class="text-sm font-medium text-slate-800 transition-colors duration-300 sm:text-base md:text-lg dark:text-gray-200"
					>
						Upgrade Your Wardrobe with Just One Click!
					</p>
				</div>

				<div class="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
					<button
						class="cursor-pointer rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl sm:px-8 sm:py-4 dark:from-purple-500 dark:to-indigo-500 dark:hover:from-purple-600 dark:hover:to-indigo-600"
						onclick={gotoLoginPage}
					>
						Get Started
					</button>
				</div>
			</div>

			<div class="flex w-full justify-center lg:justify-end">
				<div class="relative flex w-full justify-center lg:justify-end">
					<div
						class="h-64 w-48 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-2xl transition-all duration-300 sm:h-72 sm:w-60 sm:rounded-[3rem] sm:border-4 md:h-80 md:w-72 lg:h-96 lg:w-80 xl:h-[28rem] xl:w-96 dark:border-gray-700 dark:bg-gray-800 dark:shadow-purple-900/20"
					>
						<img src={image01} class="h-full w-full object-cover" alt="Fashion Style" />
					</div>
				</div>
			</div>
		</div>
	</div>
</main>

<About />
<Help />
<Footer />
