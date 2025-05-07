<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { call, createResource } from "frappe-ui";
import DxButton from "devextreme-vue/button";
import Fieldrenderer from "./Fieldrenderer.vue";
import { DxCheckBox, DxTextBox } from "devextreme-vue";
import gridView from "@/components/grid-view.vue";
import SidePanel from "@/components/side-panel.vue"
import { CustomStore } from "devextreme/common/data";
import DxLoadPanel from 'devextreme-vue/load-panel';
import { useRouter } from "vue-router";
import { confirm } from 'devextreme/ui/dialog';

const router = useRouter();

const tableData = ref([]);

const doctype = "Bin Master"
const selectedrowkeys = ref([]);
const formTitle = ref("");
let fieldName = ref([]);
let responseData = ref([]);
const modelValue = ref("");

const fields = reactive([
  { fieldname: "purchase_order_id", fieldtype: "Link", label: "Order", options: [], value: [], required: true, invalid: false },
  { fieldname: "product", fieldtype: "Link", label: "Product", options: [], minSearchLengthOption: 1, required: true, invalid: false },
  { fieldname: "contains_dsd", fieldtype: "Select", label: "Contains DSD", options: "Yes\nNo" },
  { fieldname: "data_bearing", fieldtype: "Select", label: "Data Bearing", options: "Yes\nNo" },
  { fieldname: "scale", fieldtype: "Select", label: "Scale", options: "50\n100\n150" },
  { fieldname: "next_workflow", fieldtype: "Select", label: "Next Workflow", options: "Triage\nAudit\nTesting\nQurantine", required: true, invalid: false },
  { fieldname: "packaging", fieldtype: "Select", label: "Packaging", options: "Pallet\nContainer" },
  { fieldname: "gross", fieldtype: "Int", label: "Gross", required: true, invalid: false },
  { fieldname: "tare", fieldtype: "Int", label: "Tare", default: "1" },
  { fieldname: "net", fieldtype: "Int", label: "Net", required: true, invalid: false },
  { fieldname: "client_gross", label: "Client Gross", fieldtype: "Progress", min: 0, max: 0 },
  { fieldname: "unit_count", fieldtype: "Int", label: "Unit Count" },
  { fieldname: "location", fieldtype: "Link", label: "Location", options: [], default: "", minSearchLengthOption: 1 },
  { fieldname: "client_bin", fieldtype: "Data", label: "Client BIN", value: "data" },
  { fieldname: "notes", fieldtype: "Small Text", label: "Notes" },
]);

const formData = reactive(
  fields.reduce((acc, field) => {
    acc[field.fieldname] = field.default;
    return acc;
  }, {})
);

const toastVisible = ref(false);
const toastMessage = ref('');
const toastType = ref('success');


const toastPosition = ref({
  my: 'top right',
  at: 'top right',
  of: window,
  offset: '-10 60'
});



const Cancel = () => {
  router.push({ name: 'inbound-inquiry' });
};


const Complete = () => {
  const nextTab = 'Triage'.toLowerCase();
  router.push({ name: 'inbound-inquiry', query: { tab: nextTab } });
};

const gridInstance = ref(null);

const onGridReady = (instance) => {
  gridInstance.value = instance;
};

const refreshGrid = () => {
  if (gridInstance.value) {
    gridInstance.value.refresh();
  } else {
    // console.error('Grid instance not available');
  }
};
const dataSource = new CustomStore({
  key: 'name',
  load: async (loadOptions) => {
    let { filter, sort, skip, take } = loadOptions;

    let orderId = formData.purchase_order_id;
    if (!filter) {
      filter = ['purchase_order_id', '=', `${orderId}`]
    }

    const orderBy = sort?.length
      ? sort.map((s) => `${s.selector} ${s.desc ? 'desc' : 'asc'}`).join(',')
      : 'name';

    const params = {
      doctype: doctype,
      fields: JSON.stringify(['*']),
      filters: JSON.stringify(filter),
      limit_start: skip || 0,
      limit_page_length: take || 10,
      order_by: orderBy,
    };

    const resource = createResource({
      url: '/api/method/axe_product.api.doc.get_filtered_data',
      method: 'GET',
      params,
    });

    try {

      const response = await resource.fetch();

      const data = response.message.message.data || [];
      calculateTotals(data);
      setTimeout(() => {
        if (response.message.message.fields) {
          const newFields = response.message.message.fields || [];
          if (JSON.stringify(fieldName.value) !== JSON.stringify(newFields)) {
            fieldName.value = newFields;
          }
        }

        if (JSON.stringify(responseData.value) !== JSON.stringify(data)) {
          responseData.value = data;
        }
      }, 0);
      return {
        data,
        totalCount: response.message.message.total_count || 0,
      };
    } catch (error) {
      // console.error('Error fetching data:', error);
      throw error;
    }
  },
});
const totals = reactive({
  gross: 0,
  tare: 0,
  net: 0,
});
const calculateTotals = (data) => {
  totals.gross = data.reduce((sum, row) => sum + (row.gross || 0), 0);
  totals.tare = data.reduce((sum, row) => sum + (row.tare || 0), 0);
  totals.net = data.reduce((sum, row) => sum + (row.net || 0), 0);
};


