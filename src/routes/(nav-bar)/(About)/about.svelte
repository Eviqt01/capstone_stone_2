<script lang="ts">
	import IconBrandFacebook from '@tabler/icons-svelte/icons/brand-facebook';
	import IconBrandInstagram from '@tabler/icons-svelte/icons/brand-instagram';
	import IconBrandX from '@tabler/icons-svelte/icons/brand-x';
	import Plant_2 from '@tabler/icons-svelte/icons/plant-2';
	import Sparkles from '@tabler/icons-svelte/icons/sparkles';
	import HeartHandshake from '@tabler/icons-svelte/icons/heart-handshake';
	import Image01 from '$lib/images/Rommel.jpeg';
	import Image02 from '$lib/images/genon.png';
	import Image03 from '$lib/images/ulfina.jpg';
	import Image04 from '$lib/images/lazaro.jpg';
	import Image05 from '$lib/images/Eviota.jpg';
</script>

<section id="about" class="flex min-h-auto flex-col gap-10">
	<div
		class="flex max-w-screen flex-col items-center justify-center gap-8 rounded-sm bg-gradient-to-bl from-violet-500 to-fuchsia-500 px-4 py-15"
	>
		<h1
			class="text-center text-2xl leading-tight font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
		>
			About Us
		</h1>

		<p
			class="max-w-4xl px-2 text-center text-sm leading-relaxed font-light text-white sm:text-base md:text-lg lg:text-xl"
		>
			Laveona operates with a deep commitment to provide superior shopping services to our
			customers.<br class="hidden md:block" />
			<span class="mt-2 block md:mt-0 md:inline">
				Our system provides a link between purchasers and reliable suppliers who offer premium
				products.
			</span>
		</p>
	</div>

	<div class="mx-auto flex max-w-7xl flex-col items-center justify-center gap-5 py-5">
		<h1
			class="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-center text-2xl font-bold text-transparent sm:text-3xl md:text-4xl lg:text-5xl"
		>
			What Drives Us
		</h1>

		<p
			class="max-w-3xl px-4 text-center text-sm leading-relaxed font-medium text-gray-600 sm:text-base md:text-lg lg:text-xl dark:text-gray-300"
		>
			We believe that great style shouldn't come at the cost of our planet or our<br
				class="hidden lg:block"
			/>
			<span class="mt-1 block lg:mt-0 lg:inline">values.</span>
		</p>
	</div>

	<section class="flex flex-wrap items-center justify-center gap-10">
		<div
			class="flex h-full w-80 flex-col items-center justify-center gap-4 rounded-4xl border p-5 duration-300 hover:-translate-y-1 hover:shadow-2xl"
		>
			<Plant_2 class="size-12 sm:size-10 md:size-14"></Plant_2>

			<h2
				class="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-center text-lg font-semibold text-transparent sm:text-xl md:text-2xl"
			>
				Sustainability First
			</h2>

			<p
				class="text-center text-sm leading-relaxed text-gray-700 sm:text-base md:text-lg dark:text-gray-300"
			>
				Every product is crafted with eco-friendly materials and ethical manufacturing processes.
			</p>
		</div>

		<div
			class="flex h-full w-80 flex-col items-center justify-center gap-4 rounded-4xl border p-5 duration-300 hover:-translate-y-1 hover:shadow-2xl"
		>
			<Sparkles class="size-12 sm:size-10 md:size-14"></Sparkles>
			<h3
				class="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-center text-lg font-semibold text-transparent sm:text-xl md:text-2xl"
			>
				Premium Quality
			</h3>
			<p
				class="text-center text-sm leading-relaxed text-gray-700 sm:text-base md:text-lg dark:text-gray-300"
			>
				We source only the finest materials and work with skilled artisans to ensure lasting
				quality.
			</p>
		</div>

		<div
			class="flex h-full w-80 flex-col items-center justify-center gap-4 rounded-4xl border p-5 duration-300 hover:-translate-y-1 hover:shadow-2xl"
		>
			<HeartHandshake class="size-12 sm:size-10 md:size-14"></HeartHandshake>
			<h3
				class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-center text-lg font-semibold text-transparent sm:text-xl md:text-2xl"
			>
				Fair Trade
			</h3>
			<p
				class="text-center text-sm leading-relaxed text-gray-700 sm:text-base md:text-lg dark:text-gray-300"
			>
				We ensure fair wages and safe working conditions for everyone in our supply chain.
			</p>
		</div>
	</section>
	<div class="mx-auto flex max-w-7xl flex-col items-center justify-center gap-5 py-5">
		<h1 class=" text-center text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl">
			Meet Our Group
		</h1>
	</div>
	<section class="mb-8 flex flex-wrap items-center justify-center gap-10">
		<div
			class="flex h-full w-80 flex-col items-center justify-center gap-4 rounded-4xl border p-5 duration-300 hover:-translate-y-1 hover:shadow-2xl"
		>
			<img src={Image03} class="size-40 rounded-full border border-black" alt="rommelHelera" />
			<h3
				class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-center text-lg font-semibold text-transparent sm:text-xl md:text-2xl"
			>
				Simon Ulfina <br /><span class="text-[16px] text-black">(Documents)</span>
			</h3>
		</div>

		<div
			class="flex h-full w-80 flex-col items-center justify-center gap-4 rounded-4xl border p-5 duration-300 hover:-translate-y-1 hover:shadow-2xl"
		>
			<img src={Image01} class="size-40 rounded-full border border-black" alt="rommelHelera" />
			<h3
				class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-center text-lg font-semibold text-transparent sm:text-xl md:text-2xl"
			>
				Rommel Helera <br /><span class="text-[16px] text-black">(Documents)</span>
			</h3>
		</div>

		<div
			class="flex h-full w-80 flex-col items-center justify-center gap-4 rounded-4xl border p-5 duration-300 hover:-translate-y-1 hover:shadow-2xl"
		>
			<img src={Image05} class="size-40 rounded-full border border-black" alt="jayjayeviota" />
			<h3
				class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-center text-lg font-semibold text-transparent sm:text-xl md:text-2xl"
			>
				Jayjay Eviota<br />
				<span class="text-[16px] text-black">(Developer)</span>
			</h3>
			<div class="flex flex-row items-center gap-1 self-start">
				<IconBrandFacebook size="30"></IconBrandFacebook>
				<span class="border-transparent hover:border-b hover:border-blue-400 hover:text-blue-500"
					><a href="https://www.facebook.com/jayjay.eviota">Jayjay Eviota</a></span
				>
			</div>
			<div class="flex flex-row items-center gap-1 self-start">
				<IconBrandInstagram size="30"></IconBrandInstagram>
				<span class="border-transparent hover:border-b hover:border-pink-400 hover:text-pink-500"
					><a href="https://www.instagram.com/evivszombies/">evivszombies</a></span
				>
			</div>
			<div class="flex flex-row items-center gap-1 self-start">
				<IconBrandX size="30"></IconBrandX>
				<span class="border-transparent hover:border-b hover:border-black"
					><a href="https://x.com/EvivsZombies123">evivszombies</a></span
				>
			</div>
		</div>
		<div
			class="flex h-full w-80 flex-col items-center justify-center gap-4 rounded-4xl border p-5 duration-300 hover:-translate-y-1 hover:shadow-2xl"
		>
			<img src={Image02} class="size-40 rounded-full border border-black" alt="owenGenon" />
			<h3
				class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-center text-lg font-semibold text-transparent sm:text-xl md:text-2xl"
			>
				Owen Genon <br /><span class="text-[16px] text-black">(Documents)</span>
			</h3>
		</div>
		<div
			class="flex h-full w-80 flex-col items-center justify-center gap-4 rounded-4xl border p-5 duration-300 hover:-translate-y-1 hover:shadow-2xl"
		>
			<img src={Image04} class="size-40 rounded-full border border-black" alt="rommelHelera" />
			<h3
				class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-center text-lg font-semibold text-transparent sm:text-xl md:text-2xl"
			>
				Sherlita Lazaro <br /><span class="text-[16px] text-black">(Documents)</span>
			</h3>
		</div>
	</section>
</section>
