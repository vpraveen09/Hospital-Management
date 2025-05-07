<script setup>
import { ref, reactive, computed, onMounted, watch, inject } from "vue";
import { call, createResource } from "frappe-ui";
import DxButton from "devextreme-vue/button";
// import Fieldrenderer from "./Fieldrenderer.vue";
// import { DxCheckBox, DxTextBox } from "devextreme-vue";
import gridView from "@/components/grid-view.vue";
import SidePanel from "@/components/side-panel.vue"
import { CustomStore } from "devextreme/common/data";
import DxLoadPanel from 'devextreme-vue/load-panel';
import { useRoute, useRouter } from "vue-router";
import { confirm } from 'devextreme/ui/dialog';
import DxProgressBar from "devextreme-vue/progress-bar";
import NumberField from "./NumberField.vue";
import {
  DxForm,
  DxItem as DxFormItem,
  DxGroupItem as DxFormGroupItem,
  DxColCountByScreen,
  DxRequiredRule
} from 'devextreme-vue/form';

import DxTextBox from "devextreme-vue/text-box";
import DxNumberBox from 'devextreme-vue/number-box';
import DxTextArea from "devextreme-vue/text-area";
import DxSelectBox from "devextreme-vue/select-box";
import { userResource } from "@/stores/user";
const router = useRouter();
const showToast = inject('showToast');
const tableData = ref([]);

const doctype = "Bin Master"
const selectedrowkeys = ref([]);
const formTitle = ref("");
let fieldName = ref([]);
let responseData = ref([]);

const urlParams = new URLSearchParams(window.location.search);

const fields = reactive([
  { fieldname: "order_id", fieldtype: "Link", label: "Order", options: [], value: [], required: true, invalid: false },
  { fieldname: "product", fieldtype: "Link", label: "Product", options: [], minSearchLengthOption: 1, required: true, invalid: false },
  { fieldname: "contains_dsd", fieldtype: "Select", label: "Contains DSD", options: "Yes\nNo" },
  { fieldname: "data_bearing", fieldtype: "Select", label: "Data Bearing", options: "Yes\nNo" },
  { fieldname: "scale", fieldtype: "Select", label: "Scale", options: "Receiving Dock 1\nReceiving Dock 2" },
  { fieldname: "next_workflow", fieldtype: "Select", label: "Next Workflow", options: "Triage\nAudit\nTesting\nQurantine", required: true, invalid: false },
  { fieldname: "packaging", fieldtype: "Select", label: "Packaging", options: "Pallet\nGaylord\nHD Box\nHopper\nBucket" },
  { fieldname: "gross", fieldtype: "Int", label: "Gross", required: true, invalid: false },
  { fieldname: "tare", fieldtype: "Int", label: "Tare", default: "" },
  { fieldname: "net", fieldtype: "Int", label: "Net", required: true, invalid: false },
  { fieldname: "client_gross", label: "Client Gross", fieldtype: "Progress", min: 0, max: 0 },
  { fieldname: "unit_count", fieldtype: "Int", label: "Unit Count" },
  { fieldname: "location", fieldtype: "Link", label: "Location", options: [], default: "", minSearchLengthOption: 1 },
  { fieldname: "client_bin", fieldtype: "Data", label: "Client BIN", value: "data" },
  { fieldname: "bin_id", fieldtype: "Data", label: "BIN ID", value: "data" },
  { fieldname: "notes", fieldtype: "Small Text", label: "Notes" },
]);

const isValidationTriggered = ref(false);

let locationOptions = ref([]);

const productOptions = computed(() => {
  return fields.find(field => field.fieldname === 'product').options;
});
//  locationOptions.value = computed(() => {
//   return fields.find(field => field.fieldname === 'location').options;
// });

const scaleOptions = computed(() => {
  return fields.find(field => field.fieldname === 'scale').options.split('\n');
});

const orderOptions = ref([]);

const packagingOptions = computed(() => {
  return fields.find(field => field.fieldname === 'packaging').options.split('\n');
});

