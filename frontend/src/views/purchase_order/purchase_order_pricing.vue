<script setup>
import { defineProps, inject, nextTick, onMounted, ref } from 'vue';
import { DxColCountByScreen, DxForm, DxItem } from 'devextreme-vue/form';
import { call, createResource } from "frappe-ui";
import DxButton from 'devextreme-vue/button';
import DxPopup from "devextreme-vue/popup";
import DxTagBox from 'devextreme-vue/tag-box';
import DxTextBox from 'devextreme-vue/text-box';
import CustomStore from 'devextreme/data/custom_store';

import gridView from '@/components/grid-view.vue';
import PopupGrid from '@/components/popup-grid.vue';

const props = defineProps({
    tab_purchase_order_id: {
        type: String,
        required: true
    },
});

const emit = defineEmits(['update:popupVisible', , 'row-click']);

const showToast = inject('showToast');
const popupVisible = ref(false);
const locationsOptions = ref([]);
const poTemplateOptions = ref([])
const poTempalteMap = ref([])
const selectedpoTemplateID = ref([])
const gridDataSource = ref({});
const popupDataSource = ref({});
const fieldName = ref([]);
const responseData = ref([]);
const doctype = ref('Purchase Order Pricing Details');
const confirmPopupVisible = ref(false);

let purchase_order_id = props.tab_purchase_order_id;
let removeRowID = ref(null);

const formData = ref({
    account: null,
    locations: '',
    sales: null,
    csr: null,
    // po_tags: null,
    po_template: ''
});

const handleRowClick = (data) => {
    emit('row-click', data);
};

const handle_item_popup = async () => {
    fieldName.value = [];
    popupDataSource.value = {};
    await nextTick();
    let url = 'axe_product.api.purchase_order.get_product_grid_data'
    popupDataSource.value = createDataSource('Product Master', url);
    popupVisible.value = true;
};

const initialGridData = () => {
    let url = 'axe_product.api.purchase_order.get_order_details_grid_data'
    gridDataSource.value = createDataSource('Purchase Order Pricing Details', url, null, purchase_order_id);
}

const handlePopupHiding = () => {
    emit('update:popupVisible', false);
    popupVisible.value = false;
    fieldName.value = [];
    popupDataSource.value = {};
    initialGridData()
};

const handleDuplicate = (duplicateItem) => {
    popupVisible.value = false;
    showToast(`Duplicate found: ${duplicateItem} already exists in the pricing grid.`, "error");
};

const updateSelectedRowKeys = (newSelectedKeys) => {
    removeRowID.value = newSelectedKeys
};

const showDeleteConfirmation = () => {

    let removeRows = removeRowID.value

    if (removeRows == null || removeRows.length == 0) {
        showToast("No Rows selected", "warning");
        return;
    }
    confirmPopupVisible.value = true;
};

const confirmDeletion = async () => {
    confirmPopupVisible.value = false;
    await handleRemoveRowClick();
};

const fetchDetails = async () => {
    try {

        const poTemplateResponse = await createResource({
            url: "frappe.client.get_list",
            params: {
                doctype: "Purchase Order Template",
                fields: JSON.stringify(["name", "template_name"]),
            },
        }).fetch();

        poTemplateOptions.value = poTemplateResponse.map((order) => order.template_name);

        poTemplateResponse.forEach(async (order) => {
            poTempalteMap.value[order.template_name] = {
                name: order.name,
                value: order.template_name,
                po_details_name: []
            };

            try {
                const templateDetailsResponse = await createResource({
                    url: "axe_product.api.doc.get_data",
                    params: {
                        doctype: "Purchase Order Template",
                        name: order.name,
                    },
                }).fetch();

                const poDetails = templateDetailsResponse.message.data.active_items.map(item => item.name);

                poTempalteMap.value[order.template_name].po_details_name = poDetails;

            } catch (error) {
                console.error("Error fetching template details for", order.template_name, error);
            }
        });

        if (purchase_order_id) {
            const purchaseOrderResponse = await createResource({
                url: "axe_product.api.doc.get_data",
                params: {
                    doctype: "Purchase Order",
                    name: purchase_order_id,
                }
            }).fetch();

            const templateresponseData = purchaseOrderResponse.message.data

            formData.value.account = templateresponseData.account_name
            formData.value.sales = templateresponseData.sales_name
            formData.value.csr = templateresponseData.csr_name
            // formData.value.po_tags = templateresponseData.po_tags

            formData.value.po_template = Object.values(templateresponseData.po_template_names)

            let locationValues = templateresponseData.order_location.filter(field => field.location).map(field => field.location);
            locationsOptions.value = locationValues;
        }


    } catch (error) {
        console.error("Error fetching details:", error);
    }
};