let formModified = false;




onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  let purchase_order = urlParams.get('purchase_order_id');
  formData.purchase_order_id = purchase_order;
  fetchOrderDetails(purchase_order);
  // if (urlParams.has('purchase_order_id')) {
  //   urlParams.delete('purchase_order_id');
  //   window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);

  // }
  createResource({
    url: "/api/method/frappe.client.get_list",
    method: "GET",
    params: {
      doctype: 'Purchase Order',
      fields: JSON.stringify(["name"]),
      limit_start: 1
    },
  })
    .fetch()
    .then((response) => {
      if (response.message) {
        const purchaseOrders = response.message.map((order) => order.name);
        fields.forEach((field) => {
          if (field.fieldname === "purchase_order_id") {
            field.options = purchaseOrders;
          }
        });
      }
    })
    .catch((error) => {
      // console.error("Error fetching data:", error);
    });
});


const productDetails = [];
let grossValue;
const fetchOrderDetails = async (orderName) => {
  try {
    const response = await createResource({
      url: "/api/method/axe_product.api.doc.get_data",
      params: {
        doctype: "Purchase Order",
        name: orderName,
      }
    }).fetch();

    if (response.message.message.data) {
      const orderDetails = response.message.message.data;
      productDetails.length = 0;
      productDetails.push(...orderDetails.products || []);

      formTitle.value = orderDetails.account_name;

      grossValue = response.message.message.data.total_gross;

      fields.forEach((field) => {
        if (field.fieldname === "product") {
          field.options = orderDetails.products;
          formData.product = "";
        }
        if (field.fieldname === "location") {
          const locationOptions = orderDetails.locations.map((loc) => loc.location);
          field.options = locationOptions;
          formData.location = locationOptions[0] || "";
          // formData.location = "";
        }
        if (field.fieldname === "client_gross") {
          field.max = grossValue;
          field.value = totalGross;
        }

      });

    };

    formData.data_bearing = "";
    formData.contains_dsd = "";
  }
  catch (error) {
    console.error("Error fetching order details:", error);
    resetForm();
  }

}
const bindProductDetails = (selectedProduct) => {
  const productDetail = productDetails.find((item) => item === selectedProduct);

  if (productDetail) {
    formData.data_bearing = productDetail.is_contains_data === 1 ? "Yes" : "No";
    formData.contains_dsd = productDetail.is_contains_data === 1 ? "Yes" : "No";
  } else {
    formData.data_bearing = "";
    formData.contains_dsd = "";
  }


};


const ValidateForm = () => {
  let isValid = true;

  fields.forEach((field) => {
    if (field.required && (!formData[field.fieldname] || formData[field.fieldname] === '')) {
      field.invalid = true;
      isValid = false;
    } else {
      field.invalid = false;
    }
  });

  return isValid;
};


const validateField = (fieldname) => {
  const field = fields.find(field => field.fieldname === fieldname);
  // console.warn(`Field not found: ${fieldname}`);
  if (!field) return;

  if (field.required && (formData[fieldname] == null || formData[fieldname] === '')) {
    field.invalid = true;
    let message = `${field.label} is required.`
    let type = 'error';
    // console.log('Validation Error:', message);
    showToast(message, type);

  } else {
    field.invalid = false;
  }

};

