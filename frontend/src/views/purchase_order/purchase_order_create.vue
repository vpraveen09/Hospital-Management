<script setup>
import { ref } from 'vue';
import { DxTabPanel } from 'devextreme-vue/tab-panel';
import { DxItem as DxTabItem } from 'devextreme-vue/tabs';
import { DxButton } from 'devextreme-vue/button';
import { useRouter } from 'vue-router';

import purchase_order_general from './purchase_order_general.vue';

const router = useRouter();

const selectedTabIndex = ref(0);
const tabsState = ref([true, false, false, false]);
const selectedrowkeys = ref([]);
const generalPage = ref(null);
const isPricingDetailsVisible = ref(false);
const isGeneralEditable = ref(true);

function handleTabChange(e) {
  if (e.name === 'selectedIndex') {
    selectedTabIndex.value = e.value;
  }
}

async function handleSaveNextClick() {

  if (!generalPage.value.validateForm()) {
    return;
  }

  isPricingDetailsVisible.value = false;


  const currentIndex = selectedTabIndex.value;
  if (currentIndex < tabsState.value.length - 1) {
    tabsState.value[currentIndex + 1] = true; // Enable the next tab
    selectedTabIndex.value = currentIndex + 1; // Move to the next tab
  }

  // Call the createPurchaseOrder method from purchase_order_general
  if (generalPage.value) {
    const createdIDValue = await generalPage.value.createPurchaseOrder();
    isGeneralEditable.value = false;
    router.push({ name: 'purchase-order-update', query: { purchase_order_id: createdIDValue } });
  }
}

const handleCancelClick = () => {
  router.push('/purchase-order');
}

</script>

<template>
  <div class="row header">
    <h3>New Purchase Order<span class="pill">Not Saved</span></h3>
    <div class="row buttons">
      <dx-button class="additional-btn" text="Cancel" type="default" styling-mode="contained" @click="handleCancelClick"/>
      <dx-button class="additional-btn form-btn" text="Save and Next" type="default" @click="handleSaveNextClick"
        styling-mode="contained" />
    </div>
  </div>

  <dx-tab-panel class="main-content" :selected-index="selectedTabIndex" @option-changed="handleTabChange">
    <dx-tab-item title="General" :disabled="!tabsState[0]">
      <purchase_order_general v-model:selectedRowKeys="selectedrowkeys" ref="generalPage"
        :is-editable="isGeneralEditable" />
    </dx-tab-item>


  </dx-tab-panel>
</template>

<style scoped>
.pill {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: 4.5px 8px;
  border-radius: 999px;
  height: 20px;
  background-color: var(--error-pill-bgcolor) !important;
  color: var(--error-pill-color) !important;
  margin-left: 10px;
  display: inline-flex;
    align-items: center;
}

.row.buttons {
  display: flex;
  justify-content: space-between;
}

.row {
  border: none !important;
}

.main-content {
  /* border: 1px solid #e0e0e0; */
  border: 1px solid var(--base-border-color);
  border-radius: 8px;
}

.tab-content {
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
  width: 100%;
}

.additional-btn {
  margin-left: 10px;
}

.form-btn {
  margin-left: auto;
  /* Aligns the button to the right */
}
</style>