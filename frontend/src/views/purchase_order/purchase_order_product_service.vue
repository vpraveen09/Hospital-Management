<script setup>
import { ref, onMounted, nextTick, watch, computed, inject } from 'vue';
import { DxColCountByScreen, DxGroupItem as DxFormGroupItem, DxForm, DxItem  } from 'devextreme-vue/form';
import DxDataGrid, { DxColumn, DxEditing, DxToolbar, DxSelection, DxLookup } from 'devextreme-vue/data-grid';
import { call, createResource } from "frappe-ui";
import DxButton from 'devextreme-vue/button';
import DxNumberBox from 'devextreme-vue/number-box';
import DxSelectBox from 'devextreme-vue/select-box';
import DxCheckBox from 'devextreme-vue/check-box';
import DxTagBox from "devextreme-vue/tag-box";
import DxTextBox from 'devextreme-vue/text-box';

const props = defineProps({
    purchase_order_details_id: {
        type: String,
    },
    itemName: {
        type: String,
    }
});

const emit = defineEmits(['back', 'back_to_pricing']);

const showToast = inject('showToast');

const gridData = ref([]);
const secureOptions = ref([]);
const serviceOptionsMap = ref({});
const dataGridServiceRef = ref(null);
const selectedRowsSupplies = ref([]);
const hasExistingProductService = ref(false);
const uomOptions = ref([]);
const displayedPrice = ref('');
const isServiceAvailable = ref(false)
const productOptionMap = ref([]);

const formData = ref({
    all_inclusive: false,
    all_inclusive_price: '',
    secure: false,
    secure_price: '',
    secure_uom: '',
    product_service: []
});

const handleBackClick = () => {
    emit('back');
};

const handleBackPricingClick = () => {
    emit('back_to_pricing');
};

const totalPrice = computed(() => {
    return gridData.value.reduce((total, row) => {
        return total + (row.price || 0);
    }, 0);
});

const saveChanges = (dataGridRef) => {
    formData.value.all_inclusive_price = totalPrice.value;
    dataGridRef.value?.instance.saveEditData();

    const invalidRows = gridData.value.filter(row =>
        row.selected_items.length === 0 ||  // Check if selected_items is empty
        !row.price ||  // Check if price is empty or 0
        !row.uom       // Check if uom is empty
    );

    if (invalidRows.length > 0) {
        showToast("Please select items, enter price, and choose UOM before saving", "warning");
        return;
    }

    handleSaveClick()

};
// const addRowAttributes = () => addRow(dataGridAttributesRef);
// const addRow = (dataGridRef) => dataGridRef.value?.instance.addRow();

const saveChangesServices = () => saveChanges(dataGridServiceRef);

// const removeRowServices = () => {
//     if (!dataGridServiceRef.value?.instance || selectedRowsSupplies.value.length === 0) return;
//     gridData.value = gridData.value.filter(row => !selectedRowsSupplies.value.includes(row));
//     selectedRowsSupplies.value = [];
//     nextTick(() => dataGridServiceRef.value?.instance.refresh());
// };

const addRowService = () => addRow(dataGridServiceRef);
const addRow = (dataGridRef) => dataGridRef.value?.instance.addRow();

const removeRowAttributes = () => {
    if (!dataGridServiceRef.value?.instance || selectedRowsSupplies.value.length === 0) return;

    gridData.value = gridData.value.filter(row => !selectedRowsSupplies.value.includes(row));
    selectedRowsSupplies.value = [];

    nextTick(() => dataGridServiceRef.value?.instance.refresh());
};

const getFilteredOptions = (selectedProduct) => {
    return serviceOptionsMap.value[selectedProduct] || [];
};

const cellTemplate = (container, options) => {
    const noBreakSpace = '\u00A0';
    const selectedNames = options.value || [];
    const text = selectedNames.join(', ');

    container.textContent = text || noBreakSpace;
    container.title = text;
};