const isAddButtonDisabled = ref(false);
const totalGross = computed(() => totals.gross);
const totalTare = computed(() => totals.tare);
const totalNet = computed(() => totals.net);
const handleValueUpdate = (fieldname, value) => {
  formData[fieldname] = value;
};

const addRowToBackend = async () => {
  if (!ValidateForm()) {
    showToast("Please fill the mandatory fields to add Bin", "error")
    return
  }
  fields.forEach((field) => {
    if (field.fieldname === "client_gross") {
      const grossFieldValue = parseFloat(formData["gross"]) || 0;
      const currentTotalGross = parseFloat(totalGross.value) || 0;

      console.log("Checking condition with values:", {
        grossValue,
        currentTotalGross,
        grossFieldValue,
        sum: currentTotalGross + grossFieldValue,
      });

      if (currentTotalGross + grossFieldValue > grossValue) {
        showToast("Can't add BIN, gross exceeds the Order's Gross limit.", "error");
        resetForm();
        throw new Error("Gross exceeds limit");
      }
    }
  });



  try {
    const productData = [
      {
        doctype: "Product Item Child",
        product: formData.product,

      },
    ];

    const newData = {
      doctype: "Bin Master",
      ...formData,
      product_table: productData,

    };

    const doc = await call("frappe.client.insert", { doc: newData });
    if (doc.name) {
      reloadTableData();
      refreshGrid();
      formModified = false;
      if (!isNaN(formData.gross)) {
        formData.client_gross = formData.gross.toString();
      }
      resetForm();
      showToast("BIN added successfully!", "success");
    } else {
      // console.error("Failed to insert row. Response:", doc);
    }
  } catch (error) {
    // console.error("Error adding row:", error);
    showToast("Failed to add BIN. Please try again.", "error");
    resetForm();

  }
};

const resetForm = () => {
  fields.forEach((field) => {
    if (field.fieldname !== "purchase_order_id")
      formData[field.fieldname] = field.default || "";
  });
}
const updateSelectedRowKeys = (newSelectedKeys) => {
  selectedrowkeys.value = newSelectedKeys;

};

const confirmDelete = async (rowId) => {
  // Display a single confirmation dialog for each row
  const userConfirmed = await confirm(`Are you sure you want to delete : ${rowId}?`, "Delete Confirmation");
  if (userConfirmed) {
    try {
      await deleteRowFromBackend(rowId);
      showToast(` ${rowId} deleted successfully.`, 'success');
    } catch (error) {
      showToast(`Error deleting  ${rowId}. Please try again.`, 'error');
      console.error(`Error deleting  ${rowId}:`, error);
    }
  } else {
    showToast(`Deletion cancelled for  ${rowId}.`, 'Warning');
  }
};
const deleteSelectedRowsFromBackend = async () => {
  try {
    await Promise.all(selectedrowkeys.value.map((rowId) => confirmDelete(rowId)));
  } catch (error) {
    // console.error("Error deleting selected rows:", error);
  }
};

const reloadTableData = () => {
  dataSource.load()
    .then((response) => {
      tableData.value = [...response.data];
      refreshGrid();
      selectedrowkeys.value = [];
    })
    .catch((error) => {
      // console.error("Error fetching table data:", error);
    });
};

const deleteRowFromBackend = async (name) => {
  try {

    const response = await call("frappe.client.delete", {
      doctype: "Bin Master",
      name,
    });
    // alert(`deleted ${name} record successfully`);
    reloadTableData();

  } catch (error) {
    // console.error(`Error deleting row with name ${name}:`, error);
    throw error;
  }
};


const searchOrders = async (searchTerm) => {
  if (!searchTerm || searchTerm.length <= 1) return;
  try {
    const resource = createResource({
      url: '/api/method/frappe.desk.search.search_link',
      method: 'GET',
      params: {
        doctype: 'Purchase Order',
        txt: searchTerm,
        page_length: 5,
      },
    });

    const response = await resource.fetch();
    if (response.message) {
      const newOptions = response.message.map((order) => order.value);
      fields.forEach((field) => {
        if (field.fieldname === "purchase_order_id") {
          field.options = newOptions;

        }
      })
    }
  } catch (error) {
    // console.error('Error searching orders:', error);
  }
};

