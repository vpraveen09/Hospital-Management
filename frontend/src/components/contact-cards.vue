<script setup>
import { DxTabPanel } from 'devextreme-vue/tab-panel';
import { DxItem as DxTabItem } from 'devextreme-vue/tabs';
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CardTasks from './card-tasks.vue';

// Get the current route and router instance
const route = useRoute();
const router = useRouter();

// The `selectedTab` is reactive and will control the active tab.
const selectedTab = ref('all');  // Default to "all" tab

// Watch the route's tab parameter and update the selectedTab
watch(() => route.params.tab, (newTab) => {
  if (newTab) {
    selectedTab.value = newTab;  // Set the tab according to the route parameter
  } else {
    selectedTab.value = 'all';  // Default to "all" if no tab is specified
  }
});

// Compute the index of the selected tab based on the tab name
const getTabIndex = computed(() => {
  switch (selectedTab.value) {
    case 'checkin':
      return 1;  // "Check In" tab
    case 'triage':
      return 2;  // "Triage" tab
    case 'audit':
      return 3;  // "Audit" tab
    case 'testing':
      return 4;  // "Testing" tab
    default:
      return 0;  // "All" tab
  }
});

// Function to navigate to the selected tab (and update the URL)
const navigateToTab = (tabName) => {
  router.push({ name: 'inbound-inquiry', params: { tab: tabName } });
};
</script>

<template>
  <div class="dx-card details-card">
    <!-- Tab panel that changes dynamically based on the selected tab index -->
    <dx-tab-panel :selected-index="getTabIndex">
      <dx-tab-item title="All" @click="navigateToTab('all')">
        <card-tasks />
      </dx-tab-item>

      <dx-tab-item title="Check In" @click="navigateToTab('checkin')">
        <card-tasks />
      </dx-tab-item>

      <dx-tab-item title="Triage" @click="navigateToTab('triage')">
        <card-tasks />
      </dx-tab-item>

      <dx-tab-item title="Audit" @click="navigateToTab('audit')">
        <card-tasks />
      </dx-tab-item>

      <dx-tab-item title="Testing" @click="navigateToTab('testing')">
        <card-tasks />
      </dx-tab-item>
    </dx-tab-panel>
  </div>
</template>

<style scoped lang="scss">
// @import "../axe-custom-styles.scss";

// You can style the tabs here if needed

</style>
