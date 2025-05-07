<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { DxButton } from 'devextreme-vue/button';
import { DxTabPanel } from 'devextreme-vue/tab-panel';
import { DxItem as DxTabItem } from 'devextreme-vue/tabs';
import { createResource } from "frappe-ui";
import { useRouter } from 'vue-router';

import purchase_order_documents from './purchase_order_documents.vue';
import purchase_order_general from './purchase_order_general.vue';
import purchase_order_pricing from './purchase_order_pricing.vue';
import purchase_order_pricing_attribute from './purchase_order_pricing_attribute.vue';
import purchase_order_pricing_details from './purchase_order_pricing_details.vue';
import purchase_order_product_service from './purchase_order_product_service.vue';
import purchase_order_services from './purchase_order_services.vue';

const router = useRouter();

const urlParams = new URLSearchParams(window.location.search);
let created_purchase_order = urlParams.get('purchase_order_id');
let isHome = urlParams.get('direct');

const selectedTabIndex = ref(0);
const selectedrowkeys = ref([]);
const createdID = ref(null);
const generalPage = ref(null);
const servicePage = ref(null);
const documentPage = ref(null);
const isPricingDetailsVisible = ref(false);
const isPricingAttributesVisible = ref(false);
const isPricingServiceVisible = ref(false);
const itemName = ref(null)
const itemID = ref(null)
const isGeneralEditable = ref(true);
const selectedRowData = ref(null);
const orderStatus = ref(null)

const fetchstatus = async () => {
  try {
    const status = await createResource({
      url: "frappe.client.get_list",
      params: {
        doctype: "Purchase Order",
        fields: JSON.stringify(["name", "status"]), // Ensure 'status' field is included
        filters: JSON.stringify([["name", "=", created_purchase_order]]), // Use actual Purchase Order ID
      },
    }).fetch();

    const statusData = status?.[0]?.status; // Ensure safe access to status
    // console.log(statusData);
    orderStatus.value = statusData
  } catch (error) {
    console.error("Error fetching status:", error);
  }
};

function handleTabChange(e) {

  if (e.name === 'selectedIndex') {
    if (isPricingViewActive.value && e.value !== 1) {
      selectedTabIndex.value = 1;
      return;
    }
    selectedTabIndex.value = e.value;
  }
}

async function handleSaveNextClick() {

  // if (isSaveNextButtonDisabled.value) {
  //   showToast("Please complete the Pricing step before proceeding.", "warning");
  //   return;
  // }

  if (!generalPage.value.validateForm()) {
    return;
  }

  const currentIndex = selectedTabIndex.value;

  if (currentIndex < 3) {
    selectedTabIndex.value = currentIndex + 1;
  }

  if (isPricingDetailsVisible.value || isPricingAttributesVisible.value || isPricingServiceVisible.value) {
    isPricingDetailsVisible.value = false;
    isPricingAttributesVisible.value = false;
    isPricingServiceVisible.value = false;
    selectedTabIndex.value = 2; // Move to Service tab
    return;
  }

  if (generalPage.value && currentIndex === 0) {
    const createdIDValue = await generalPage.value.updatePurchaseOrder();
    await nextTick();
    // isGeneralEditable.value = false;
    createdID.value = Date.now();

    if (createdIDValue) {
      isPricingDetailsVisible.value = false;
    }
  }

  if (servicePage.value && currentIndex === 2) {
    await servicePage.value.updatePurchaseOrderService();
  }

  if (documentPage.value && currentIndex === 3) {
    await documentPage.value.updatePurchaseOrderDocuments();
  }

  if (currentIndex === 3) {
    router.push('/purchase-order');
    return;
  }

}

const saveButtonText = computed(() => {
  return selectedTabIndex.value === 3 ? "Finish" : "Save and Next";
});

const handleRowClick = (data) => {
  selectedRowData.value = data;
  isPricingDetailsVisible.value = true;
};

const handleAttributesBackClick = () => {
  isPricingAttributesVisible.value = false;
  isPricingDetailsVisible.value = true;
};

const handleServicesBackClick = () => {
  isPricingServiceVisible.value = false;
  isPricingDetailsVisible.value = true;
};

const handleAddClick = (data) => {
  isPricingDetailsVisible.value = false;
  isPricingServiceVisible.value = false;
  isPricingAttributesVisible.value = true;
  itemName.value = data.stockedAs
  itemID.value = data.stockedASName
};

const handleServiceClick = (purchase_order_stocked_as) => {
  isPricingDetailsVisible.value = false;
  isPricingAttributesVisible.value = false;
  isPricingServiceVisible.value = true;
  itemName.value = purchase_order_stocked_as
};

const handleBackClick = () => {
  isPricingDetailsVisible.value = false;
};

