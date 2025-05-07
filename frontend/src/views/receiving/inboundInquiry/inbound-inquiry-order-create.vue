<script setup>
import { DxButton } from 'devextreme-vue/button';
import { DxTabPanel } from 'devextreme-vue/tab-panel';
import { DxItem as DxTabItem } from 'devextreme-vue/tabs';
import { ref, reactive, computed, onMounted, watch, inject } from "vue";
import { call, createResource, createListResource } from "frappe-ui";
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
import DxCheckBox  from 'devextreme-vue/check-box';
import CustomStore from 'devextreme/data/custom_store';
import { useRouter } from "vue-router";

const router = useRouter();
const showToast = inject('showToast');

const selectedAccount = ref(null);
const accountDetails = ref([]);
const locationOptions = ref([]);
const facilityOptions = ref([]);
const customerOptions = ref([]);
const orderTypeOptions = ref(["Purchase Order", "Open Order"]);
const slaTypesOptions = ref(["Calendar Days", "Business Days"]);
const purchaseOrders = ref([]);
const employeeOptions = ref([]);
const isValidationTriggered = ref(false);
const isaccountSelecting = ref(false); // Flag to prevent API call on selection

const formData = reactive({
	account: '',
	location: '',
	receiving_facility: '',
	order_type: '',
	purchase_order: '',
	csr: '',
	sales: '',
	onsite_contact: '',
	sla_type: '',
	sla_days: '',
	po_terms: 0,
	order_alert: false,
	order_notes: '',
	status: 'Draft',
});

const isPurchaseOrderFieldDisabled = computed(() => formData.order_type !== "Purchase Order");

const ValidateForm = () => {
    isValidationTriggered.value = true;
    const requiredFields = [
        { key: "account", label: "Account" },
        { key: "location", label: "Location" },
        { key: "receiving_facility", label: "Receiving Warehouse" },
        { key: "order_type", label: "Order Type" },
        { key: "onsite_contact", label: "Onsite Contact" },
    ];
    const missingFields = requiredFields
        .filter(field =>
            formData[field.key] === undefined ||
            formData[field.key] === null ||
            formData[field.key] === "" ||
            (Array.isArray(formData[field.key]) && formData[field.key].length === 0)
        )
        .map(field => field.label);

    if (missingFields.length > 0) {
        showToast(`Please enter mandatory fields`, "error");
        return false;
    }
    return true;
};

const fetchData = async (doctype, fields = ["name"], filters = [], limit, mapFn = (item) => item.name, skipMap = false) => {
  try {
    const response = await createResource({
      url: "frappe.client.get_list",
      params: {
        doctype,
        fields: JSON.stringify(fields),
        filters: JSON.stringify(filters),
		limit_page_length: limit,
      },
    }).fetch();

    // Skip mapping if skipMap is true
    return skipMap ? response : response.map(mapFn);
  } catch (error) {
    console.error(`Error fetching ${doctype} details:`, error);
    showToast(`Failed to fetch ${doctype} details`, "error");
    return [];
  }
};

const accountDataSource = ref(
  new CustomStore({
    key: 'value',
    load: async (loadOptions) => {
	// Prevent unnecessary API call on selection
		if (isaccountSelecting.value) {
			isaccountSelecting.value = false;
        return [];
      }
	  const searchValue = loadOptions.searchValue || '';
	  // Prevent unnecessary API call on selection
	  if(loadOptions.select === undefined && loadOptions.filter !== undefined ) return [];
      try {
        const filters = [];
        if (searchValue) {
          filters.push(['account_name', 'like', `%${searchValue}%`]);
        }
		accountDetails.value = await fetchData("Accounts",["name","account_name","po_terms","sla_type","sla_days","csr","sales_contact"],
			filters, 5, null, true);
		const response = accountDetails.value.map((account) => ({
			label: account.account_name || account.name,
			value: account.name,
          }));
		// const response = await fetchData("Accounts", ["name", "account_name"],filters,5,(account) => ({
		// 	label: account.account_name || account.name,
		// 	value: account.name,
		// 	})
		// );
        return response;
      } catch (error) {
        console.error('Error fetching accounts:', error);
        showToast('Failed to load accounts', 'error');
        return [];
      }
    },
    byKey: async (key) => {
      return null; // Optional implementation
    },
  })
);

