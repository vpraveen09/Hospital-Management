<script setup>
import { defineExpose, onMounted, ref, inject, defineProps } from 'vue';
import DxDataGrid, { DxColumn, DxEditing, DxLookup, DxSelection, DxToolbar } from 'devextreme-vue/data-grid';
import { DxColCountByScreen, DxForm, DxGroupItem as DxFormGroupItem, DxItem } from 'devextreme-vue/form';
import { createResource } from "frappe-ui";
import DxButton from 'devextreme-vue/button';
import DxTagBox from 'devextreme-vue/tag-box';
import DxTextBox from 'devextreme-vue/text-box';

const props = defineProps({
    tab_purchase_order_id: {
        type: String,
        required: true
    },
});

const showToast = inject('showToast');

const gridData = ref([]);
const locationsOptions = ref([]);
const dataGridServiceRef = ref(null);

let purchase_order_id = props.tab_purchase_order_id;

const serviceOptions = ref([
    { label: 'Freight', value: 'Freight' },
    { label: 'Labour Hour', value: 'Labour Hour' },
    { label: 'Gaylord', value: 'Gaylord' },
    { label: 'Tolling', value: 'Tolling' },
    { label: 'Pallet', value: 'Pallet' },
])

const formData = ref({
    account: null,
    locations: '',
    sales: null,
    csr: null,
    po_tags: null,
    purchase_order_service: []
});

const addRowService = () => addRow(dataGridServiceRef);
// const removeRowServices = () => removeRow(dataGridServiceRef, selectedRowsSupplies.value, 'supplies');
const saveChangesServices = () => saveChanges(dataGridServiceRef);

const addRow = (dataGridRef) => dataGridRef.value?.instance.addRow();

const removeRow = (dataGridRef, selectedRows, formDataKey) => {
    if (!dataGridRef.value?.instance || !Array.isArray(selectedRows) || selectedRows.length === 0) return;
    formData[formDataKey] = formData[formDataKey].filter(row => !selectedRows.includes(row.name));
    selectedRows.length = 0;
    nextTick(() => dataGridRef.value?.instance.refresh());
};

const saveChanges = (dataGridRef) => {
    dataGridRef.value?.instance.saveEditData();
};


const fetchDetails = async () => {
    try {

        const purchaseOrderServiceResponse = await createResource({
            url: "axe_product.api.doc.get_data",
            params: {
                doctype: "Purchase Order",
                name: purchase_order_id
            },
        }).fetch();

        let response = purchaseOrderServiceResponse.message.data

        formData.value.account = response.account_name
        formData.value.sales = response.sales_name
        formData.value.csr = response.csr_name
        formData.value.po_tags = response.po_tags
        let locationValues = response.order_location.filter(field => field.location).map(field => field.location);
        locationsOptions.value = locationValues;

        let serviceResponse = response.purchase_order_service

        // formData.value.purchase_order_service = serviceResponse

        gridData.value = serviceResponse;

    } catch (error) {
        console.error("Error fetching details:", error);
    }
};

const updatePurchaseOrderService = async () => {

    formData.value.purchase_order_service = gridData.value;
    const insertData = { ...formData.value };

    try {
        const updateResource = createResource({
            url: 'frappe.client.set_value',
            params: {
                doctype: 'Purchase Order',
                name: purchase_order_id,
                fieldname: {
                    purchase_order_service: gridData.value
                }
            },
            // auto: true,
            onSuccess: (response) => {
                // showToast("Purchase Order Service Created Successfully", "success");
            },
            onError: (error) => {
                console.error("Update Failed:", error);
                showToast("Failed to update employee", "error");
            }
        })

        await updateResource.fetch();
    } catch (error) {
        console.error("Error in handleSaveClick:", error);
        showToast("Failed to save Purchase Order Resale Details", "error");
    }
}

defineExpose({
    updatePurchaseOrderService
});

onMounted(() => {
    fetchDetails()
});

</script>