const handleSaveClick = async () => {
    if (gridData.value.length === 0) {
        showToast("Please enter Service details", "warning");
        return;
    }

    try {

        console.log("gridData.value: ", gridData.value);

        for (const row of gridData.value) {
            if (row.id) {

                let selectedItems = serviceOptionsMap.value[row.product_service_name] || [];
                let selectedItemNames = selectedItems
                    .filter(item => row.selected_items.includes(item.selected_items))
                    .map(item => ({
                        // name: item.selected_item_name,
                        selected_items: item.selected_items
                    }));

                const formDataCopy = { ...row };

                formDataCopy.selected_items = selectedItemNames

                const updateResource = createResource({
                    url: 'frappe.client.set_value',
                    params: {
                        doctype: 'Purchase Order Product Service Link',
                        name: row.id,
                        fieldname: formDataCopy
                    },
                    // auto: true,
                    onSuccess: (response) => {
                        showToast("Product Service Modified Successfully", "success");
                        // emit('back');
                    },
                    onError: (error) => {
                        showToast("Failed to update Product Service Successfully", "error");
                    }
                })

                await updateResource.fetch();

            } else {
                const insertResponse = await call("frappe.client.insert", {
                    doc: {
                        doctype: "Purchase Order Product Service Link",
                        product_service_name: row.product_service_name,
                        price: row.price,
                        uom: row.uom
                    }
                });

                const createdName = insertResponse.name;
                let childRecords = row.selected_items.map(item => ({
                    doctype: "Purchase Order Product Service Items",
                    parent: createdName,
                    parenttype: "Purchase Order Product Service Link",
                    parentfield: "selected_items",
                    selected_items: item
                }));

                if (childRecords.length > 0) {
                    try {
                        await call("frappe.client.insert_many", { docs: childRecords });
                        showToast("Product Service Created Successfully", "success");
                    } catch (error) {
                        console.error("Error inserting child records:", error);
                        showToast("Failed to add selected items", "error");
                    }
                }

                const insertProdcutServiceResponse = await call("frappe.client.insert", {
                    doc: {
                        doctype: "Purchase Order Pricing Product Service",
                        parent: props.purchase_order_details_id,
                        parenttype: "Purchase Order Pricing Details",
                        parentfield: "product_service",
                        product_service: createdName
                    }
                });
            }
        }

        const updateResource = createResource({
            url: 'frappe.client.set_value',
            params: {
                doctype: 'Purchase Order Pricing Details',
                name: props.purchase_order_details_id,
                fieldname: {
                    all_inclusive_price: formData.value.all_inclusive_price,
                    secure_price: formData.value.secure_price,
                }
            },
            // auto: true,
            onSuccess: (response) => {
                // showToast("Product Service Created Successfully", "success");
                // emit('back');
            },
            onError: (error) => {
                showToast("Failed to update Product Service Successfully", "error");
            }
        })

        await updateResource.fetch();

        // showToast("Product Service Created successfully", "success");
        emit('back');
    } catch (error) {
        console.error("Error inserting data:", error);
        showToast("Failed to save Product Service Link", "error");
    }
};