const workflowOptions = computed(() => {
  return fields.find(field => field.fieldname === 'next_workflow').options.split('\n');
});

const DSDoptions = computed(() => {
  return fields.find(field => field.fieldname === 'contains_dsd').options.split('\n');
});

const dataBearingOptions = computed(() => {
  return fields.find(field => field.fieldname === 'data_bearing').options.split('\n');
});




const formData = reactive(
  fields.reduce((acc, field) => {
    acc[field.fieldname] = field.default;
    return acc;
  }, {})
);

const receivedGross = computed(() => formData.order_id ? totalGross.value : 0);
const toastVisible = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const route = useRoute();

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

    let orderId = formData.order_id || '';
    if (!filter) {
      filter = ['order_id', '=', `${orderId}`]
    }

    const orderBy = sort?.length
      ? sort.map((s) => `${s.selector} ${s.desc ? 'desc' : 'asc'}`).join(',')
      : 'name desc';
    // if(formData.order_id){


    const params = {
      doctype: doctype,
      fields: JSON.stringify(['name']),
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
      const data = response.message.data || [];

      calculateTotals(data);

      if (response.message.fields) {
        const newFields = response.message.fields || [];
        if (JSON.stringify(fieldName.value) !== JSON.stringify(newFields)) {
          fieldName.value = newFields;
        }
      }

      if (JSON.stringify(responseData.value) !== JSON.stringify(data)) {
        responseData.value = data;
      }

      return {
        data,
        totalCount: response.message.total_count || 0,
      };
    } catch (error) {
      // console.error('Error fetching data:', error);
      throw error;
    }
    // }
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

const submitForm = async () => {
  if (!ValidateForm()) {
    showToast("Please fill the mandatory fields to add Bin", "error")
    return
  }
  const formDataToSend = {
    bin_id:formData.bin_id,
    order_id: formData.order_id,
    location: formData.location,
    scale: formData.scale,
    packaging: formData.packaging,
    gross: formData.gross,
    tare: formData.tare,
    net: formData.net,
    client_bin: formData.client_bin,
    notes: formData.notes,
    quantity: formData.unit_count,
    next_workflow: formData.next_workflow,
    products: [{
      product_id: formData.product,
      weight: formData.gross,
      quantity: formData.unit_count
    }]
  };
  console.log("formData", formDataToSend);

  try {
    const response = await createResource({
    url:isEdit?"/api/method/axe_product.api.doc.update_bin_and_material_checkin":"/api/method/axe_product.api.doc.insert_bin_and_material_checkin",
    method: "POST", params: { data: formDataToSend }
    }).submit();
    if(isEdit){
      showToast("BIN Updated successfully!", "success");
    }
    else{
      showToast("BIN added successfully!", "success");

    }
    console.log("Insert successful", response);
    resetForm();
    refreshGrid();
    calculateTotals();

  } catch (error) {
    console.error("Error inserting data", error);
  }
};