const grossUpdate = (newGross) => {
  fields.forEach((field) => {
    if (field.fieldname === "client_gross") {
      formData[field.fieldname] = (formData[field.fieldname] || 0) + newGross;
      if (field.max - formData[field.fieldname] === 0) {
        isAddButtonDisabled.value = true;
        showToast("No more BIN can be Created for this order..", "warning");
      } else {
        isAddButtonDisabled.value = false;
      }
    }
  });
}

watch(
  () => formData.purchase_order_id,
  (newValue) => {
    if (newValue) {
      fetchOrderDetails(newValue);
      // grossUpdate();
    } else {
      fetchOrderDetails('');
      formTitle.value = '';
      formData.product = '';
      formData.location = '';
      fields.forEach((field) => {
        if (field.fieldname !== 'purchase_order_id') {
          formData[field.fieldname] = field.default || '';
        }
        if (field.fieldname === 'client_gross') {
          field.max = 0;
        }
      });
    }
    refreshGrid();

  }
);

watch(
  () => formData.product,
  (newValue) => {
    if (newValue) {
      bindProductDetails(newValue);
    } else {
      formData.data_bearing = "";
      formData.contains_dsd = "";
    }
  }
);

watch(totalGross, (newGross) => {
  if (newGross > 0) {
    grossUpdate(newGross);
  } else {
    isAddButtonDisabled.value = false;
  }
});

watch(dataSource, (newValue, oldValue) => {
  if (!formModified) {
    formModified = true;
  }
  if (formModified) {
    validateField('purchase_order_id');
    validateField('next_workflow');
    validateField('gross');
    validateField('net');
  }
}, { deep: true });

watch(
  () => formData.gross,
  (newValue) => {
    const tareValue = formData.tare || 100;
    if (newValue > tareValue) {
      formData.net = newValue - tareValue;
    }
  }

);

const isPanelOpen = ref(false);

function openPanel() {
  isPanelOpen.value = true;
  document.querySelector(".view-wrapper").classList.add("with-side-panel");
}

function closePanel() {
  isPanelOpen.value = false;
  document.querySelector(".view-wrapper").classList.remove("with-side-panel");
}

</script>

<template>
  <div class="view-wrapper">
    <div class="row">
      <h3>Material Checkin</h3>
    </div>
    <dx-toast :visible.sync="toastVisible" :message="toastMessage" :type="toastType" :display-time="3000" :height="55"
      :width="300" :position="toastPosition" />
    <div class="button-container">
      <dx-button class="additional-btn" text="COMPLETE" type="default" styling-mode="contained" @click="Complete" />
      <dx-button class="additional-btn" text="CANCEL" type="default" styling-mode="contained" @click="Cancel" />
      <dx-button class="additional-btn" text="EDIT" type="default" styling-mode="contained" />
      <dx-button class="additional-btn" text="VIEW" type="default" styling-mode="contained" />
      <dx-button class="additional-btn" text="ORDER PICTURES" type="default" styling-mode="contained" />
      <dx-button class="additional-btn" text="ACTIVITY LOG" type="default" styling-mode="contained" />
      <dx-check-box class="auto-print" text="Auto Print" :value="false" styling-mode="outlined">
      </dx-check-box>
    </div>
    <span class="row-order" v-if="formData.purchase_order_id && formTitle !== ''">
      <h5>ORDER ID : {{ formData.purchase_order_id }} - {{ formTitle }}</h5>
    </span>
    <div class="fields-container">
      <div class="left-column">
        <Fieldrenderer class="field" v-for="field in fields.slice(0, 10)" :key="field.fieldname" :field="field"
          v-model="formData[field.fieldname]" @trigger-search="searchOrders"
          @update:modelValue="(value) => handleValueUpdate(field.fieldname, value)" :recieved_value="totals" />
      </div>
      <div class="right-column">
        <Fieldrenderer class="field" v-for="field in fields.slice(10)" :key="field.fieldname" :field="field"
          v-model="formData[field.fieldname]" @update:modelValue="(value) => handleValueUpdate(field.fieldname, value)"
          :recieved_value="totals" />
      </div>
    </div>
    <div class="table-container">
      <div class="button-container">
        <dx-button class="additional-btn" text="ADD" type="default" styling-mode="contained" @click="addRowToBackend"
          :disabled="isAddButtonDisabled" />
        <dx-button class="additional-btn delete-btn" text="DELETE" type="default" styling-mode="contained"
          @click="deleteSelectedRowsFromBackend" />
        <dx-button class="additional-btn" text="PRINT UID" type="default" styling-mode="contained" />
      </div>



      <div class="dx-card details-card" id="card-tasks">
        <dx-load-panel :show-pane="false" width="auto" container="#card-tasks" :position="{ of: '#card-tasks' }" />
        <gridView :data-source="dataSource" :fields="fieldName" :doctype="doctype"
          @update:selectedRowKeys="updateSelectedRowKeys" @gridReady="onGridReady" />
      </div>

      <div class="totals-container">
        <div class="total-row">
          <label>Total Gross:</label>
          <dx-text-box :value=totalGross.toString() :read-only="true" w-50 />
        </div>
        <div class="total-row">
          <label>Total Tare:</label>
          <dx-text-box :value=totalTare.toString() :read-only="true" />
        </div>
        <div class="total-row">
          <label>Total Net:</label>
          <dx-text-box :value=totalNet.toString() :read-only="true" />
        </div>
      </div>
    </div>

    <div class="trigger-arrow" @click="openPanel">
      <dx-button class="arrow-btn" icon="chevronleft" styling-mode="text" locate-in-menu="never" />
    </div>
    <SidePanel :isOpen="isPanelOpen" @close="closePanel" />
  </div>
  <div class="arrow"><span>21 Days Left</span></div>