const onAccountSelected = (e) => {
  if (e.value) {
    isaccountSelecting.value = true; // Prevent API call
  }
};

const fetchLocationDetails = async () => locationOptions.value = await fetchData("Location", [], [], 0);
const fetchFacilityDetails = async () => facilityOptions.value = await fetchData("Ware House", [], [], 0);
const fetchCustomerDetails = async () => customerOptions.value = await fetchData("Customer", [], [], 0);

// Purchase Order Data Source
const purchaseOrderDataSource = ref(
  new CustomStore({
    key: 'value',
    load: async () => [], // Start with empty store
    byKey: async () => null
  })
);

// Function to Load Purchase Orders Dynamically
const loadPurchaseOrders = async () => {
  if (!selectedAccount.value) {
    // Reset to empty store instead of null
    purchaseOrderDataSource.value = new CustomStore({
      key: 'value',
      load: async () => [],
      byKey: async () => null
    });
    formData.purchase_order = null;
    return;
  }

  purchaseOrderDataSource.value = new CustomStore({
    key: 'value',
    load: async (loadOptions) => {
      const searchValue = loadOptions.searchValue || '';
      try {
        const filters = [['account', '=', selectedAccount.value]];
		filters.push(['status', '=', 'Active'])
        if (searchValue) {
          filters.push(['name', 'like', `%${searchValue}%`]);
        }
		purchaseOrders.value = await fetchData("Purchase Order",["name", "sales", "csr", "account"], filters,5,null, true);
		const response = purchaseOrders.value.map((order) => ({
            label: order.name,
            value: order.name,
          }));

        return response;
      } catch (error) {
        console.error('Error fetching Purchase Orders:', error);
        showToast('Failed to load Purchase Orders', 'error');
        return [];
      }
    },
    byKey: async (key) => null
  });
};

const fetchEmployeeDetails = async () => {
employeeOptions.value = await fetchData("Employee",["name", "first_name"],[],0,(employee) => ({
      label: employee.first_name || employee.name,
      value: employee.name,
    })
  );
};

const createOrder = createResource({
  url: 'frappe.client.insert',
  makeParams(values) {
	return {
      doc: {
        doctype: 'Inbound Inquiry',
        ...values,
      },
    }
  },
  onSuccess(doc) {
    if (doc.name) {
		showToast("Order Created Successfully", "success");
		router.push({
        name: "updateOrder",
        query: { name: doc.name },
      });
    }
  },
  onError(err) {
	showToast("Order Created Failed", "error");
  },
})

const saveOrder = async () => {
	if (!ValidateForm()) {
		showToast("Please fill the mandatory fields to Create Order", "error");
		return;
	} else {
		// console.log(formData,"final");
		createOrder.submit(formData);
	}
}

const Cancel = () => router.push({ name: 'inbound-inquiry' });

// Watch for changes to the selected purchase_order and update csr/sales fields
// watch(
//   () => [formData.purchase_order, formData.order_type],
//   ([newPurchaseOrder, newOrderType]) => {
//     if (newPurchaseOrder) {
//       const selectedOrder = purchaseOrders.value.find(
//         (order) => order.name === newPurchaseOrder
//       );
//       if (selectedOrder) {
//         formData.csr = selectedOrder.csr || "";
//         formData.sales = selectedOrder.sales || "";
//       }
//     }

//     if (newOrderType === "Open Order") {
//       formData.purchase_order = "";
//     }
//   }
// );

