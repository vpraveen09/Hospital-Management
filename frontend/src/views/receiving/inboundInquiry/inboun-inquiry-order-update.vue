<script setup>
import { DxButton } from 'devextreme-vue/button';
import { DxTabPanel } from 'devextreme-vue/tab-panel';
import { DxItem as DxTabItem } from 'devextreme-vue/tabs';
import { ref, reactive, computed, onMounted, watch, nextTick, inject } from "vue";
import { call, createResource, createListResource } from "frappe-ui";
import {
  DxForm,
  DxItem as DxFormItem,
  DxGroupItem as DxFormGroupItem,
  DxColCountByScreen,
} from 'devextreme-vue/form';
import DxTextBox from "devextreme-vue/text-box";
import DxTextArea from "devextreme-vue/text-area";
import DxSelectBox from "devextreme-vue/select-box";
import DxCheckBox  from 'devextreme-vue/check-box';
import DxNumberBox from 'devextreme-vue/number-box';
import DxDateBox from 'devextreme-vue/date-box';
import { DxFileUploader } from 'devextreme-vue/file-uploader';
import {
  DxDataGrid,
  DxColumn,
  DxPaging,
  DxEditing,
  DxLookup,
  DxPager,
  DxToolbar,
  DxItem,
  DxSelection,
  DxScrolling,
  DxRequiredRule,
  DxRangeRule,
} from 'devextreme-vue/data-grid';
import { useRouter, useRoute } from "vue-router";
import CustomStore from 'devextreme/data/custom_store';

const router = useRouter();
const route = useRoute();
// Dynamic options for dropdown fields
const selectedAccount = ref(null);
const accountDetails = ref([]);
const locationOptions = ref([]);
const facilityOptions = ref([]);
const customerOptions = ref([]);
const orderTypeOptions = ref(["Purchase Order", "Open Order"]);
const slaTypesOptions = ref(["Calendar Days", "Business Days"]);
// Store the fetched purchase order data to access later
const purchaseOrders = ref([]);
const employeeOptions = ref([]);
const logisticsTypeOptions = ref(["Internal", "Third Party", "Delivered"]);
const truckTypeOptions = ref([]);
const supplyOptions = ref([]);
const previousLocation = ref(null); // Track previous location
//  Supply and Reference Grid
const dataGridRef = ref(null);
const dataGridSuppliesRef = ref(null);
const selectedRowsSupplies = ref([]);
const selectedRowsReference = ref([]);
const pageSizes = [5, 10, 20];
const displayMode = ref('full');
const showPageSizeSelector = ref(true);
const showInfo = ref(true);
const showNavButtons = ref(true);
const isValidationTriggered = ref(false);
const isInitialLocationLoad = ref(true);
const isaccountSelecting = ref(false); // Flag to prevent API call on selection

const showToast = inject('showToast');

const activeTab = ref("Order");
const tabList = ["Order", "Logistics", "Document", "Pickup", "References"];
// Convert activeTab to activeTabIndex for DxTabPanel
const activeTabIndex = computed(() => tabList.indexOf(activeTab.value));
const onTabChange = (newIndex) => {
  activeTab.value = tabList[newIndex]; // Update the tab name when user switches manually
};
// Dynamically set button text
const getButtonText = computed(() => {
  return activeTab.value === "References" ? "Finish" : "Save and Next";
});
const moveToNextTab = () => {
  const currentIndex = tabList.indexOf(activeTab.value);
  if (currentIndex < tabList.length - 1) {
    activeTab.value = tabList[currentIndex + 1]; // Change activeTab
  }
};

const formData = reactive({
  name: "",
  status:"Draft",
// Order
  account: "",
  location: "",
  receiving_facility: "",
  order_type: "",
  purchase_order: "",
  csr: "",
  sales: "",
  onsite_contact: "",
  sla_type: "",
  sla_days: "",
  po_terms: 0,
  order_alert: "",
  order_notes: "",
// Logistics
  logistic_type: "",
  earliest_pickup_date: "",
  truck_type: "",
  schedule_dock_date_time: "",
  estimate_pallet_count: 0,
  estimate_weight: 0,
  logistics_internal_quote: 0,
  charge_to_client: 0,
  final_invoice_amount: 0,
  logistics_notes: "",
  tags: "",
// Documents
  documents: "",
// Pickup
  supplies: [],
  building_notes: "",
  supply_notes: "",
// References
  bol: "",
  reference_number: "",
  references: []
});