const fetchGridData = async () => {
    try {
        const uomResponse = await createResource({
            url: "frappe.client.get_list",
            params: {
                doctype: "UOM",
                fields: JSON.stringify(["name", "uom_name"]),
            },
        }).fetch();

        uomOptions.value = uomResponse;

        const response = await createResource({
            url: "axe_product.api.doc.get_data",
            params: {
                doctype: "Purchase Order Pricing Details",
                name: props.purchase_order_details_id,
            },
        }).fetch();

        formData.value.secure_price = response.message.data.secure_price;
        hasExistingProductService.value = response.message.data.product_service.length !== 0;

        let extractedData = [];

        if (hasExistingProductService.value) {
            let serviceResponse = response.message.data.product_service;

            const templateDetailsResponses = await Promise.all(
                serviceResponse.map(serviceName =>
                    createResource({
                        url: "axe_product.api.doc.get_data",
                        params: {
                            doctype: "Purchase Order Product Service Link",
                            name: serviceName.product_service,
                        },
                    }).fetch()
                )
            );

            serviceOptionsMap.value = {};

            extractedData = templateDetailsResponses.map(response => {
                const data = response?.message?.data;
                const productServiceName = data?.product_service_name;

                const selectedItems = data?.selected_items?.map(item => ({
                    selected_item_name: item.name,
                    selected_items: item.selected_items
                })) || [];

                if (!serviceOptionsMap.value[productServiceName]) {
                    serviceOptionsMap.value[productServiceName] = [];
                }

                serviceOptionsMap.value[productServiceName] = selectedItems.map(item => ({
                    selected_item_name: item.selected_item_name,
                    selected_items: item.selected_items
                }));

                isServiceAvailable.value = true

                return {
                    id: data.name,
                    product_service_name: productServiceName,
                    selected_items: selectedItems.map(item => item.selected_items),
                    price: data.price,
                    uom: data.uom
                };
            });
        }

        // Fetch all available product service options
        const attributeResponse = await call('axe_product.api.purchase_order.get_pricing_attribute_data', {
            doctype: 'Purchase Order Product Service',
        });

        serviceOptionsMap.value = {};

        if (attributeResponse.message.data) {
            attributeResponse.message.data.forEach((item) => {
                const key = item.product_service_name;

                if (!serviceOptionsMap.value[key]) {
                    serviceOptionsMap.value[key] = [];
                }

                serviceOptionsMap.value[key].push({
                    selected_item_name: item.selected_item_name,
                    selected_items: item.selected_items
                });
            });

            // Ensure productOptionMap is always populated with all available options
            productOptionMap.value = Object.keys(serviceOptionsMap.value);
        }

        addDefaultRows(extractedData);

    } catch (error) {
        console.error("Error fetching grid data:", error);
        showToast("Failed to fetch purchase order attributes", "error");
    }
};

const addDefaultRows = (extractedData = []) => {
    // console.log("Existing extractedData: ", extractedData);
    // console.log("All product options: ", productOptionMap.value);

    if (extractedData.length !== 0) {
        // Bind only the extracted data (existing services)
        gridData.value = extractedData;
    } else {
        // Default case when no existing data is present
        gridData.value = productOptionMap.value.map(name => ({
            product_service_name: name,
            selected_items: [],
            uom: '',
            price: 0
        }));
    }

    console.log("Final gridData: ", gridData.value);
};

watch(() => formData.value.all_inclusive, (newVal) => {
    if (newVal) {
        displayedPrice.value = totalPrice.value;
    } else {
        displayedPrice.value = '';
    }
});

watch(totalPrice, (newTotal) => {
    if (formData.all_inclusive) {
        displayedPrice.value = newTotal;
    }
});

onMounted(async () => {
    await fetchGridData();
});

</script>