<template>
    <div>

        <dx-form :form-data="formData" class="form-container" :label-mode="'static'">

            <dx-form-group-item :col-count="4">
                <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

                <!-- Account -->
                <dx-item>
                    <label class="form-label">Account</label>
                    <dx-text-box v-model="formData.account" class="p-2 border rounded-md" :disabled="true"
                        styling-mode="outlined" />
                </dx-item>

                <!-- Locations -->
                <dx-item>
                    <label class="form-label">Locations</label>
                    <dx-tag-box :value="locationsOptions" v-model="formData.locations" class="p-2 border rounded-md"
                        :hide-selected-items="true" :disabled="true"
                        styling-mode="outlined" />
                </dx-item>

                <!-- Sales -->
                <dx-item>
                    <label class="form-label">Sales</label>
                    <dx-text-box v-model="formData.sales" class="p-2 border rounded-md" :disabled="true"
                        styling-mode="outlined" />
                </dx-item>

                <!-- CSR -->
                <dx-item>
                    <label class="form-label">CSR</label>
                    <dx-text-box v-model="formData.csr" class="p-2 border rounded-md" :disabled="true"
                        styling-mode="outlined" />
                </dx-item>
            </dx-form-group-item>

            <dx-form-group-item :col-count="4">
                <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />
                <dx-item>
                    <label class="form-label">PO Tags</label>
                    <dx-text-box v-model="formData.po_tags" class="p-2 border rounded-md" :disabled="true"
                        styling-mode="outlined" />
                </dx-item>
            </dx-form-group-item>
            <dx-item>
                <dx-data-grid :dataSource="gridData" ref="dataGridServiceRef" :show-borders="true"
                    :show-column-lines="true">
                    <dx-selection :mode="'multiple'" :show-checkboxes-mode="'always'" />
                    <dx-editing mode="batch" :allowAdding=true :allowUpdating=true :allowDeleting=true></dx-editing>

                    <!-- <dx-column dataField="attribute_name" caption="Attribute Name" /> -->
                    <dx-column dataField="service" caption="Service">
                        <DxLookup :data-source="serviceOptions" display-expr="label" value-expr="value" />
                    </dx-column>

                    <dx-column dataField="price" caption="Price($)" format="currency" data-type="number">
                    </dx-column>

                    <dx-column dataField="description" caption="Description" />

                    <DxToolbar>
                        <!-- <DxItem>
                            <DxButton class="additional-btn" text="Remove" type="default" styling-mode="contained"
                                @click="removeRowServices" />
                        </DxItem> -->
                        <DxItem>
                            <DxButton class="additional-btn" text="Save" type="default" styling-mode="contained"
                                @click="saveChangesServices" />
                        </DxItem>
                        <DxItem>
                            <DxButton class="additional-btn" icon="plus" text="New" type="default"
                                styling-mode="contained" @click="addRowService" />
                        </DxItem>
                    </DxToolbar>
                </dx-data-grid>
            </dx-item>


        </dx-form>

    </div>
</template>

<style scoped lang="scss">
@use "@/variables" as *;
@use "sass:math";

@media only screen and (max-width: 875px) {
    :deep(.contact-name-toolbar-item) {
        min-width: calc(var(--left-panel-width) + var(--right-panel-width) - 145px);
    }
}

.button-container {
    display: flex !important;
    //   gap: 10px !important; /* Add space between the buttons */
    //   flex-wrap: wrap !important; /* Allow buttons to wrap on smaller screens */
}

// @media (min-width: 768px) {
//   .button-container {
//     justify-content: center; /* Center buttons on larger screens */
//   }
// }

.fields-container {
    display: flex;
    flex-wrap: wrap;
    gap: 5%;
    // margin-left: 15px;
    margin-top: 15px;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--base-border-color);
}

.field {
    // flex: 1 1 calc(48% - 1rem);
    // max-width: calc(48% - 1rem);
    min-width: 250px;
    padding-bottom: 12px
}

.arrow {
    --s: 15px;
    padding: 0 15px 0 10px;
    clip-path: polygon(0 0, calc(100% - var(--s)) 0, 100% 50%, calc(100% - var(--s)) 100%, 0 100%);
    color: white !important;
    background: #28a0e2;
    font-weight: bold;
    width: fit-content;
    line-height: 2.4;
    font-size: 15px;
    text-decoration: none;
}

.arrow span {
    display: inline-block;
    transform: rotate(-180deg);
}

.additional-btn {
  margin-left: 10px;
}
</style>
