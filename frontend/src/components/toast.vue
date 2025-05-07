  <script setup>
  import { ref } from 'vue';
  import DxToast from 'devextreme-vue/toast';

  const toastVisible = ref(false);
  const toastMessage = ref('');
  const toastType = ref('success');

  const toastPosition = ref({
	my: 'bottom right',
	at: 'bottom right',
	of: window,
	offset: '-20 -20'
  });

  // Function to show toast
  const showToast = (message, type = 'success') => {
	toastMessage.value = message;
	toastType.value = type;
	toastVisible.value = true;
	setTimeout(() => {
	  toastVisible.value = false;
	}, 3000);
  };

  // Expose the showToast function to be used globally
  defineExpose({ showToast });
  </script>

<template>
	<dx-toast
	  :visible.sync="toastVisible"
	  :message="toastMessage"
	  :type="toastType"
	  :display-time="3000"
	  :height="55"
	  :width="300"
	  :position="toastPosition"
	/>
  </template>