const isPurchaseOrderFieldDisabled = computed(() => formData.order_type !== "Purchase Order");
const isclientChargeFieldDisabled = computed(() => formData.logistic_type == "Delivered");
const earliestPickupDateLabel = computed(() => {
  return formData.logistic_type === "Delivered" ? "Earliest Delivery Date" : "Earliest Pickup Date";
});

const requiredFieldsMap = {
  Order: ["account", "location", "receiving_facility", "order_type", "onsite_contact"],
  Logistics: ["logistic_type", "earliest_pickup_date", "truck_type", "estimate_pallet_count", "estimate_weight"],
  References: [
    "account", "location", "receiving_facility", "order_type", "onsite_contact",
    "logistic_type", "earliest_pickup_date", "truck_type", "estimate_pallet_count", "estimate_weight"
  ]
};

const ValidateForm = () => {
  isValidationTriggered.value = true;
  const requiredFields = requiredFieldsMap[activeTab.value] || [];

  const missingFields = requiredFields
    .filter(key => !formData[key] || (Array.isArray(formData[key]) && formData[key].length === 0))
    .map(key => key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())); // Auto-generate labels

  if (missingFields.length > 0) {
    return false;
  }
  return true;
};

// Fetch Data Based on "name"
const fetchInboundInquiryData = async (name) => {
  try {
    const response = await createResource({
      url: "frappe.client.get",
      params: {
		doctype: "Inbound Inquiry",
	    name: name
	},
    }).fetch();
    if (response) {
      const data = response;
      // Map API response to form fields
      Object.keys(formData).forEach((key) => {
        if (data[key] !== undefined) {
          formData[key] = data[key];
        }
      });
	  // 1. Set selectedAccount.value explicitly
	  selectedAccount.value = formData.account;
	  // Load the selected purchase order using byKey
	  if (formData.purchase_order) {
        const selectedPurchaseOrderData = await purchaseOrderDataSource.value.byKey(formData.purchase_order);

        if (selectedPurchaseOrderData) {
          // Ensure the selected purchase order is displayed in the dx-select-box
          formData.purchase_order = selectedPurchaseOrderData.value;
        }}

    } else {
      showToast("Inbound Inquiry not found.", "error");
    }
  } catch (error) {
    console.error("Error fetching Inbound Inquiry:", error);
    showToast("Failed to fetch data. Please try again.", "error");
  }
};

const fetchData = async (doctype, fields = ["name"], filters = [],limit, mapFn = (item) => item.name, skipMap = false) => {
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
	try {
		accountDetails.value = await fetchData("Accounts",["name","account_name","po_terms","sla_type","sla_days","csr","sales_contact"],
		[['name', '=', key]], 1, null, true);
		const response = accountDetails.value.map((account) => ({
			label: account.account_name || account.name,
			value: account.name,
          }));
        // const response = await fetchData("Accounts", ["name", "account_name"], [['name', '=', key]], 1, (account) => ({
        //   label: account.account_name || account.name,
        //   value: account.name,
        // }));
        return response[0]; // Return the first matching account
      } catch (error) {
        console.error('Error fetching account by key:', error);
        return null;
      }
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
    byKey: async (key) => {
		try {
        const filters = [['name', '=', key]];
        if (formData.account) {
          filters.push(['account', '=', formData.account]);
        }
        const response = await fetchData("Purchase Order", ["name"], filters, 1, null, true);
        return response[0] ? { label: response[0].name, value: response[0].name } : null;
      } catch (error) {
        console.error('Error fetching Purchase Order by key:', error);
        return null;
      }
	}
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
    byKey: async (key) => {
		try {
			const filters = [['name', '=', key], ['account', '=', selectedAccount.value]];
			const response = await fetchData("Purchase Order", ["name", "sales", "csr", "account"], filters, 1, null, true);
			return response[0] ? { label: response[0].name, value: response[0].name } : null;
		} catch (error) {
			console.error('Error fetching Purchase Order by key:', error);
			return null;
		}
	}
  });
};

