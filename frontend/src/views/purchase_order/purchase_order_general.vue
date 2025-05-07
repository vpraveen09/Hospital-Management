<script setup>
import { defineExpose, inject, onMounted, reactive, ref, watch, defineProps } from 'vue';
import { call, createResource } from "frappe-ui";
import { DxCustomRule, DxValidationRule, DxValidator } from "devextreme-vue/validator";
import { DxForm, DxItem, DxColCountByScreen } from 'devextreme-vue/form';
import DxDateBox from 'devextreme-vue/date-box';
import DxNumberBox from 'devextreme-vue/number-box';
import DxSelectBox from 'devextreme-vue/select-box';
import DxTagBox from 'devextreme-vue/tag-box';
import DxTextArea from 'devextreme-vue/text-area';
import DxTextBox from 'devextreme-vue/text-box';

const props = defineProps({
    created_purchase_order: {
        type: String
    }
});

const showToast = inject('showToast');

const isValidationTriggered = ref(false);
const employeeOptions = ref([]);
const receivingFacilitiesOptions = ref([]);
const accountLocationEmployeeMap = ref({});
const employeeMap = ref({});
const locationsOptions = ref([]);
const createdLodationMap = ref([])
const createdFacilitiesMap = ref([])

let accountOptions = ref([]);
let accountOptionsMap = ref([]);

const formData = reactive({
    account: '',
    expiration_date: '',
    effective_date: '',
    client_reference: '',
    csr: '',
    receiving_facilities: '',
    sales: '',
    incoterms: '',
    locations: '',
    po_notes: '',
    payment_terms: ''
});