</template>

<style scoped lang="scss">
@use "@/variables" as *;
@use "sass:math";

@media only screen and (max-width: 875px) {
  :deep(.contact-name-toolbar-item) {
    min-width: calc(var(--left-panel-width) + var(--right-panel-width) - 145px);
  }
}

.view-wrapper {
  padding-top: var(--content-padding);
  padding-bottom: var(--content-padding);
  transition: margin-right 400ms ease-in-out;
}

.view-wrapper.with-side-panel {
  margin-right: 400px;
}

.button-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: flex-start;
  align-items: center;
  padding: 20px 0;
}

.auto-print{
  margin-left: 10px;
}

@media only screen and (max-width: 850px) {
  .button-container{
    gap:12px
  }
//   .auto-print{
//   margin-left: 0;
// }
}


.table-container {
  margin-top: 20px;
}

.fields-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5%;
  margin-left: 15px;
}

.field {
  flex: 1 1 calc(48% - 1rem);
  max-width: calc(48% - 1rem);
  min-width: 250px;
  padding-bottom:12px
}

@media (max-width: 1200px) {
  .field {
    flex: 1 1 calc(48% - 1rem);
    max-width: calc(48% - 1rem);
  }
}

@media (max-width: 768px) {
  .field {
    flex: 1 1 100%;
    max-width: 100%;
  }
}

.totals-container {
  display: block;
  gap: 12px;
  width: 348px;
  margin-bottom: 50px;
}

.total-row {
  display: grid;
}

.total-row label {
  margin-top: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.total-row dx-text-box {
  width: 100%;
}


.view-wrapper label {
  font-weight: bold;
}

.trigger-arrow {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translate(50%, -50%);
  background-color: var(--base-bg);
  border: 1px solid #ccc;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trigger-arrow:hover {
  background-color: var(--base-bg);
  border-color: #ccc;
}


//   .arrow-icon {
//     font-size: 16px;
//     color: #333;
//   }
// }

@media (max-width: 550px) {
  .trigger-arrow {
    display: none;
  }
}

.arrow {
  --s: 15px;
  padding-inline: .3em calc(var(--s) + .3em);
  clip-path: polygon(0 0, calc(100% - var(--s)) 0, 100% 50%, calc(100% - var(--s)) 100%, 0 100%);
  color: white;
  background: #41810e;
  font-weight: bold;
  width: fit-content;
  transform: rotate(180deg);
  position: absolute;
  top: 87px;
  right: 5px;
  line-height: 2.4;
  font-size: 12px;
}

.arrow span {
  display: inline-block;
  transform: rotate(-180deg);
}

@media (max-width: 820px) {
  .arrow {
    display: none;
  }
}

</style>