const fetchEmployeeDetails = async () => {
	employeeOptions.value = await fetchData("Employee",["name", "first_name"],[],0,(employee) => ({
      label: employee.first_name || employee.name,
      value: employee.name,
    })
  );
};

const fetchTruckTypeDetails = async () => {
  truckTypeOptions.value = await fetchData("Truck Type",["name", "truck_type"],[],0,(truckType) => ({
	  label: truckType.truck_type || truckType.name,
	  value: truckType.name,
	})
  );
};

const fetchSupplyDetails = async () => {
	supplyOptions.value = await fetchData("Supply",["name", "supply_name"],[],0,(supply) => ({
		label: supply.supply_name || supply.name,
		value: supply.name,
		})
	);
};

const refreshGrid = async () => {
  await nextTick(); // Wait for the DOM to update
  if (dataGridSuppliesRef.value?.instance) {
    dataGridSuppliesRef.value.instance.refresh(); // Refresh the grid
    dataGridSuppliesRef.value.instance.repaint(); // Repaint the grid
  }
};

const fetchLocationSuppliesDetails = async (newLocation) => {
  try {
    const response = await createResource({
      url: "frappe.client.get",
      params: {
        doctype: "Location",
        name: newLocation,
        fields: JSON.stringify(["name", "supplies"]),
      },
    }).fetch();
	formData.truck_type = response.truck_size

    if (response?.supplies) {
      // Step 1: Clear existing supplies for the selected location
      formData.supplies = formData.supplies.filter(
        (s) => s.location !== newLocation // Remove supplies for the current location
      );

      // Step 2: Add new supplies with location reference
      response.supplies.forEach((supply) => {
        // Check if the supply already exists in formData.supplies
        const isDuplicate = formData.supplies.some(
          (existing) =>
            existing.supply === supply.supply && existing.location === newLocation
        );

        // Add the supply only if it's not a duplicate
        if (!isDuplicate) {
          formData.supplies.push({
            ...supply,
            location: newLocation, // Track the source location
            parenttype: "Location", // Mark as location-originated
          });
        }

      });
    } else {
      console.warn("No supplies found for location:", newLocation);
    }
  } catch (error) {
    console.error("Error fetching location details:", error);
    showToast("Failed to fetch location details", "error"); // Provide user feedback
  }
};

// Function to delete old location supplies
const deleteOldLocationSupplies = async () => {
  if (!previousLocation.value) return;
  try {
    await createResource({
      url: "axe_product.api.doc.delete_supplies_by_location",
      params: {
        parent: route.query.name,
        location: previousLocation.value
      }
    }).fetch();
	// Clear old supplies from formData
	formData.supplies = formData.supplies.filter(
      (s) => s.location !== previousLocation.value
    );

  } catch (error) {
    console.error("Error deleting old supplies:", error);
    showToast("Failed to clean up old location supplies", "error");
  }
};