<template>
    <div>
        <div class="row header">
            <span class="tab_breadcrumbs">
                <span class="clickable-pricing" @click="handleBackPricingClick">Pricing</span><span
                    class="breadcrumb-separator">></span>
                <span class="clickable-pricing" @click="handleBackClick">{{ props.itemName }}</span><span
                    class="breadcrumb-separator">></span>
                <span style="color: #7c7c7c !important;">Product Service</span>
            </span>
            <div class="row buttons">
                <dx-button class="additional-btn form-btn" text="Save" type="default" styling-mode="contained"
                    @click="saveChangesServices" />
            </div>
        </div>

        <dx-form :form-data="formData" class="form-container" :label-mode="'static'">

            <dx-item>
                <dx-data-grid :dataSource="gridData" ref="dataGridServiceRef" :show-borders="true"
                    :repaint-changes-only="true" :key-expr="'product_service_name'" :show-column-lines="true"
                    @selection-changed="(e) => selectedRowsSupplies = e.selectedRowsData">
                    <dx-editing mode="batch" :allowUpdating="true" :allowDeleting="false" />
                    <dx-selection :mode="'multiple'" :show-checkboxes-mode="'always'" />


                    <dx-column data-field="product_service_name" caption="Product Service Name">
                        <!-- <dx-text-box :value="data.value" :disabled="true" /> -->
                        <dx-lookup :data-source="productOptionMap" :search-enabled="true" :show-clear-button="true" />
                    </dx-column>

                    <!-- <dx-column data-field="product_service_name" caption="Product Service Name">
                        <dx-lookup :data-source="productOptionMap" display-expr="name" value-expr="name"
                            :search-enabled="true" />
                    </dx-column> -->


                    <dx-column data-field="selected_items" caption="Selected Items" :cell-template="cellTemplate"
                        edit-cell-template="tagBoxEditor">
                        <dxLookup :data-source="getFilteredOptions" :multiselect-enabled="true" />
                    </dx-column>

                    <template #tagBoxEditor="{ data: cellInfo }">
                        <dx-tag-box v-model="cellInfo.value"
                            :data-source="getFilteredOptions(cellInfo.row.data.product_service_name)"
                            value-expr="selected_items" display-expr="selected_items" :search-enabled="true"
                            :show-selection-controls="true" :apply-value-mode="'useButtons'"
                            :show-drop-down-button="true" @value-changed="(e) => {
                                // console.log('Selected Items:', e.value);
                                cellInfo.setValue(e.value);
                            }" />
                    </template>

                    <dx-column data-field="uom" caption="UOM">
                        <dx-lookup :data-source="uomOptions" display-expr="name" value-expr="name" />
                    </dx-column>

                    <dx-column data-field="price" caption="Price($)" format="$ #,##0.##" data-type="number" />

                    <dx-toolbar>
                        <DxItem>
                            <DxButton class="additional-btn" text="Remove" type="default" styling-mode="contained"
                                @click="removeRowAttributes" />
                        </DxItem>

                        <!-- <dx-item class="hide-btn" location="after">
                            <dx-button class="additional-btn" text="Row Save" type="default" styling-mode="contained"
                                @click="saveChangesServices" />
                        </dx-item> -->

                        <DxItem location="after">
                            <DxButton class="additional-btn" icon="plus" text="New" type="default"
                                styling-mode="contained" @click="addRowService" />
                        </DxItem>

                    </dx-toolbar>
                </dx-data-grid>
            </dx-item>

            <dx-form-group-item :col-count="4">
                <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

                <dx-item>
                    <div class="custom-check-box">
                        <label class="custom-left">All Inclusive</label>
                        <dx-check-box @value-changed="formData.all_inclusive = $event.value"
                            v-model="formData.all_inclusive" class="p-2 border rounded-md" />
                    </div>
                </dx-item>

                <dx-item>
                    <label class="form-label">Price</label>
                    <DxNumberBox format="$ #,##0.##" :input-attr="{ 'aria-label': 'Currency Format' }" :min="0"
                        v-model="displayedPrice" :disabled="true" />
                </dx-item>
            </dx-form-group-item>


            <dx-form-group-item :col-count="4">
                <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />
                <dx-item>
                    <div class="custom-check-box">
                        <label class="custom-left">Secure</label>
                        <dx-check-box :items="secureOptions" @value-changed="formData.secure = $event.value"
                            :value="formData.secure" class="p-2 border rounded-md" />
                    </div>
                </dx-item>

                <dx-item>
                    <label class="form-label">Price</label>
                    <DxNumberBox :disabled="!formData.secure" format="$ #,##0.##"
                        :input-attr="{ 'aria-label': 'Currency Format' }" :min="0" v-model="formData.secure_price" />
                </dx-item>
            </dx-form-group-item>


        </dx-form>
    </div>
</template>

<style scoped lang="scss">
.breadcrumb-separator {
    font-size: medium;
    margin: 0 8px;
}

.header {
    // margin-left: 10px;
    border-bottom: 1px solid var(--base-row-hover-bgcolor) !important;
}

.buttons {
    margin-right: 18px;
}

.button-container {
    display: flex;
    justify-content: flex-end;
    width: 100%;
    padding-right: 10px;
    margin-bottom: 10px;
}
.additional-btn {
  margin-left: 10px;
}
</style>