const handlePricingBackClick = () => {
  isPricingDetailsVisible.value = false;
  isPricingAttributesVisible.value = false;
  isPricingServiceVisible.value = false;
}

const isSaveNextButtonDisabled = computed(() => {
  return isPricingDetailsVisible.value || isPricingAttributesVisible.value || isPricingServiceVisible.value;
});

const purchaseOrderDetailsId = ref(null);
const purchaseOrderAttributesDetailsId = ref(null);

const handlePurchaseOrderDetailsId = (id) => {
  purchaseOrderDetailsId.value = id;
};

const handlePurchaseOrderAttributeDetailsId = (id) => {
  purchaseOrderAttributesDetailsId.value = id;
};

const handleCancelClick = () => {
  router.push('/purchase-order');
}

watch(() => created_purchase_order, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    createdID.value = Date.now();
  }
});

const isPricingViewActive = computed(() => {
  return isPricingDetailsVisible.value || isPricingAttributesVisible.value || isPricingServiceVisible.value;
});

const statusClass = computed(() => {
  switch (orderStatus.value) {
    case "Active":
      return "active-status";
    case "Completed":
      return "completed-status";
    case "Pending":
      return "pending-status";
    default:
      return "default-status";
  }
});

onMounted(() => {
  if (created_purchase_order) {
    selectedTabIndex.value = isHome ? 0 : 1; // Show "General" tab if isHome exists
  }
  fetchstatus()
});

</script>

<template>
  <div class="row header">
    <h3>{{ created_purchase_order }}<span class="pill" :class="statusClass">{{ orderStatus }}</span></h3>
    <div class="row buttons">
      <dx-button class="additional-btn" text="Cancel" type="default" styling-mode="contained"
        @click="handleCancelClick" />

      <dx-button :text="saveButtonText" type="default" @click="handleSaveNextClick" class="additional-btn form-btn"
        styling-mode="contained" />
    </div>
  </div>

  <dx-tab-panel class="main-content" :selected-index="selectedTabIndex" @option-changed="handleTabChange">

    <dx-tab-item title="General">
      <purchase_order_general v-model:selectedRowKeys="selectedrowkeys" ref="generalPage"
        :disabled="isPricingViewActive" :created_purchase_order="created_purchase_order" />
    </dx-tab-item>

    <dx-tab-item title="Pricing">
      <purchase_order_pricing v-model:selectedRowKeys="selectedrowkeys" :tab_purchase_order_id="created_purchase_order"
        :key="createdID"
        v-if="created_purchase_order && !isPricingDetailsVisible && !isPricingAttributesVisible && !isPricingServiceVisible"
        @row-click="handleRowClick" />
      <purchase_order_pricing_details v-if="isPricingDetailsVisible" :rowData="selectedRowData" @back="handleBackClick"
        :key="createdID" @add_attribute="handleAddClick" @add_service="handleServiceClick"
        @send_purchase_order_details_id="handlePurchaseOrderDetailsId"
        @send_purchase_order_attribute_details_id="handlePurchaseOrderAttributeDetailsId" />
      <purchase_order_pricing_attribute v-if="isPricingAttributesVisible" @back="handleAttributesBackClick"
        @back_to_pricing="handlePricingBackClick" :purchase_order_details_id="purchaseOrderDetailsId"
        :itemName="itemName" :itemID="itemID" :purchase_order_attribute_details_id="purchaseOrderAttributesDetailsId" />
      <purchase_order_product_service v-if="isPricingServiceVisible" @back="handleServicesBackClick"
        @back_to_pricing="handlePricingBackClick" :purchase_order_details_id="purchaseOrderDetailsId"
        :itemName="itemName" />
    </dx-tab-item>

    <dx-tab-item title="Service">
      <purchase_order_services :tab_purchase_order_id="created_purchase_order" ref="servicePage"
        :disabled="isPricingViewActive" />
    </dx-tab-item>

    <dx-tab-item title="Documents">
      <purchase_order_documents :tab_purchase_order_id="created_purchase_order" :disabled="isPricingViewActive"
        ref="documentPage" />
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
  /* background-color: var(--draft-pill-bgcolor) !important;
  color: var(--draft-pill-color) !important; */
  margin-left: 10px;
  display: inline-flex;
  align-items: center;
}

.default-status {
  background-color: var(--draft-pill-bgcolor) !important;
  color: var(--draft-pill-color) !important;
}

.active-status {
  background-color: #e4f5e9 !important;
  color: #16794c !important;
}

.row {
  border: none !important;
}

.row.buttons {
  display: flex;
  justify-content: space-between;
}

.main-content {
  border: 1px solid var(--base-border-color);
  border-radius: 8px;
  margin-bottom: 20px !important;
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