const  updateInboundInquiry = async () => {
if (!ValidateForm()) {
	if (activeTab.value === "References"){
		showToast("Please fill in all required fields to Finish", "error");
	} else{
		showToast("Please fill in all required fields.", "error");
	}
	return;
  } else {
    // Delete old supplies if location changed
	saveChangesSupplies()
	saveChangesReference()
    if (previousLocation.value && previousLocation.value !== formData.location) {
      await deleteOldLocationSupplies();
    }
	// fetchLocationSuppliesDetails(formData.location);
	const fieldname = JSON.parse(JSON.stringify(formData));
	// Remove dynamic names from new records in child tables
	fieldname.references = fieldname.references.map(reference => {
	if (!reference.creation) {
		// New record: Remove the dynamic name
		const { name, ...rest } = reference;
		return rest;
	}
	return reference; // Existing record: Keep as is
	});
	fieldname.supplies = fieldname.supplies.map(supply => {
	if (!supply.creation) {
		// New record: Remove the dynamic name
		const { name, ...rest } = supply;
		return rest;
	}
	// If parenttype is "Location", retain only name, item, and quantity
	if (supply.parenttype === "Location") {
		return {
		// name: supply.name,
		supply: supply.supply,
		quantity: supply.quantity,
		parenttype: supply.parenttype,
		location: supply.location
		};
	}
	return supply; // Existing record: Keep as is
	})
	// .filter(supply => supply.parenttype !== "Location"); // filter location supply
	if (activeTab.value === "References") {
		fieldname.status = "Active";
	} else if (["Order", "Logistics", "Documents", "Pickup"].includes(activeTab.value)) {
		fieldname.status = "Draft";
	}
	await createResource({
		url: 'frappe.client.set_value',
		params: {
		doctype: 'Inbound Inquiry',
		name: route.query.name,
		fieldname,
		},
		auto: true,
		onSuccess: (response) => {
			if (activeTab.value === "References") {
				showToast("Order Updated Successfully", "success");
				router.push({ name: 'inbound-inquiry' }); // Final action
			} else {
				fetchInboundInquiryData(route.query.name).then(() => {
					// Refresh the grids
					nextTick(() => {
						if (dataGridRef.value?.instance) {
						dataGridRef.value.instance.refresh();
						}
						if (dataGridSuppliesRef.value?.instance) {
						dataGridSuppliesRef.value.instance.refresh();
						}
					});
					moveToNextTab();
				});
			}
		},
	})
  }
}
const Cancel = () => router.push({ name: 'inbound-inquiry' });
// Supply and Reference Grid Generic function to add a new row
const addRow = (dataGridRef) => dataGridRef.value?.instance.addRow();
// Generic function to remove selected rows
const removeRow = async (dataGridRef, selectedRows, formDataKey, childDoc) => {
	// if (!dataGridRef.value?.instance || !Array.isArray(selectedRows) || selectedRows.length === 0) {
	// 	return
	// }
	// try {
	// 	const response = await createResource({
	// 	url: 'axe_product.api.doc.delete_supplies_or_reference',
	// 	params: {
	// 		childdoc: childDoc,
	// 		names: JSON.stringify(selectedRows) // Send as JSON string
	// 	}
	// }).fetch();
 	// // Remove the selected rows from formData
	// formData[formDataKey] = formData[formDataKey].filter(row => !selectedRows.includes(row.name));
	// selectedRows.length = 0;
	// await nextTick(() => dataGridRef.value?.instance.refresh());
	// showToast("Selected rows removed successfully", "success");
	// } catch (error) {
	// 	console.error("Error removing rows:", error);
	// 	showToast("Failed to remove selected rows", "error");
	// }
	if (!dataGridRef.value?.instance || !Array.isArray(selectedRows) || selectedRows.length === 0) return;
	// Find the selected row objects in formData[formDataKey]
	const selectedObjects = formData[formDataKey].filter(row => selectedRows.includes(row.name));
	// Check if any selected row has `parenttype: "Location"`
	const hasLocationType = selectedObjects.some(row => row.parenttype === "Location");
	if (hasLocationType) {
	showToast("Cannot remove rows supplies from : 'Location'", "warning");
	return; // Stop execution
	}
	formData[formDataKey] = formData[formDataKey].filter(row => !selectedRows.includes(row.name));
	selectedRows.length = 0;
	await nextTick(() => dataGridRef.value?.instance.refresh());
};
// Generic function to save changes
const saveChanges = (dataGridRef) => {
  dataGridRef.value?.instance.saveEditData();
};
// Specific functions for each grid
const addRowReference = () => addRow(dataGridRef);
const addRowSupplies = () => addRow(dataGridSuppliesRef);
const removeRowReference = () => removeRow(dataGridRef, selectedRowsReference.value, 'references', 'References');
const removeRowSupplies = () => removeRow(dataGridSuppliesRef, selectedRowsSupplies.value, 'supplies', 'Inbound Inquiry Supplies');
const saveChangesReference = () => saveChanges(dataGridRef, 'references');
const saveChangesSupplies = () => saveChanges(dataGridSuppliesRef, 'supplies');