watch(
  () => [formData.order_type, formData.account, formData.purchase_order],
  ([newOrderType, newAccount, newPurchaseOrder]) => {
    // If order type is "Purchase Order" and a purchase order is selected
    if (newOrderType === "Purchase Order" && newPurchaseOrder) {
      const selectedOrder = purchaseOrders.value.find(
        (order) => order.name === newPurchaseOrder
      );
      if (selectedOrder) {
        formData.csr = selectedOrder.csr || "";
        formData.sales = selectedOrder.sales || "";
      }
    }

    // If order type is "Open Order" and an account is selected
    if (newOrderType === "Open Order" && newAccount) {
      const selectedAccountDetails = accountDetails.value.find(
        (account) => account.name === newAccount
      );
      if (selectedAccountDetails) {
        formData.csr = selectedAccountDetails.csr || "";
        formData.sales = selectedAccountDetails.sales_contact || "";
        formData.sla_days = selectedAccountDetails.sla_days || "";
        formData.sla_type = selectedAccountDetails.sla_type || "";
        formData.po_terms = selectedAccountDetails.po_terms || 0;
      }
    }

    // Reset purchase_order if order type is not "Purchase Order"
    if (newOrderType !== "Purchase Order") {
      formData.purchase_order = "";
    }
  }
);

// Watch for Account Selection Changes
watch(
  () => formData.account,
  async (newValue) => {
    selectedAccount.value = newValue;
    formData.purchase_order = null;
    loadPurchaseOrders();
	if(newValue){
		try {
		const locationDetailsResponse = await createResource({
			url: "axe_product.api.doc.get_data",
			params: {
				doctype: "Accounts",
				name: newValue,
			}}).fetch();
			const accountLocations = locationDetailsResponse.message.data.locations.map((item) => item.location);
			locationOptions.value = accountLocations;
		} catch (error) {
			console.error("Error fetching location details:", error);
		}
	}
  }
);

onMounted( async() => {
	const promises = [
  fetchLocationDetails(),
  fetchFacilityDetails(),
  fetchCustomerDetails(),
  fetchEmployeeDetails(),
]
await Promise.all(promises);
});

</script>