const validateForm = () => {
    isValidationTriggered.value = true;

    const requiredFields = [
        { key: "account", label: "Account" },
        { key: "effective_date", label: "Effective Date" },
        { key: "expiration_date", label: "Expiration Date" },
        { key: "locations", label: "Locations" },
        { key: "receiving_facilities", label: "Receiving Facilities" },
        { key: "sales", label: "Sales" },
        { key: "csr", label: "CSR" },
        { key: "incoterms", label: "Incoterms" }
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
    if (!validateEffectiveDate()) {
        showToast("Effective Date should be before or equal to Expiration Date", "error");
        return false;
    }

    if (!validateExpirationDate()) {
        showToast("Expiration Date should be in the future", "error");
        return false;
    }

    return true;
};


const fetchData = async (doctype, fields = ["name"], filters = [], mapFn = (item) => item.name, skipMap = false) => {
    try {
        const response = await createResource({
            url: "frappe.client.get_list",
            params: {
                doctype,
                fields: JSON.stringify(fields),
                filters: JSON.stringify(filters),
                limit_page_length: 0,
            },
        }).fetch();

        return skipMap ? response : response.map(mapFn);
    } catch (error) {
        console.error(`Error fetching ${doctype} details:`, error);
        showToast(`Failed to fetch ${doctype} details`, "error");
        return [];
    }
};

const fetchAccountOptions = async () => {
    try {
        accountOptionsMap.value = await fetchData(
            "Accounts",
            ["name", "account_name", "sales_contact", "csr", "locations"],
            [],
            null,
            true
        );

        accountOptions.value = accountOptionsMap.value.map((acc) => ({
            label: acc.account_name,
            value: acc.name,
        }));
    } catch (error) {
        console.error("Error fetching account options:", error);
    }
};


const fetchLocations = async () => {
    try {
        const locationResponse = await createResource({
            url: "frappe.client.get_list",
            params: {
                doctype: "Location",
                fields: JSON.stringify(["name"]),
            },
        }).fetch();
        locationsOptions.value = locationResponse.map((location) => location.name);
    } catch (error) {
        console.error("Error fetching locations:", error);
    }
};

const fetchReceivingFacilities = async () => {
    try {
        const receivingResponse = await createResource({
            url: "frappe.client.get_list",
            params: {
                doctype: "Ware House",
                fields: JSON.stringify(["name"]),
            },
        }).fetch();
        receivingFacilitiesOptions.value = receivingResponse.map((facility) => facility.name);
    } catch (error) {
        console.error("Error fetching receiving facilities:", error);
    }
};

const fetchEmployeeDetails = async () => {
    try {
        employeeOptions.value = await fetchData("Employee", ["name", "first_name"], [], (employee) => ({
            label: employee.first_name || employee.name,
            value: employee.name,
        }));
    } catch (error) {
        console.error("Error fetching employee details:", error);
    }
};

const fetchPurchaseOrderData = async (purchaseOrderName) => {
    try {
        const purchaseOrderResponse = await createResource({
            url: "axe_product.api.doc.get_data",
            params: {
                doctype: "Purchase Order",
                name: purchaseOrderName,
            },
        }).fetch();

        let order = purchaseOrderResponse.message.data;


        Object.keys(formData).forEach((key) => {
            if (order[key] !== undefined) {
                formData[key] = order[key];
            }
        });

        formData.account = order.account

        formData.locations = order.order_location?.map(loc => loc.location) || [];
        formData.receiving_facilities = order.receiving_facilities?.map(loc => loc.ware_house);

        locationsOptions.value = order.order_location
        createdLodationMap.value = order.order_location;
        createdFacilitiesMap.value = order.receiving_facilities;
    } catch (error) {
        console.error("Error fetching purchase order data:", error);
    }
};

const createPurchaseOrder = async () => {
    try {
        const formDataCopy = { ...formData };

        if (formDataCopy.account) {
            const accountEntry = Object.values(accountLocationEmployeeMap.value).find(
                acc => acc.account_name === formDataCopy.account
            );
            formDataCopy.account = accountEntry ? accountEntry.name : formDataCopy.account;
        }
        if (formDataCopy.csr) {
            const csrEmployee = Object.values(employeeMap.value).find(emp => emp.value === formDataCopy.csr);
            formDataCopy.csr = csrEmployee ? csrEmployee.name : formDataCopy.csr;
        }
        if (formDataCopy.sales) {
            const salesEmployee = Object.values(employeeMap.value).find(emp => emp.value === formDataCopy.sales);
            formDataCopy.sales = salesEmployee ? salesEmployee.name : formDataCopy.sales;
        }

        const formDataWithoutLocations = { ...formDataCopy };

        delete formDataWithoutLocations.locations;
        delete formDataWithoutLocations.receiving_facilities;

        const response = await call("frappe.client.insert", {
            doc: {
                doctype: "Purchase Order",
                ...formDataWithoutLocations,
            },
        });

        if (response) {
            let createdID = response.name

            const locations = formData.locations || [];
            const childRecords = locations.map((location) => ({
                doctype: "Location Details",
                parent: createdID,
                parenttype: "Purchase Order",
                parentfield: "order_location",
                location: location,
            }));

            const receivinglocations = formData.receiving_facilities || [];
            const childReceivingRecords = receivinglocations.map((location) => ({
                doctype: "Ware House Child",
                parent: createdID,
                parenttype: "Purchase Order",
                parentfield: "receiving_facilities",
                ware_house: location,
            }));

            try {
                const bulkResponse = await call("frappe.client.insert_many", {
                    docs: childRecords,
                });

            } catch (bulkError) {
                showToast("Failed to add locations in bulk", "error");
            }

            try {
                const bulkReceivingResponse = await call("frappe.client.insert_many", {
                    docs: childReceivingRecords,
                });
                showToast("Purchase Order Created Successfully", "success");

                return createdID

            } catch (bulkError) {
                console.error("Error in bulk insert:", bulkError);
                showToast("Failed to add locations in bulk", "error");
            }
        }
    } catch (error) {
        console.error("Error creating order:", error);
        showToast("Order Creation Failed", "error");
    }
};


const updatePurchaseOrder = async () => {
    try {
        const formDataCopy = { ...formData };

        if (formDataCopy.account) {
            const accountEntry = Object.values(accountLocationEmployeeMap.value).find(
                acc => acc.account_name === formDataCopy.account
            );
            formDataCopy.account = accountEntry ? accountEntry.name : formDataCopy.account;
        }
        if (formDataCopy.csr) {
            const csrEmployee = Object.values(employeeMap.value).find(emp => emp.value === formDataCopy.csr);
            formDataCopy.csr = csrEmployee ? csrEmployee.name : formDataCopy.csr;
        }
        if (formDataCopy.sales) {
            const salesEmployee = Object.values(employeeMap.value).find(emp => emp.value === formDataCopy.sales);
            formDataCopy.sales = salesEmployee ? salesEmployee.name : formDataCopy.sales;
        }
        const formDataWithoutLocations = { ...formDataCopy };

        delete formDataWithoutLocations.locations;
        delete formDataWithoutLocations.receiving_facilities;

        const updateResource = await createResource({
            url: 'frappe.client.set_value',
            params: {
                doctype: 'Purchase Order',
                name: props.created_purchase_order,
                fieldname: formDataWithoutLocations
            },
            onSuccess: async (response) => {
                let UpdatedId = response.name;

                const removedLocations = createdLodationMap.value.filter(
                    loc => !formData.locations.includes(loc.location)
                );

                const addedLocations = formData.locations.filter(
                    loc => !createdLodationMap.value.some(existing => existing.location === loc)
                );

                const removedFacilities = createdFacilitiesMap.value.filter(
                    fac => !formData.receiving_facilities.includes(fac.ware_house)
                );

                const addedFacilities = formData.receiving_facilities.filter(
                    fac => !createdFacilitiesMap.value.some(existing => existing.ware_house === fac)
                );

                const locationRecords = addedLocations.map(location => ({
                    doctype: "Location Details",
                    parent: UpdatedId,
                    parenttype: "Purchase Order",
                    parentfield: "order_location",
                    location: location
                }));

                if (locationRecords.length > 0) {
                    try {
                        await call("frappe.client.insert_many", { docs: locationRecords });
                        showToast("Locations updated successfully", "success");
                    } catch (error) {
                        console.error("Error adding new locations:", error);
                        showToast("Failed to update locations", "error");
                    }
                }

                for (let loc of removedLocations) {
                    try {
                        await call("frappe.client.delete", {
                            doctype: "Location Details",
                            name: loc.name
                        });
                    } catch (error) {
                        console.error("Error deleting location:", error);
                    }
                }

                for (let fac of removedFacilities) {
                    try {
                        await call("frappe.client.delete", {
                            doctype: "Ware House Child",
                            name: fac.name
                        });
                    } catch (error) {
                        console.error("Error deleting facility:", error);
                    }
                }

                const facilityRecords = addedFacilities.map(facility => ({
                    doctype: "Ware House Child",
                    parent: UpdatedId,
                    parenttype: "Purchase Order",
                    parentfield: "receiving_facilities",
                    ware_house: facility
                }));

                if (facilityRecords.length > 0) {
                    try {
                        await call("frappe.client.insert_many", { docs: facilityRecords });
                    } catch (error) {
                        showToast("Failed to update receiving facilities", "error");
                    }
                }

                showToast("Purchase Order Updated Successfully", "success");
                return UpdatedId
            },
            onError: (error) => {
                console.error("Update Failed:", error);
                showToast("Failed to update employee", "error");
            }
        })

        await updateResource.fetch();
    } catch (error) {
        console.error("Error creating order:", error);
        showToast("Order Creation Failed", "error");
    }
};

const validateEffectiveDate = () => {
    if (!formData.effective_date || !formData.expiration_date) {
        return true;
    }
    return new Date(formData.effective_date) <= new Date(formData.expiration_date);
};

const validateExpirationDate = () => {
    if (!formData.expiration_date) {
        return true;
    }
    return new Date(formData.expiration_date) > new Date();
};


defineExpose({
    createPurchaseOrder,
    updatePurchaseOrder,
    validateForm
});

watch(
    () => formData.account,
    async (newAccount) => {
        if (newAccount) {

            const selectedOrder = accountOptionsMap.value.find((account) => account.name === newAccount);

            if (selectedOrder) {

                formData.csr = selectedOrder.csr || "";
                formData.sales = selectedOrder.sales_contact || "";

                try {
                    const locationDetailsResponse = await createResource({
                        url: "axe_product.api.doc.get_data",
                        params: {
                            doctype: "Accounts",
                            name: selectedOrder.name,
                        },
                    }).fetch();

                    const accountLocations = locationDetailsResponse.message.data.locations.map((item) => item.location);

                    locationsOptions.value = accountLocations;
                } catch (error) {
                    console.error("Error fetching location details:", error);
                }
            }
        } else {
            formData.csr = '';
            formData.sales = '';
            formData.locations = '';
            formData.receiving_facilities = '';
            locationsOptions.value = [];
            return;
        }
    }
)

onMounted(async () => {
    if (props.created_purchase_order) {
        await fetchPurchaseOrderData(props.created_purchase_order); // Fetch existing purchase order first
    }

    await fetchAccountOptions();
    await fetchLocations();
    await fetchReceivingFacilities();
    await fetchEmployeeDetails();
});

</script>

<template>
    <div>
        <dx-form :form-data="formData" :col-count=4 class="form-container" :label-mode="'static'">
            <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />
            <dx-item :col-span="1">
                <label class="form-label">Account<span class="required">*</span></label>
                <dx-select-box :items="accountOptions" v-model="formData.account" class="p-2 border rounded-md"
                    placeholder="" display-expr="label" value-expr="value" styling-mode="outlined"
                    :search-enabled="true" :show-clear-button="true"
                    :class="{ 'border-red': !formData.account && isValidationTriggered }" />

            </dx-item>

            <dx-item :col-span="1">
                <label class="form-label">Effective Date<span class="required">*</span></label>
                <DxDateBox date-serialization-format="yyyy-MM-dd" display-format="MM/dd/yyyy" styling-mode="outlined"
                    v-model="formData.effective_date" class="p-2 border rounded-md"
                    :class="{ 'border-red': !formData.effective_date && isValidationTriggered }">
                    <DxValidator>
                        <DxValidationRule type="required" message="Effective Date is required" />
                        <DxCustomRule :validation-callback="validateEffectiveDate"
                            message="Effective Date cannot be greater than Expiration Date" />
                    </DxValidator>
                </DxDateBox>
            </dx-item>

            <dx-item :col-span="1">
                <label class="form-label">Receiving Warehouses<span class="required">*</span></label>
                <dx-tag-box :items="receivingFacilitiesOptions" v-model="formData.receiving_facilities"
                    :hide-selected-items="true" class="p-2 border rounded-md" placeholder=""
                    :key="formData.receiving_facilities.length"
                    :class="{ 'border-red': !formData.receiving_facilities.length && isValidationTriggered }"
                    :show-clear-button="true" styling-mode="outlined" />
            </dx-item>

            <dx-item :col-span="1">
                <label class="form-label">Locations<span class="required">*</span></label>
                <dx-tag-box :items="locationsOptions" v-model="formData.locations" class="p-2 border rounded-md"
                    :hide-selected-items="true" :key="formData.locations.length" placeholder=""
                    :show-clear-button="true"
                    :class="{ 'border-red': !formData.locations.length && isValidationTriggered }"
                    styling-mode="outlined" />
            </dx-item>

            <dx-item :col-span="1">
                <label class="form-label">Expiration Date<span class="required">*</span></label>
                <DxDateBox date-serialization-format="yyyy-MM-dd" display-format="MM/dd/yyyy" styling-mode="outlined"
                    v-model="formData.expiration_date"
                    :class="{ 'border-red': !formData.expiration_date && isValidationTriggered }"
                    class="p-2 border rounded-md">
                    <DxValidator>
                        <DxValidationRule type="required" message="Expiration Date is required" />
                        <DxCustomRule :validation-callback="validateExpirationDate"
                            message="Expiration Date must be in the future" />
                    </DxValidator>
                </DxDateBox>
            </dx-item>
            <dx-item :col-span="1">
                <label class="form-label">Client Ref.#</label>
                <dx-text-box v-model="formData.client_reference" class="p-2 border rounded-md"
                    styling-mode="outlined" />
            </dx-item>

            <dx-item :col-span="1">
                <label class="form-label">Sales<span class="required">*</span></label>
                <dx-select-box :items="employeeOptions" v-model="formData.sales" class="p-2 border rounded-md"
                    placeholder="" :class="{ 'border-red': !formData.sales && isValidationTriggered }"
                    display-expr="label" value-expr="value" styling-mode="outlined" />
            </dx-item>

            <dx-item :col-span="1">
                <label class="form-label">Incoterms<span class="required">*</span></label>
                <dx-select-box :items="['CIF', 'CRF', 'DAP', 'EXW', 'FAS', 'FOB']" v-model="formData.incoterms"
                    placeholder="" :class="{ 'border-red': !formData.incoterms && isValidationTriggered }"
                    class="p-2 border rounded-md" styling-mode="outlined" />
            </dx-item>

            <!-- <dx-item :col-span="1">
                <label class="form-label">PO Tags</label>
                <dx-select-box :items="['tag 1', 'tag 2']" v-model="formData.po_tags" class="p-2 border rounded-md"
                   styling-mode="outlined" />
            </dx-item> -->

            <dx-item :col-span="1">
                <label class="form-label">CSR<span class="required">*</span></label>
                <dx-select-box :items="employeeOptions" v-model="formData.csr" class="p-2 border rounded-md"
                    placeholder="" :class="{ 'border-red': !formData.csr && isValidationTriggered }"
                    display-expr="label" value-expr="value" styling-mode="outlined" />
            </dx-item>

            <dx-item :col-span="1">
                <label class="form-label">Payment Terms</label>
                <DxNumberBox format="#" v-model="formData.payment_terms" :min="0" class="p-2 border rounded-md"
                    styling-mode="outlined" />
            </dx-item>

            <!-- <dx-item :col-span="1">
                <label class="form-label">Order Alert</label>
                <div>
                    <dx-check-box v-model="formData.order_alert" class="p-2 border rounded-md" />
                </div>
            </dx-item> -->

            <dx-item :col-span="1">
                <label class="form-label">PO Notes</label>
                <dx-text-area v-model="formData.po_notes" class="p-2 border rounded-md" styling-mode="outlined" />
            </dx-item>
        </dx-form>
    </div>
</template>

<style scoped></style>