// Watch for Account Selection Changes
watch(
  () => formData.account,
  async (newValue, oldValue) => {
	// Only clear location if the account field is explicitly changed (not during initial load)
    if (isInitialLocationLoad.value) {
		isInitialLocationLoad.value = false;
    } else if (newValue !== oldValue) {
      // When user changes the account (after initial load)
      formData.location = "";
    }
	// formData.location = "";
    selectedAccount.value = newValue;
    formData.purchase_order = null;
    loadPurchaseOrders();
	if(newValue && !formData.location){
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

// // Watch for changes to the selected purchase_order and update csr/sales fields
// watch(
//   () => [formData.purchase_order, formData.order_type, formData.logistic_type],
//   ([newPurchaseOrder, newOrderType, newLogisticType]) => {
//     if (newPurchaseOrder) {
//       const selectedOrder = purchaseOrders.value.find((order) => order.name === newPurchaseOrder);
//       if (selectedOrder) {
//         formData.csr = selectedOrder.csr || "";
//         formData.sales = selectedOrder.sales || "";
//       }
//     }
// 	if (newOrderType !== "Purchase Order") formData.purchase_order = "";
// 	if (newLogisticType == "Delivered") {
//       // Clear the value of the charge_to_client field if logistic_type is not "Delivered"
//       formData.charge_to_client = 0;
// 	  formData.final_invoice_amount = 0;
//     }
//   });
  watch(
  () => [formData.order_type, formData.account, formData.purchase_order, formData.logistic_type],
  ([newOrderType, newAccount, newPurchaseOrder, newLogisticType]) => {
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
	if (newLogisticType == "Delivered") {
      // Clear the value of the charge_to_client field if logistic_type is not "Delivered"
      formData.charge_to_client = 0;
	  formData.final_invoice_amount = 0;
    }
  }
);

// Watch for changes in formData.location
watch(
  () => formData.location,
  async (newLocation, oldLocation) => {

    if (oldLocation) {
      previousLocation.value = oldLocation; // Store previous location **before** deleting old supplies
      await deleteOldLocationSupplies(); // Delete old location supplies before adding new ones
    }

    if (newLocation) {
      await fetchLocationSuppliesDetails(newLocation); // Fetch new supplies after deletion
    }
	// Refresh the grid after updating supplies
	await refreshGrid();
  },
  { immediate: true }
);

onMounted( async () => {
	const promises = [
	fetchLocationDetails(),
	fetchFacilityDetails(),
	fetchCustomerDetails(),
	fetchEmployeeDetails(),
	fetchTruckTypeDetails(),
	fetchSupplyDetails()
	]
	await Promise.all(promises);
	if (route.query.name) fetchInboundInquiryData(route.query.name);
});

</script>

<template>
		<div class="row header">
			<h3>{{ formData.name }}<span :class="formData.status === 'Draft' ? 'draft-badge' : 'active-badge'">
				{{ formData.status}}</span></h3>
			<div class="row buttons">
			<dx-button class="additional-btn" text="Cancel" type="default" styling-mode="contained" @click="Cancel"/>
			<dx-button class="additional-btn form-btn" :text=getButtonText type="default" @click="updateInboundInquiry"
				styling-mode="contained" />
			</div>
		</div>
		<dx-tab-panel class="main-content" v-model:selected-index="activeTabIndex" @update:selectedIndex="onTabChange" >
		<dx-tab-item title="Order">
				<dx-form class="plain-styled-form dx-form form-container">

				<dx-form-group-item :col-count="4">
					<dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

					<dx-form-item css-class="accent">
						<label class="form-label"> Account <span class="required">*</span></label>
						<dx-select-box
							v-model="formData.account"
							placeholder=""
							display-expr="label"
							value-expr="value"
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
							:items="locationOptions"
							v-model="formData.location"
							placeholder=""
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
							:class="{ 'is-invalid': !formData.order_type && isValidationTriggered}"
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
							:search-expr="['label', 'value']"
							search-mode="contains"
							:min-search-length="2"
							:show-data-before-search="true"
							:search-timeout="300"
							:show-loading-indicator="true"
							/>
					</dx-form-item>

					<dx-form-item css-class="accent">
					<dx-select-box
            				:items="employeeOptions"
            				v-model="formData.csr"
							label="CSR"
            				display-expr="label"
            				value-expr="value"
            				placeholder=""
							:show-clear-button="true"
							:search-enabled="true" />
					</dx-form-item>

					<dx-form-item css-class="accent">
						<dx-select-box
            				:items="employeeOptions"
            				v-model="formData.sales"
							label="Sales"
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
						<dx-select-box
							label="SLA Type"
							:items="slaTypesOptions"
							v-model="formData.sla_type"
							placeholder=""
							/>
					</dx-form-item>

					<dx-form-item css-class="accent">
						<DxNumberBox
            				v-model="formData.sla_days"
							label="SLA Days"
							:min="0"
							format="#"
							 />
					</dx-form-item>

					<dx-form-item css-class="accent">
						<DxNumberBox
							label="PO Terms"
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
						<dx-text-area
							label="Order Notes"
							v-model="formData.order_notes"
						/>
				</dx-form-item>
				</dx-form-group-item>
    			</dx-form>
		</dx-tab-item>

		<dx-tab-item title="Logistics">
				<dx-form class="plain-styled-form dx-form form-container">

				<dx-form-group-item :col-count="4">
					<dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

					<dx-form-item css-class="accent" :col-span="1">
					<label class="form-label">Logistic Type <span class="required">*</span></label>
					<dx-select-box
						:items="logisticsTypeOptions"
						v-model="formData.logistic_type"
						placeholder=""
						:class="{ 'is-invalid': !formData.logistic_type && isValidationTriggered }"
						class="p-2 border rounded-md"
						styling-mode="outlined"
						 />
					</dx-form-item>
				</dx-form-group-item>

				<dx-form-group-item :col-count="4">
					<dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

					<dx-form-item css-class="accent">
					<label class="form-label">{{ earliestPickupDateLabel }}<span class="required">*</span></label>
					<DxDateBox date-serialization-format="yyyy-MM-dd"
						display-format="MM/dd/yyyy"
						v-model="formData.earliest_pickup_date"
						:min="new Date()"
						:class="{ 'is-invalid': !formData.earliest_pickup_date && isValidationTriggered }"
						class="p-2 border rounded-md"
						styling-mode="outlined"
						/>
					</dx-form-item>

					<dx-form-item css-class="accent">
					<label class="form-label">Truck Type <span class="required">*</span></label>
					<dx-select-box
						:items="truckTypeOptions"
						display-expr="label"
						value-expr="value"
						v-model="formData.truck_type"
						:class="{ 'is-invalid': !formData.truck_type && isValidationTriggered }"
						class="p-2 border rounded-md"
						styling-mode="outlined"
						placeholder=""
						 />
					</dx-form-item>

					<dx-form-item css-class="accent">
					<DxDateBox :input-attr="{ 'aria-label': 'Date And Time' }" type="datetime"
						label="Schedule Dock Date & Time"
						:min="new Date()"
						v-model="formData.schedule_dock_date_time"
						display-format="MM/dd/yyyy HH:mm:ss"
						date-serialization-format="yyyy-MM-dd HH:mm:ss"
					/>
					</dx-form-item>

					<dx-form-item css-class="accent">
					<label class="form-label">Estimate pallet count <span class="required">*</span></label>
					<DxNumberBox
						v-model="formData.estimate_pallet_count"
						:min="0"
						format="#"
						:class="{ 'is-invalid': !formData.estimate_pallet_count && isValidationTriggered }"
						class="p-2 border rounded-md"
						styling-mode="outlined"
						/>
					</dx-form-item>

					<dx-form-item css-class="accent">
					<label class="form-label">Estimate weight(lbs) <span class="required">*</span></label>
					<DxNumberBox format="#0.## lbs" :input-attr="{ 'aria-label': 'Weight Format' }"
						v-model="formData.estimate_weight"
						:min="0"
						:class="{ 'is-invalid': !formData.estimate_weight && isValidationTriggered }"
						class="p-2 border rounded-md"
						styling-mode="outlined"
						/>
					</dx-form-item>

					<dx-form-item css-class="accent">
					<DxNumberBox format="$ #,##0.##" :input-attr="{ 'aria-label': 'Currency Format' }"
						label="Logistics Internal Quote($)"
						:min="0"
						v-model="formData.logistics_internal_quote"
					/>
					</dx-form-item>

					<dx-form-item css-class="accent">
					<DxNumberBox format="$ #,##0.##" :input-attr="{ 'aria-label': 'Currency Format' }"
						label="Charge to client"
						:min="0"
						:disabled="isclientChargeFieldDisabled"
						v-model="formData.charge_to_client"
					/>
					</dx-form-item>


					<dx-form-item css-class="accent">
					<DxNumberBox format="$ #,##0.##" :input-attr="{ 'aria-label': 'Currency Format' }"
						label="Final Invoice amount"
						:min="0"
						:disabled="isclientChargeFieldDisabled"
						v-model="formData.final_invoice_amount"
						/>
					</dx-form-item>

				</dx-form-group-item>

				<dx-form-group-item :col-count="4">
					<dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

					<dx-form-item :col-span="2" css-class="accent">
						<dx-text-area
						label="Logistics Notes"
						v-model="formData.logistics_notes"
						/>
					</dx-form-item>

					<!-- <dx-form-item :col-span="2" css-class="accent">
					<dx-select-box
						label="Tags"
						v-model="formData.tags"
					/>
					</dx-form-item> -->
				</dx-form-group-item>
    			</dx-form>
		</dx-tab-item>

		<dx-tab-item title="Documents">
				<dx-form class="plain-styled-form dx-form form-container">

				<dx-form-group-item :col-count="4">
					<dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

					<dx-form-item css-class="accent" :col-span="1">
					<dx-text-box
						label="Order Id"
						v-model="formData.name"
						read-only
						/>
					</dx-form-item>
				</dx-form-group-item>

				<!-- <dx-form-group-item :col-count="4">
					<dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

					<dx-form-item :col-span="1" >
						<DxFileUploader upload-mode="useButtons" :multiple="true" class="additional-btn" label-text="Select Files"/>
					</dx-form-item>
				</dx-form-group-item> -->
    			</dx-form>
		</dx-tab-item>

		<dx-tab-item title="Pickup">
			<h4 class="section-title">Building Details</h4>
				<dx-form class="plain-styled-form dx-form form-container">

				<dx-form-group-item :col-count="4">
					<dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

					<dx-form-item css-class="accent" >
					<dx-select-box
						label="Facility"
						:items="locationOptions"
						v-model="formData.location"
						:read-only=true
						placeholder=""
						 />
					</dx-form-item>

					<dx-form-item css-class="accent">
					<dx-select-box
						label="Truck Size"
						:items="truckTypeOptions"
						display-expr="label"
						value-expr="value"
						v-model="formData.truck_type"
						:read-only=true
						placeholder=""
						 />
					</dx-form-item>

					<dx-form-item :col-span="2" css-class="accent">
						<dx-text-area
						label="Building Notes"
						v-model="formData.building_notes"
						/>
					</dx-form-item>

				</dx-form-group-item>
				</dx-form>

				<div class="form-container" >
				<DxDataGrid
					ref="dataGridSuppliesRef"
					:data-source="formData.supplies"
					:show-borders="true"
					v-model:selected-row-keys="selectedRowsSupplies"
					key-expr="name" >
					<DxEditing
					:allow-updating="true"
					:allow-adding="true"
					mode="cell" />
					<!-- <DxPager :visible="true"/> -->
					<!-- <DxScrolling row-rendering-mode="virtual"/> -->
					<DxPaging :page-size="5"/>
					<DxPager
						:visible="true"
						:allowed-page-sizes="pageSizes"
						:display-mode="displayMode"
						:show-page-size-selector="showPageSizeSelector"
						:show-info="showInfo"
						:show-navigation-buttons="showNavButtons"
					/>
					<DxSelection mode="multiple"/>

					<DxColumn data-field="supply" caption="Item">
					<!-- <DxRequiredRule/> -->
					<DxLookup :data-source="supplyOptions" display-expr="label" value-expr="value"/>
					</DxColumn>

					<DxColumn data-field="quantity" caption="Quantity" data-type="number">
						<!-- <DxRequiredRule/> -->
						<DxRangeRule :min="0" message="Quantity cannot be negative" />
						<!-- <DxNumberBox :min="0" format="#" /> -->
					</DxColumn>
					<DxToolbar>
					<DxItem>
						<DxButton class="additional-btn" text="Remove" type="default" styling-mode="contained" @click="removeRowSupplies"/>
					</DxItem>
					<!-- <DxItem location="after">
						<DxButton class="additional-btn" text="Save" type="default" styling-mode="contained" @click="saveChangesSupplies"/>
					</DxItem> -->
					<DxItem location="after">
						<DxButton class="additional-btn" icon="plus" text="New" type="default" styling-mode="contained" @click="addRowSupplies"/>
					</DxItem>
					</DxToolbar>
				</DxDataGrid>
				</div>

				<dx-form class="plain-styled-form dx-form form-container">
				<dx-form-group-item :col-count="4">
					<dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />
					<dx-form-item :col-span="2" >
					<dx-text-area
					label="Supply Notes"
					v-model="formData.supply_notes"
					/>
				</dx-form-item>
				</dx-form-group-item>

				<!-- <dx-form-group-item :col-count="4">
					<dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />
					<dx-form-item :col-span="2" css-class="accent">
					<dx-select-box
						label="Tags"
						v-model="formData.tags"
					/>
					</dx-form-item>
				</dx-form-group-item> -->
    			</dx-form>
		</dx-tab-item>

		<dx-tab-item title="References">
				<dx-form class="plain-styled-form dx-form form-container">

				<dx-form-group-item :col-count="4">
					<dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

					<dx-form-item css-class="accent">
					<dx-text-box
						label="BOL"
						v-model="formData.bol"
					/>
					</dx-form-item>

					<dx-form-item css-class="accent">
					<dx-text-box
						label="Reference Number"
						v-model="formData.reference_number"
					/>
					</dx-form-item>

					<!-- <dx-form-item :col-span="2" css-class="accent">
					<dx-select-box
						label="Tags"
						v-model="formData.tags"
					/>
					</dx-form-item> -->

				</dx-form-group-item>
    			</dx-form>

				<div class="form-container">
					<DxDataGrid
						ref="dataGridRef"
						:data-source="formData.references"
						:show-borders="true"
						v-model:selected-row-keys="selectedRowsReference"
						key-expr="name">
						<DxEditing
						:allow-updating="true"
						:allow-adding="true"
						mode="cell"/>
						<DxPaging :enabled="false"/>
						<DxSelection mode="multiple"/>

						<DxColumn data-field="refrence_field_name" caption="Reference field name">
							<!-- <DxRequiredRule/> -->
						 </DxColumn>
						<DxColumn data-field="refrence_field_value" caption="Reference field value">
							<!-- <DxRequiredRule/>  -->
						</DxColumn>
						<DxToolbar>
						<DxItem>
							<DxButton class="additional-btn" text="Remove" type="default" styling-mode="contained" @click="removeRowReference"/>
						</DxItem>
						<!-- <DxItem location="after">
							<DxButton class="additional-btn" text="Save" type="default" styling-mode="contained" @click="saveChangesReference"/>
						</DxItem> -->
						<DxItem location="after">
							<DxButton class="additional-btn" icon="plus" text="New" type="default" styling-mode="contained" @click="addRowReference"/>
						</DxItem>
						</DxToolbar>
					</DxDataGrid>
				</div>
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

.draft-badge {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: 4.5px 8px;
  border-radius: 999px;
  height: 20px;
  background-color: #f3f3f3 !important;
  color: #525252 !important;
  margin-left: 10px;
  display: inline-flex;
  align-items: center;
}

.active-badge {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: 4.5px 8px;
  border-radius: 999px;
  height: 20px;
  background-color: #e4f5e9 !important;
  color: #16794c !important;
  margin-left: 10px;
  display: inline-flex;
  align-items: center;
}

.checkbox-wrapper {
  display: block; /* Ensure the checkbox is on a new line */
  margin-top: 8px; /* Add space above the checkbox */
}
.row {
  border: none !important;
}

.main-content {
  /* border: 1px solid #e0e0e0; */
  border: 1px solid var(--base-border-color);
  border-radius: 8px;
}

.section-title {
  font-size: 14px; /* Match the label font size */
  font-weight: bold; /* Optional: Make it bold */
  color: #525252; /* Match the label color */
  margin-bottom: 10px; /* Add some spacing below the title */
  text-align: left; /* Align to the left */
  padding-left: 15px;
}

.additional-btn {
  margin-left: 10px;
}

</style>

