<script lang="ts">
	import Mail from '@tabler/icons-svelte/icons/mail';
	import IconDeviceMobile from '@tabler/icons-svelte/icons/device-mobile';
</script>

<section id="help" class="flex min-h-screen flex-col gap-10">
	<div
		class="flex max-w-screen flex-col items-center justify-center gap-8 rounded-sm bg-gradient-to-bl from-violet-500 to-blue-500 px-2 py-8 sm:px-4 sm:py-12 md:py-15"
	>
		<h1
			class="text-center text-xl leading-tight font-bold tracking-tight text-white sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl"
		>
			Help & Support
		</h1>

		<p
			class="px-2 text-center text-xs font-light text-white sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl"
		>
			Find answers to common questions and get the help you need
		</p>
	</div>
	<section class="flex items-center justify-center px-2 sm:px-4">
		<div class="flex w-full max-w-4xl flex-col gap-8">
			<h1 class="text-lg font-bold sm:text-xl">Contact Us</h1>
			<div class="flex flex-col flex-wrap gap-4 sm:flex-row sm:gap-8 lg:gap-15">
				<div class="flex w-full flex-col gap-2 rounded-sm border bg-gray-100 p-5 sm:w-80">
					<div class="flex flex-wrap gap-2">
						<Mail class="text-black"></Mail>
						<h1 class="font-bold text-black">Email Support</h1>
					</div>
					<span class="text-sm break-all text-gray-800">jayjayeviota101@gmail.com</span>
					<span class="text-sm text-gray-500">Responses within 24 hours</span>
				</div>

				<div class="flex w-full flex-col gap-2 rounded-sm border bg-gray-100 p-5 sm:w-80">
					<div class="flex flex-wrap gap-2">
						<IconDeviceMobile class="text-black"></IconDeviceMobile>
						<h1 class="font-bold text-black">Phone Support</h1>
					</div>
					<span class="text-sm text-gray-800">Smart (Simcard): 09499080731</span>
					<span class="text-sm text-gray-800">Dito (Simcard): 09940571782</span>
				</div>
			</div>
			<h1 class="text-lg font-bold sm:text-xl">Common Questions</h1>
			<div class="flex gap-4">
				<div class="h-16 w-1 flex-shrink-0 rounded-full bg-blue-600 sm:h-18"></div>
				<div>
					<h1 class="sm:text-md text-sm font-bold">How do I place an order?</h1>
					<p class="text-sm sm:text-base">
						To place an order, simply browse our products, add your desired items to the cart, and
						proceed to checkout.<br class="hidden sm:block" /> Follow the steps to enter your shipping
						details and complete the payment.
					</p>
				</div>
			</div>

			<div class="flex gap-4">
				<div class="h-16 w-1 flex-shrink-0 rounded-full bg-purple-600 sm:h-18"></div>
				<div>
					<h1 class="sm:text-md text-sm font-bold">What payment methods do you accept?</h1>
					<p class="text-sm sm:text-base">
						We accept a variety of payment methods, including:<br class="hidden sm:block" /> Paypal,
						G-Cash, Maya
					</p>
				</div>
			</div>
			<div class="flex gap-4">
				<div class="h-16 w-1 flex-shrink-0 rounded-full bg-orange-600 sm:h-18"></div>
				<div>
					<h1 class="sm:text-md text-sm font-bold">How can I track my order?</h1>
					<p class="text-sm sm:text-base">
						Once your order is shipped, you will receive a tracking number via email.<br
							class="hidden sm:block"
						/> You can use this number to track your order on our website or the courier's tracking page.
					</p>
				</div>
			</div>
		</div>
	</section>
</section>