const fetchOrders = async () => {
  try {

    const response = await createResource({
      url: "/api/method/frappe.client.get_list",
      method: "GET",
      params: {
        doctype: "Inbound Inquiry",
        fields: JSON.stringify(["name"]),
      },
    }).fetch();


    if (response) {
      orderOptions.value = response.map(order => order.name);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
onMounted(fetchOrders);
onMounted(() => {
  if (urlParams.has('order_id')) {
    let inbound_order = urlParams.get('order_id');
    formData.order_id = inbound_order;
    fetchOrderDetails(inbound_order);
    fields.forEach((field) => {
      if (field.fieldname === 'client_gross') {
        field.max = grossValue.value;
        field.value = progressValue;
        console.log("gross", grossValue.value);
        console.log("Progress", progressValue.value);
        console.log("Total", totalGross.value);
        console.log("field.max", field.max);
        console.log("fieldValue", field.value)
      }
    })
    // grossUpdate();
  }
  // if (urlParams.has('order')) {
  //   urlParams.delete('order');
  //   window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);

  // }
});

let workflowDisabled;
const productDetails = ref([]);
const grossValue = ref('');

const fetchOrderDetails = async (orderName) => {
  try {
    const response = await createResource({
      url: "/api/method/axe_product.api.doc.get_order_details",
      params: { order_id: orderName },
    }).fetch();


    if (response) {
      const orderDetails = response;

      console.log("Estimate Weight:", orderDetails.order?.estimate_weight);
      grossValue.value = orderDetails.order?.estimate_weight || 0;

      productDetails.value = orderDetails.products || [];
      if (orderDetails.order?.account) {
        let Account = await createResource({
          url: "/api/method/frappe.client.get",

          params: {
            doctype: "Accounts",
            name: orderDetails.order?.account,
          },
        }).fetch();
        formTitle.value = Account.account_name;
      }
      workflowDisabled = computed(() => {
        if (orderDetails.order?.order_type === "Open Order" && !orderDetails.order?.purchase_order) {
          formData.next_workflow = "Qurantine";
          return true;
        }
        formData.next_workflow = "";
        return false;
      });
      // console.log(grossValue.value);
      fields.forEach((field) => {
        if (field.fieldname === "product") {
          field.options = orderDetails.products || [];
          // console.log("Product Options:", field.options);
          formData.product = "";
        } if (field.fieldname === "location") {
          locationOptions.value = [orderDetails.order?.location || ""];
          field.options = locationOptions;
          // ? orderDetails.order.location 
          // : [orderDetails.order?.location || ""];
        }

      });

      formData.location = orderDetails.order?.location || "";

    }
  } catch (error) {
    console.error("Error fetching order details:", error);
    resetForm();
  }
};

const bindProductDetails = (selectedProduct) => {
  const productDetail = productDetails.value.find((item) => item.name === selectedProduct);
  if (productDetail) {
    formData.data_bearing = productDetail.data_bearing;
    formData.contains_dsd = productDetail.contains_dsd;
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
  if (!field) return;

  if (field.required && (formData[fieldname] == null || formData[fieldname] === '')) {
    field.invalid = true;
    let message = `${field.label} is required.`
    let type = 'error';
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
};

const resetForm = () => {
  fields.forEach((field) => {
    if (field.fieldname !== "order_id")
      formData[field.fieldname] = field.default || "";
  });
}
const updateSelectedRowKeys = (newSelectedKeys) => {
  selectedrowkeys.value = newSelectedKeys;
};
const fetchProductData = async () => {
  const confirmed = await confirm(`Are you sure you want to get Other Products :`, "Data Confirmation");

  if (confirmed) {
    try {
      const user= await userResource.fetch();
      console.log(user);

      const userRoles = await createResource({
      url:"frappe.client.get_list",
      params:{
        doctype: "User",
        filters: { name:user},
        fields:JSON.stringify(["*"]) 
      },
      auto:true
      
    });
  if(userRoles){
    if (!userRoles.message.roles.includes("Workflow Manager")) {
      showToast("Access Denied! You must be a Workflow Manager to fetch data.", "Warning");
      return;
    }
  }
      const response= await createResource({
        url: "/api/method/frappe.client.get_value",
        method: "GET",
        params: {
          doctype: "Product Master",
          fields: JSON.stringify(["name","name1","default_contains_dsd AS contains_dsd","default_data_bearing AS data_bearing"]),
        },
        auto:true
      }).fetch();
      if(response){
        console.log(response)
       Object.assign(productOptions.value,response);
      }
    } catch(error){
      console.log(error);
      showToast(`Data Fetching Failed `, 'Warning');
    }
  }
}
const confirmDelete = async (rowId) => {
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

    const response = await createResource({
      url: "/api/method/axe_product.api.doc.delete_bin",
      params: { bin_id: name },
    }).submit();
    reloadTableData();

  } catch (error) {
    // console.error(`Error deleting row with name ${name}:`, error);
    throw error;
  }
};


const searchOrders = async (searchTerm) => {
  // console.log("order value changed",searchTerm)
  // if (!searchTerm || searchTerm.length <= 1) return;
  // try {
  // console.log(searchTerm);

  // const resource = createResource({
  //   url: '/api/method/frappe.desk.search.search_link',
  //   method: 'GET',
  //   params: {
  //     doctype: 'Inbound Inqiry',
  //     txt: searchTerm,
  //     page_length: 5,
  //   },
  //   auto:true
  // });

  //   const response = await resource.fetch();
  //   if (response.message) {
  //     const newOptions = response.message.map((order) => order.name);
  //     orderOptions.value = newOptions;
  //   }
  // } catch (error) {
  // console.error('Error searching orders:', error);
  // }
};

const grossUpdate = (newGross) => {
  fields.forEach((field) => {
    if (field.fieldname === "client_gross") {
      receivedGross.value = receivedGross + newGross;
      if (receivedGross.value - remainingGross.value === 0) {
        isAddButtonDisabled.value = true;
        showToast("No more BIN can be Created for this order..", "warning");
      } else {
        isAddButtonDisabled.value = false;
      }
    }
  });
}
const isEdit = ref(false);
const editSelectedRow = () => {
  if (selectedrowkeys.value.length > 0) {
    const selectedKey = selectedrowkeys.value[0];
    isEdit.value = true;
    try {
      const selectedItem = responseData.value.find((item) => item.name === selectedKey);
      if (selectedItem) {
        console.log(selectedItem);
        formData.bin_id=selectedItem.name;
        formData.order_id = selectedItem.checkin_order;
        formData.gross = selectedItem.gross;
        formData.tare = selectedItem.tare;
        formData.next_workflow = selectedItem.next_workflow;
        if (formData.next_workflow !== 'Qurantine') {
          workflowDisabled = false;
        }
        formData.product = selectedItem.product_id;
        formData.scale = selectedItem.scale;
        formData.unit_count = selectedItem.unit_count;
        formData.packaging = selectedItem.packaging;
      } else {
        console.warn('Selected item not found in loaded data.');
      }
    } catch (error) {
      console.error('Error finding selected row:', error);
    }
  } else {
    console.warn('No row selected.');
  }
}

const progressValue = computed(() => {
  return formData.order_id ? totalGross.value : 0;
});

const remainingValue = computed(() => {
  return formData.order_id ? (grossValue.value - totalGross.value) : 0;
});


const ruleCheck = () => {
  if (formData.product && formData.contains_dsd && formData.data_bearing) {
    const params = {
      doctype: "Product Master",
      name1: formData.product,
      default_contains_dsd: formData.contains_dsd,
      default_data_bearing: formData.data_bearing,
    };
    const response = createResource({
      url: "frappe.client.get_list",
      params: params,
      fields: JSON.stringify(["name"])
    }).fetch();
  }

}

watch(
  () => formData.order_id,
  (newValue) => {
    if (newValue) {
      if (urlParams.has('order_id')) {
        const query = { ...route.query, order_id: newValue };
        router.replace({ query });
      }
      fetchOrderDetails(newValue);
      refreshGrid();
    } else {
      fetchOrderDetails('');
      formTitle.value = '';
      formData.product = '';
      formData.location = '';
      formData.client_gross = ''
      fields.forEach((field) => {
        if (field.fieldname !== 'order') {
          formData[field.fieldname] = field.default || '';
        }
        if (field.fieldname === 'client_gross') {
          grossValue.value = ''
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

["product", "contains_dsd", "data_bearing"].forEach((field) => {
  watch(
    () => formData[field],
    () => {
      ruleCheck(); // Check if all values exist before making an API call
    }
  );
});
watch(totalGross, (newGross) => {
  if (newGross > 0) {
    // grossUpdate(newGross);
  } else {
    isAddButtonDisabled.value = false;
  }
});

watch(dataSource, (newValue, oldValue) => {
  if (!formModified) {
    formModified = true;
  }
  if (formModified) {
    validateField('order_id');
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

watch([progressValue, remainingValue], ([newReceived, newGross]) => {
  console.log("Updated: ", newReceived, "newRemains", newGross.value);
});


</script>

<template>
  <div class="view-wrapper">
    <div class="row">
      <h3>Receiving-Material Checkin</h3>
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
    <span class="row-order" v-if="formData.order_id && formTitle !== ''">
      <h5>ORDER ID : {{ formData.order_id }} - {{ formTitle }}, {{ formData.location }}</h5>
    </span>
    <div class="fields-container">
      <!-- <div class=""> -->
      <dx-form class="plain-styled-form dx-form form-container">
        <dx-form-group-item :col-count="2">
          <dx-col-count-by-screen :xs="1" :sm="1" :md="2" :lg="2" />
          <dx-form-item css-class="accent">
            <label class="form-label"> Order <span class="required">*</span></label>
            <dx-select-box v-model="formData.order_id" placeholder="" :search-enabled="true" :show-clear-button="true"
              :items="orderOptions" @value-changed="searchOrders"
              :class="{ 'is-invalid': !formData.order_id && isValidationTriggered }" class="p-2 border rounded-md"
              styling-mode="outlined" :min-search-length="2" :show-data-before-search="true" />
          </dx-form-item>

          <dx-form-item css-class="accent">
            <label class="form-label">Client Gross</label>
            <dx-progress-bar :value="progressValue || 0" :min=0 :max="grossValue || 100" :show-status="false"
              class="custom-progress-bar" />
            <div class="progress-details ">
              <span>Received - <b>{{ progressValue || 0 }}</b></span>
              <span>Remaining - <b>{{ remainingValue || 0 }}</b></span>
            </div>
          </dx-form-item>
          <dx-form-item css-class="accent">
            <div @click="fetchProductData" class="product-icon"> <label class="form-label"> Product <span
                  class="required">*</span> </label><span><i class="dx-icon-refresh dx-card-icon camera-icon"></i>
              </span></div>
            <dx-select-box placeholder="" :items="productOptions" v-model="formData.product" :show-clear-button="true"
              :search-enabled="true" :class="{ 'is-invalid': !formData.product && isValidationTriggered }"
              display-expr="name1" value-expr="name" class=" p-2 border rounded-md" styling-mode="outlined" />
          </dx-form-item>
          <dx-form-item css-class="accent">
            <label class="form-label">Unit Count</label>
            <DxNumberBox v-model="formData.unit_count" format="#,###" :min="0" />
          </dx-form-item>
          <dx-form-item css-class="accent">
            <label class="form-label"> Contains DSD <span class="required">*</span></label>
            <dx-select-box :items="DSDoptions" v-model="formData.contains_dsd" placeholder="" :show-clear-button="false"
              :search-enabled="true" :class="{ 'is-invalid': !formData.contains_dsd && isValidationTriggered }"
              class=" p-2 border rounded-md" styling-mode="outlined" />
          </dx-form-item>

          <dx-form-item css-class="accent">
            <label class="form-label">Location</label>
            <dx-select-box :items="locationOptions" v-model="formData.location" :show-clear-button="true"
              placeholder="" />
          </dx-form-item>

          <dx-form-item css-class="accent">
            <label class="form-label"> Data Bearing <span class="required">*</span></label>
            <dx-select-box :items="dataBearingOptions" v-model="formData.data_bearing" placeholder=""
              :class="{ 'is-invalid': !formData.data_bearing && isValidationTriggered }" class=" p-2 border rounded-md"
              styling-mode="outlined" />
          </dx-form-item>

          <dx-form-item css-class="accent">
            <label class="form-label">Client BIN</label>
            <dx-text-box :value="formData.client_bin" class=" p-2 border rounded-md" styling-mode="outlined" />
          </dx-form-item>
          <dx-form-item css-class="accent">
            <label class="form-label"> Scale</label>
            <dx-select-box v-model="formData.scale" :items="scaleOptions" placeholder="" :disabled="false"
              styling-mode="outlined" />
          </dx-form-item>
          <dx-form-item :col-span="1">
            <label class="form-label">Order Notes</label>
            <dx-text-area v-model="formData.order_notes" :rows="6" />
          </dx-form-item>
          <dx-form-item css-class="accent">
            <label class="form-label">Next Workflow</label>
            <dx-select-box :items="workflowOptions" v-model="formData.next_workflow" :disabled="workflowDisabled"
              placeholder="" />
          </dx-form-item>

          <dx-form-item css-class="accent">

          </dx-form-item>
          <dx-form-item css-class="accent">
            <label class="form-label"> Packaging</label>
            <dx-select-box :items="packagingOptions" v-model="formData.packaging" placeholder="" />
          </dx-form-item>
          <dx-form-item css-class="accent">

          </dx-form-item>
          <dx-form-item css-class="accent">
            <NumberField v-model="formData.gross" label="Gross" />
          </dx-form-item>
          <dx-form-item css-class="accent">

          </dx-form-item>
          <dx-form-item css-class="accent">
            <NumberField v-model="formData.net" label="Net" />
          </dx-form-item>
          <dx-form-item css-class="accent">

          </dx-form-item>
          <dx-form-item css-class="accent">
            <NumberField v-model="formData.tare" label="Tare" />
          </dx-form-item>
        </dx-form-group-item>
      </dx-form>


      <!-- <Fieldrenderer class="field" v-for="fiel d in fields.slice(0, 10)" :key="field.fieldname" :field="field"
          v-model="formData[field.fieldname]" @trigger-search="searchOrders"
          @update:modelValue="(value) => handleValueUpdate(field.fieldname, value)" :recieved_value="totals" />
      </div>
      <div class="right-column">
        <Fieldrenderer class="field" v-for="field in fields.slice(10)" :key="field.fieldname" :field="field"
          v-model="formData[field.fieldname]" @update:modelValue="(value) => handleValueUpdate(field.fieldname, value)"
          :recieved_value="totals" /> -->
      <!-- </div> -->
    </div>
    <div class="table-container">
      <div class="button-container">
        <dx-button class="additional-btn" :text="isEdit ? 'Save' : 'Add'" type="default" styling-mode="contained"
          @click="submitForm" :disabled="isAddButtonDisabled" />
        <dx-button class="additional-btn delete-btn " text="DELETE" type="default" styling-mode="contained"
          @click="deleteSelectedRowsFromBackend" />
        <dx-button class="additional-btn " text="EDIT" type="default" styling-mode="contained"
          :disabled="selectedrowkeys.length !== 1" @click="editSelectedRow" />
        <dx-button class="additional-btn" text="PRINT UID" type="default" styling-mode="contained" />
      </div>



      <div class="dx-card details-card" id="card-tasks">
        <dx-load-panel :show-pane="false" width="auto" container="#card-tasks" :position="{ of: '#card-tasks' }" />
        <gridView :data-source="dataSource" :fields="fieldName" :doctype="doctype"
          @update:selectedRowKeys="updateSelectedRowKeys" @gridReady="onGridReady" />
      </div>

      <!-- <div class="totals-container">
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
      </div> -->
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

.auto-print {
  margin-left: 10px;
}

@media only screen and (max-width: 850px) {
  .button-container {
    gap: 12px
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
  max-width: 700px;
  // min-width:500px;
  flex-wrap: wrap;
  gap: 5%;
  // margin-left: 15px;
}

.field {
  flex: 1 1 calc(48% - 1rem);
  max-width: calc(48% - 1rem);
  min-width: 250px;
  padding-bottom: 12px
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
  // font-weight: 500;
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

.product-icon {
  display: flex;
  justify-content: space-between;
}

.required {
  margin-left: 4px;
  color: red;
  font-size: 14px;
}

.camera-icon {
  font-size: 24px !important;
}

.is-invalid {
  border: 1px solid red !important;
}

// .field-container {
//   height:14px;
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   width: 100%;
//   margin: 0px;
//   padding:0;
// }
.progress-details {
  display: flex;
  justify-content: space-between;
  font-weight: 300;
  font-size: small;
  margin: 0px !important;
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

.form-container {
  padding: 0px !important
}

@media (max-width: 820px) {
  .arrow {
    display: none;
  }
}
</style>