<template>
		<div class="row header">
			<h3>New Inbound Inquiry<span class="pill">Not Saved</span></h3>
			<div class="row buttons">
			<dx-button class="additional-btn" text="Cancel" type="default" styling-mode="contained" @click="Cancel"/>
			<dx-button class="additional-btn form-btn" text="Save and Next" type="default" @click="saveOrder"
				styling-mode="contained" />
			</div>
		</div>
		<dx-tab-panel class="main-content">
		<dx-tab-item title="Order">
				<dx-form class="plain-styled-form dx-form form-container">

				<dx-form-group-item :col-count="4" >
					<dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

					<dx-form-item css-class="accent">
						<label class="form-label"> Account <span class="required">*</span></label>
						<dx-select-box
							v-model="formData.account"
							display-expr="label"
							value-expr="value"
							placeholder=""
							:search-enabled="true"
							:show-clear-button="true"
							:data-source="accountDataSource"
							:class="{ 'is-invalid': !formData.account && isValidationTriggered }"
							class="p-2 border rounded-md"
							styling-mode="outlined"
							:search-expr="['label', 'value']"
							search-mode="contains"
							:min-search-length="2"
							:show-data-before-search="true"
							:search-timeout="300"
							:show-loading-indicator="true"
							@value-changed="onAccountSelected"
							/>
					</dx-form-item>

					<dx-form-item css-class="accent">
						<label class="form-label"> Location(s) <span class="required">*</span></label>
						<dx-select-box
							placeholder=""
							:items="locationOptions"
							v-model="formData.location"
							:show-clear-button="true"
							:search-enabled="true"
							:class="{ 'is-invalid': !formData.location && isValidationTriggered }"
							class=" p-2 border rounded-md"
							styling-mode="outlined"/>
					</dx-form-item>

					<dx-form-item css-class="accent">
						<label class="form-label"> Receiving Warehouse <span class="required">*</span></label>
						<dx-select-box
							:items="facilityOptions"
							v-model="formData.receiving_facility"
							placeholder=""
							:show-clear-button="true"
							:search-enabled="true"
							:class="{ 'is-invalid': !formData.receiving_facility && isValidationTriggered }"
							class=" p-2 border rounded-md"
							styling-mode="outlined"/>
					</dx-form-item>

					<dx-form-item css-class="accent">
						<label class="form-label"> Select Order Type <span class="required">*</span></label>
						<dx-select-box
							:items="orderTypeOptions"
							v-model="formData.order_type"
							placeholder=""
							:class="{ 'is-invalid': !formData.order_type && isValidationTriggered }"
							class=" p-2 border rounded-md"
							styling-mode="outlined"/>
					</dx-form-item>

					<dx-form-item css-class="accent">
						<label class="form-label"> Select Purchase Order</label>
						<dx-select-box
							v-model="formData.purchase_order"
							placeholder=""
							display-expr="label"
							value-expr="value"
							:disabled="isPurchaseOrderFieldDisabled"
							:search-enabled="true"
							:show-clear-button="true"
							:data-source="purchaseOrderDataSource"
							styling-mode="outlined"
							:search-expr="['label']"
							search-mode="contains"
							:min-search-length="2"
							:show-data-before-search="true"
							:search-timeout="300"
							:show-loading-indicator="true"
							/>
					</dx-form-item>

					<dx-form-item css-class="accent">
						<label class="form-label">CSR</label>
					<dx-select-box
            				:items="employeeOptions"
            				v-model="formData.csr"
            				display-expr="label"
            				value-expr="value"
            				placeholder=""
							:show-clear-button="true"
							:search-enabled="true" />
					</dx-form-item>

					<dx-form-item css-class="accent">
						<label class="form-label"> Sales</label>
						<dx-select-box
            				:items="employeeOptions"
            				v-model="formData.sales"
            				display-expr="label"
            				value-expr="value"
            				placeholder=""
							:show-clear-button="true"
							:search-enabled="true" />
					</dx-form-item>

					<dx-form-item css-class="accent">
						<label class="form-label">Onsite Contact <span class="required">*</span></label>
						<dx-select-box
							:items="customerOptions"
							v-model="formData.onsite_contact"
							:class="{ 'is-invalid': !formData.onsite_contact && isValidationTriggered }"
							class="p-2 border rounded-md"
							styling-mode="outlined"
							:show-clear-button="true"
							:search-enabled="true"
							placeholder=""/>
					</dx-form-item>

					<dx-form-item css-class="accent">
						<label class="form-label">SLA Type</label>
						<dx-select-box
							:items="slaTypesOptions"
							v-model="formData.sla_type"
							placeholder=""
							 />
					</dx-form-item>

					<dx-form-item css-class="accent">
						<label class="form-label">SLA Days</label>
						<DxNumberBox
            				v-model="formData.sla_days"
							:min="0"
							format="#"
							 />
					</dx-form-item>

					<dx-form-item css-class="accent">
						<label class="form-label">PO Terms</label>
						<DxNumberBox
							v-model="formData.po_terms"
							:min="0"
							format="#"
						/>
					</dx-form-item>

					<!-- <dx-form-item css-class="accent">
						<label>Order Alert</label>
						<div class="checkbox-wrapper">
    						<dx-check-box v-model="formData.order_alert" />
  						</div>
					</dx-form-item> -->
				</dx-form-group-item>

				<dx-form-group-item :col-count="4">
					<dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />
					<dx-form-item :col-span="2" >
						<label class="form-label">Order Notes</label>
						<dx-text-area
							v-model="formData.order_notes"
						/>
				</dx-form-item>
				</dx-form-group-item>

    			</dx-form>
		</dx-tab-item>
		</dx-tab-panel>
</template>

<style scoped lang="scss">
@use "@/variables" as *;
@use "sass:math";


.is-invalid {
	border: 1px solid var(--error-pill-color) !important;
}

.required {
  margin-left: 4px;
  color: red;
  font-size: 14px;
}

.checkbox-wrapper {
  display: block; /* Ensure the checkbox is on a new line */
  margin-top: 8px; /* Add space above the checkbox */
}

.additional-btn {
  margin-left: 10px;
}

.row{
  border: none !important;
}

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

.main-content {
  /* border: 1px solid #e0e0e0; */
  border: 1px solid var(--base-border-color);
  border-radius: 8px;
}

</style>


