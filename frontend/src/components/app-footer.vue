<script setup>
</script>

<template>
	<footer class="footer">
	  Copyright © {{ new Date().getFullYear() }} <br> AXE.
	</footer>
  </template>


  <style scoped lang="scss">
  @use "@/variables" as *;

  .footer {
	display: block;
	color: var(--base-text-color-alpha);
	// padding: 20px 0 16px var(--footer-left-padding);
	margin-left: 16px;
	padding: 20px 0 16px calc(var(--footer-left-padding) + 16px);
	background-color: var(--side-panel-background);
	height: var(--footer-height);
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	opacity: 0;

	.dx-drawer-opened & {
	  opacity: 1;
	  transition: opacity 0.4s;
	}
  }
  </style>