const createDataSource = (doctypeValue, url, selectedRowKeys = null, purchaseOrderName = null) => {
    doctype.value = doctypeValue

    return new CustomStore({
        key: 'name',
        load: async (loadOptions) => {
            let { filter, sort, skip, take } = loadOptions;

            if (!filter) {
                filter = [];
            }

            const orderBy = sort?.length
                ? sort.map((s) => `${s.selector} ${s.desc ? 'desc' : 'asc'}`).join(',')
                : 'name desc';

            const params = {
                doctype: doctypeValue,
                filters: JSON.stringify(filter),
                limit_start: skip || 0,
                limit_page_length: take || 10,
                order_by: orderBy,
                selectedRowKeys: selectedRowKeys,
                purchaseOrderName: purchaseOrderName
            };

            const resource = createResource({
                url: url,
                method: 'GET',
                params,
            });

            try {
                const response = await resource.fetch();
                const data = response.message.data || [];

                setTimeout(() => {
                    if (response.message.fields) {
                        const newFields = response.message.fields || [];
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
                    totalCount: response.message.total_count || 0,
                };
            } catch (error) {
                console.error('Error fetching data:', error);
                throw error;
            }
        },
    });
};

const handle_potemplate_popup = async () => {

    if (formData.value.po_template.length != 0) {
        fieldName.value = [];
        popupDataSource.value = {};
        await nextTick();

        const selectedPoDetailsNames = formData.value.po_template.map(templateName => {
            const template = poTempalteMap.value[templateName];
            return template ? template.po_details_name : [];
        }).flat();

        const poTemplateID = formData.value.po_template.map(templateName => {
            const template = poTempalteMap.value[templateName];
            return template ? template.name : null;
        }).filter(name => name !== null);

        selectedpoTemplateID.value = poTemplateID;

        let url = 'axe_product.api.purchase_order.get_active_grid_data'
        popupDataSource.value = createDataSource('PO Template', url, selectedPoDetailsNames);
        popupVisible.value = true;
    } else {
        showToast("Please Select the PO Template", "warning");
    }
};

const handleRemoveRowClick = async () => {
    let removeRows = removeRowID.value

    // if (!removeRows.length) {
    //     showToast("No Rows selected", "warning");
    //     return;
    // }
    try {
        for (let gridData of removeRows) {

            const purchaseOrderResponse = await createResource({
                url: "axe_product.api.doc.get_data",
                params: {
                    doctype: "Purchase Order",
                    name: props.tab_purchase_order_id,
                }
            }).fetch();

            let activeItemsMap = purchaseOrderResponse.message.data.active_items
            const removeID = activeItemsMap.find(item => item.purchase_order_pricing_details === gridData)?.name || null;

            try {
                await call("frappe.client.delete", {
                    doctype: "Purchase Order Pricing Details Child",
                    name: removeID
                });

                try {
                    await call("frappe.client.delete", {
                        doctype: "Purchase Order Pricing Details",
                        name: gridData
                    });
                    showToast("Row Deleted Successfully", "success");


                } catch (error) {
                    console.error("Error deleting Purchase Order Pricing Details:", error);
                }

            } catch (error) {
                console.error("Error deleting Purchase Order Pricing Details Child:", error);
            }

        }
        initialGridData()
    } catch (error) {
        showToast("Error deleting rows", "error");
    }
}

onMounted(() => {
    fetchDetails()
    initialGridData()
});

</script>

<template>
    <div>
        <dx-form :form-data="formData" class="form-container" :col-count="4" :label-mode="'static'">
            <!-- <dx-form-group-item :col-count="4"> -->
            <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

            <!-- Account -->
            <dx-item :col-span="1">
                <label class="form-label">Account</label>
                <dx-text-box v-model="formData.account" class="p-2 border rounded-md" :disabled="true"
                    styling-mode="outlined" />
            </dx-item>

            <!-- Locations -->
            <dx-item :col-span="1">
                <label class="form-label">Locations</label>
                <dx-tag-box :value="locationsOptions" v-model="formData.locations" class="p-2 border rounded-md"
                    :hide-selected-items="true" :disabled="true" styling-mode="outlined" />
            </dx-item>

            <!-- Sales -->
            <dx-item :col-span="1">
                <label class="form-label">Sales</label>
                <dx-text-box v-model="formData.sales" class="p-2 border rounded-md" :disabled="true"
                    styling-mode="outlined" />
            </dx-item>

            <!-- CSR -->
            <dx-item :col-span="1">
                <label class="form-label">CSR</label>
                <dx-text-box v-model="formData.csr" class="p-2 border rounded-md" :disabled="true"
                    styling-mode="outlined" />
            </dx-item>
            <!-- </dx-form-group-item>
            <dx-form-group-item :col-count="4">
                <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" /> -->
            <!-- PO Tags -->
            <!-- <dx-item :col-span="1">
                    <label class="form-label">PO Tags</label>
                    <dx-text-box v-model="formData.po_tags" class="p-2 border rounded-md" :disabled="true"
                         styling-mode="outlined" />
                </dx-item> -->

            <!-- PO Template -->
            <dx-item :col-span="1">
                <label class="form-label">PO Template</label>
                <dx-tag-box :items="poTemplateOptions" v-model="formData.po_template" class="p-2 border rounded-md" placeholder=""
                    :key="formData.po_template.length" :hide-selected-items="true" styling-mode="outlined" />
            </dx-item>

            <dx-item :col-span="1">
                <div class="row header">
                    <div class="row buttons">
                        <dx-button class="additional-btn" text="Get PO Template" type="default" styling-mode="contained"
                            @click="handle_potemplate_popup" />
                        <dx-button class="additional-btn form-btn" text="Get Item" type="default"
                            styling-mode="contained" @click="handle_item_popup" />

                        <PopupGrid :popup-visible.sync="popupVisible" :data-source="popupDataSource"
                            :field-name="fieldName" :purchase_order_id="purchase_order_id" :doctype="doctype"
                            :response-data="responseData" @hiding="handlePopupHiding"
                            @update:popupVisible="popupVisible = $event" @duplicateFound="handleDuplicate"
                            :po_template="selectedpoTemplateID" />
                    </div>
                </div>
            </dx-item>
            <!-- </dx-form-group-item> -->
        </dx-form>

        <div class="form-container">
            <div class="row">
                <h3>Active Items</h3>
                <div class="row buttons">
                    <dx-button class="additional-btn form-btn" text="Remove" type="default" styling-mode="contained"
                        @click="showDeleteConfirmation" />
                </div>
            </div>

            <div class="dx-card details-card" id="card-tasks">
                <gridView :key="gridDataSource" :data-source="gridDataSource" :fields="fieldName"
                    :showPagination="false" @row-click="handleRowClick" :data="responseData"
                    @update:selectedRowKeys="updateSelectedRowKeys" />
            </div>
        </div>

        <DxPopup v-model:visible="confirmPopupVisible" title="Confirm Deletion" width="400px" height="200px"
            :show-title="true">
            <p class="p-4">Are you sure you want to delete the selected row(s)?</p>
            <div class="popup">
                <dx-button class="popup-btn" text="Yes" @click="confirmDeletion" />
                <dx-button class="popup-btn-cancel" text="Cancel" @click="confirmPopupVisible = false" />
            </div>

        </DxPopup>


    </div>
</template>

<style scoped lang="scss">
@use "@/variables" as *;
@use "sass:math";

.row.buttons {
    display: flex;
    justify-content: space-between;
}

.popup {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}

 .popup-btn {
    background-color: #28a0e2;
    padding: 10px 10px;
    color: white;
 }

.popup-btn-cancel {
    background-color: #28a0e2;
    padding: 10px 10px;
    color: white;
    margin-right: 50px;
    margin-top: 20px;
	margin-left: 10px;
}

.row {
    border: none !important;
}

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
</style>
