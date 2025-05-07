<script setup>
import DxButton from 'devextreme-vue/button';
import DxDataGrid, { DxColumn, DxEditing, DxLookup, DxScrolling, DxSelection, DxToolbar } from 'devextreme-vue/data-grid';
import DxDropDownBox from 'devextreme-vue/drop-down-box';
import { DxColCountByScreen, DxForm, DxGroupItem as DxFormGroupItem, DxItem } from 'devextreme-vue/form';
import DxNumberBox from 'devextreme-vue/number-box';
import DxTextBox from 'devextreme-vue/text-box';
import { call, createResource } from "frappe-ui";
import { defineProps, inject, nextTick, onMounted, ref } from 'vue';
import CustomStore from 'devextreme/data/custom_store';
import DxTagBox from "devextreme-vue/tag-box";

import DropDownBoxComponent from '@/components/drop-down-box-component.vue';
import tagBoxComponet from '@/components/tag-box-componet.vue';

const props = defineProps({
    purchase_order_details_id: {
        type: String,
    },
    purchase_order_attribute_details_id: {
        type: String,
    },
    itemName: {
        type: String,
    },
    itemID: {
        type: String,
    }
});

const showToast = inject('showToast');

const emit = defineEmits(['back', 'back_to_pricing']);

const gridData = ref([]);
const dataGridAttributesRef = ref(null);
const selectedRowsAttributes = ref([]);
const isValidationTriggered = ref(false);
const productOptions = ref([]);

let itemID = props.itemID
let productAttributesData = ref({});

const conditionOptions = ref([
    { label: '=', value: '=' },
    { label: '<', value: '<' },
    { label: '>', value: '>' },
    { label: '<=', value: '<=' },
    { label: '>=', value: '>=' },
]);

// Form data
const formData = ref({
    description: '',
    price: null,
    quantity: null,
    resale_attributes: []
});

const handleBackClick = () => {
    emit('back');
};

const handleBackPricingClick = () => {
    emit('back_to_pricing');
};


const validateForm = () => {
    isValidationTriggered.value = true; // Activate red border effect

    const requiredFields = [
        { key: "description", label: "Description" },
        { key: "price", label: "Price" },
        { key: "quantity", label: "Quantity" },
    ];

    const missingFields = requiredFields
        .filter(field =>
            formData.value[field.key] === undefined ||
            formData.value[field.key] === null ||
            formData.value[field.key] === "" ||
            (Array.isArray(formData.value[field.key]) && formData.value[field.key].length === 0)
        )
        .map(field => field.label);


    if (missingFields.length > 0) {
        showToast(`Please enter mandatory fields`, "error");
        return false;
    }

    return true;
};

const fetchGridData = async () => {
    try {
        if (props.purchase_order_attribute_details_id) {

            const pricingDetailsResponse = await createResource({
                url: "axe_product.api.doc.get_data",
                params: {
                    doctype: "Purchase Order Resale Details",
                    name: props.purchase_order_attribute_details_id
                },
            }).fetch();

            let pricingAttributeDetails = pricingDetailsResponse.message.data

            formData.value = {
                description: pricingAttributeDetails.description || "",
                price: pricingAttributeDetails.price || 0,
                quantity: pricingAttributeDetails.quantity || 0
            };

            console.log("pricingAttributeDetails:",pricingAttributeDetails);

            let formattedData = pricingAttributeDetails.attribute_specification.map(pricingAttributeDetails => ({
                condition: pricingAttributeDetails.condition || "",
                attribute_name: pricingAttributeDetails.attribute_name || 0,
                specification: pricingAttributeDetails.specification.map(spec => spec.specification) || "" // Extract specification values
            }));

            gridData.value = formattedData;
        }

    } catch (error) {
        console.error("Error fetching grid data:", error);
        showToast("Failed to fetch purchase order attributes", "error");
    }
};


const addRow = (dataGridRef) => dataGridRef.value?.instance.addRow();

const saveChanges = (dataGridRef) => {
    dataGridRef.value?.instance.saveEditData();

    const invalidRows = gridData.value.filter(row =>
        row.attribute_name.length === 0 ||
        !row.condition ||
        !row.specification
    );

    if (invalidRows.length > 0) {
        showToast("Please select row values before saving", "warning");
        return;
    }

    handleSaveClick()

};

const addRowAttributes = () => addRow(dataGridAttributesRef);
const saveChangesAttributes = () => saveChanges(dataGridAttributesRef);

const removeRowAttributes = () => {
    if (!dataGridAttributesRef.value?.instance || selectedRowsAttributes.value.length === 0) return;

    gridData.value = gridData.value.filter(row => !selectedRowsAttributes.value.includes(row));

    selectedRowsAttributes.value = [];

    nextTick(() => dataGridAttributesRef.value?.instance.refresh());
};

let allFormattedAttributes = []

const fetchProductDetails = async () => {

    const productResponse = await createResource({
        url: "axe_product.api.doc.get_data",
        params: {
            doctype: "Product Master",
            name: itemID,
        }
    }).fetch();

    let productNestedAttribute = productResponse.message.data.product_child_attribute;

    let formattedNestedAttributes = Object.entries(productNestedAttribute).flatMap(([productName, attributes]) =>
        attributes
            .map(attr => ({
                attribute_names: attr.name1,
                product_name: productName,
                name: attr.attribute_options,
                displayText: `${productName} - ${attr.name1}`
            }))
    );

    let responseProductAttributes = productResponse.message.data.product_attributes;
    let productName = productResponse.message.data.name1;

    let formattedAttributes = responseProductAttributes
        .map(attr => ({
            attribute_names: attr.name1,
            product_name: productName,
            name: attr.attribute_options,
            displayText: `${productName} - ${attr.name1}`
        }));

    // Merge both arrays into one
    allFormattedAttributes = [...formattedNestedAttributes, ...formattedAttributes];

    productOptions.value = responseProductAttributes?.map(attr => ({
        label: attr.name1,
        value: attr.name1,
    })) || [];

    for (const option of allFormattedAttributes) {
        const attributeResponse = await createResource({
            url: "axe_product.api.doc.get_data",
            params: {
                doctype: "Product Attribute Options Master",
                name: option.name,
            }
        }).fetch();

        let attributeOptions = attributeResponse.message.data.attribute_options
            .filter(attr => attr.required === "Yes")
            .map(attr => ({
                specification: attr.attribute_name
            }));

        productAttributesData.value[option.attribute_names] = attributeOptions;
    }

};

const dataSource = new CustomStore({
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
            doctype: "Product Master",
            filters: JSON.stringify(filter),
            limit_start: skip || 0,
            limit_page_length: take || 10,
            order_by: orderBy,
            name: itemID,
        };

        const resource = createResource({
            url: 'axe_product.api.doc.get_data',
            method: 'GET',
            params,
        });

        try {
            const productResponse = await resource.fetch();
            const data = productResponse.message.data || [];

            let allFormattedAttributes = [];

            let productNestedAttribute = productResponse.message.data.product_child_attribute;

            let formattedNestedAttributes = Object.entries(productNestedAttribute).flatMap(([productName, attributes]) =>
                attributes
                    .map(attr => ({
                        attribute_names: attr.name1,
                        product_name: productName,
                        name: attr.attribute_options,
                        displayText: `${productName} - ${attr.name1}`
                    }))
            );

            let responseProductAttributes = productResponse.message.data.product_attributes;
            let productName = productResponse.message.data.name1;

            let formattedAttributes = responseProductAttributes
                .map(attr => ({
                    attribute_names: attr.name1,
                    product_name: productName,
                    name: attr.attribute_options,
                    displayText: `${productName} - ${attr.name1}`
                }));

            allFormattedAttributes = [...formattedNestedAttributes, ...formattedAttributes];

            return {
                data: allFormattedAttributes,
                totalCount: allFormattedAttributes.length,
            };
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    },
    byKey: async (key) => {
        return null;
    },
});

const specificationDataSource = (attribute_name) => new CustomStore({
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
            doctype: "Product Attribute Options",
            filters: JSON.stringify(filter),
            limit_start: skip || 0,
            limit_page_length: take || 10,
            order_by: orderBy,
            name: attribute_name,
        };

        const resource = createResource({
            url: 'axe_product.api.doc.get_data',
            method: 'GET',
            params,
        });

        try {
            const productResponse = await resource.fetch();

            console.log("productResponse: ", productResponse);
            

            let attributeOptions = productResponse.message.data.attribute_options
                .filter(attr => attr.required === "Yes")
                .map(attr => ({
                    specification: attr.attribute_name
                }));

            return {
                data: attributeOptions, // This is now the main data being returned
                totalCount: attributeOptions.length, // Count based on attributes
            };
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    },
    byKey: async (key) => {
        return null; // Optional implementation
    },
});


const handleSaveClick = async () => {

    if (!validateForm()) {
        return;
    }

    // if (gridData.value.length === 0) {
    //     showToast("Please enter attribute details or Save the grid", "warning");
    //     return;
    // }

    if (props.purchase_order_attribute_details_id) {
        formData.value.resale_attributes = gridData.value;
        const insertData = { ...formData.value };

        const updateResource = createResource({
            url: 'frappe.client.set_value',
            params: {
                doctype: 'Purchase Order Resale Details',
                name: props.purchase_order_attribute_details_id,
                fieldname: insertData
            },
            // auto: true,
            onSuccess: (response) => {

                showToast("Purchase Order Updated Successfully", "success");
                emit('back');
            },
            onError: (error) => {
                console.error("Update Failed:", error);
                showToast("Failed to update employee", "error");
            }
        })

        await updateResource.fetch();

    } else {
        try {
            let productAttribute = gridData.value;
            const resaleDetailsData = { ...formData.value };

            const createResaleDetails = await call("frappe.client.insert", {
                doc: {
                    doctype: "Purchase Order Resale Details",
                    ...resaleDetailsData
                },
            });

            const resaleId = createResaleDetails?.name;
            console.log(`Inserted Resale Details with ID: ${resaleId}`);

            for (const attr of productAttribute) {
                const response = await call("frappe.client.insert", {
                    doc: {
                        doctype: "Purchase Order Resale Attributes",
                        attribute_name: attr.attribute_name,
                        condition: attr.condition
                    }
                });

                const attributeId = response?.name;
                console.log(`Inserted Attribute: ${attr.attribute_name} with ID: ${attributeId}`);

                for (const spec of attr.specification) {
                    await call("frappe.client.insert", {
                        doc: {
                            doctype: "Purchase Order Product Specification",
                            parent: attributeId,
                            parenttype: "Purchase Order Resale Attributes",
                            parentfield: "specification",
                            specification: spec
                        }
                    });
                    console.log(`Inserted Specification: ${spec} for Attribute ID: ${attributeId}`);
                }

                await call("frappe.client.insert", {
                    doc: {
                        doctype: "Purchase Order Resale Attributes Link",
                        parent: resaleId,
                        parenttype: "Purchase Order Resale Details",
                        parentfield: "resale_attributes",
                        resale_attributes: attributeId
                    }
                });
                console.log(`Linked Attribute ID: ${attributeId} to Resale ID: ${resaleId}`);
            }

            const childRecord = {
                doctype: "Purchase Order Resale Details Child",
                parent: props.purchase_order_details_id,
                parenttype: "Purchase Order Pricing Details",
                parentfield: "resale_pricing_template",
                resale_pricing_template: resaleId
            };

            await call("frappe.client.insert", { doc: childRecord });

            showToast("Purchase Order Resale Details saved successfully", "success");

        } catch (error) {
            console.error("Error saving Purchase Order Resale Details:", error);
            showToast("Failed to save Purchase Order Resale Details", "error");
        }

    }
};

const getSpecificationOptions = (rowData) => {
    console.log("rowData.data?.attribute_name:", rowData.data?.attribute_name);
    console.log("productAttributesData.value: ", productAttributesData.value);


    console.log("productAttributesData.value[rowData.data?.attribute_name]:", productAttributesData.value[rowData.data?.attribute_name]);

    return productAttributesData.value[rowData.data?.attribute_name] || [];
};

const getSpecification = async (selectedProduct) => {
    const attributeResponse = await createResource({
        url: "axe_product.api.doc.get_data",
        params: {
            doctype: "Product Attribute Options Master",
            name: selectedProduct,
        }
    }).fetch();
    console.log("attributeResponseattributeResponse: ", attributeResponse.message.data);

    let attributeOptions = attributeResponse.message.data.attribute_options
        .filter(attr => attr.required === "Yes")
        .map(attr => ({
            specification: attr.attribute_name
        }));

    productAttributesData.value[selectedProduct] = attributeOptions;
}

const getFilteredOptions = async (selectedProduct) => {
    if (!selectedProduct) {
        return
    }
    console.log("selectedProduct: ", selectedProduct);
    // await getSpecification(selectedProduct)
    console.log("productAttributesData.value[selectedProduct]: ", productAttributesData.value[selectedProduct]);



    return productAttributesData.value[selectedProduct] || [];
};

const onRowInserted = (e) => {
    e.component.navigateToRow(e.key);
};

onMounted(() => {
    fetchGridData();
    // fetchProductDetails()
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
                <span style="color: #7c7c7c !important;">Product Attributes</span>
            </span>
            <div class="row buttons">
                <dx-button class="additional-btn form-btn" text="Save" type="default" styling-mode="contained"
                    @click="saveChangesAttributes" />
            </div>
        </div>

        <dx-form :form-data="formData" class="form-container" :label-mode="'static'">
            <dx-form-group-item :col-count="4">
                <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />
                <dx-item :col-span="1">
                    <label class="form-label">Description<span class="required">*</span></label>
                    <dx-text-box v-model="formData.description" class="p-2 border rounded-md"
                        :class="{ 'border-red': !formData.description && isValidationTriggered }"
                        styling-mode="outlined" />
                </dx-item>

                <dx-item :col-span="1">
                    <label class="form-label">Price<span class="required">*</span></label>
                    <DxNumberBox format="$ #,##0.##" :input-attr="{ 'aria-label': 'Currency Format' }" :min="0"
                        :class="{ 'border-red': !formData.price && isValidationTriggered }" v-model="formData.price"
                        class="p-2 border rounded-md" styling-mode="outlined" />
                </dx-item>

                <dx-item :col-span="1">
                    <label class="form-label">Quantity</label>
                    <DxNumberBox format="#" v-model="formData.quantity" :min="0" class="p-2 border rounded-md"
                        styling-mode="outlined"
                        :class="{ 'border-red': !formData.quantity && isValidationTriggered }" />
                </dx-item>
            </dx-form-group-item>

            <dx-item>
                <dx-data-grid :dataSource="gridData" ref="dataGridAttributesRef" :show-borders="true"
                    :show-column-lines="true" @row-inserted="onRowInserted"
                    v-model:selected-row-keys="selectedRowsAttributes">

                    <dx-editing mode="batch" :allowAdding="true" :allowUpdating="true"
                        :allowDeleting="false"></dx-editing>

                    <dx-selection :mode="'multiple'" :show-checkboxes-mode="'always'" />

                    <DxColumn :allow-sorting="false" data-field="attribute_name" caption="Attribute Name"
                        edit-cell-template="dropDownBoxEditor">
                        <DxLookup :data-source="dataSource" display-expr="displayText" value-expr="name" />
                    </DxColumn>


                    <dx-column dataField="condition" caption="Condition">
                        <DxLookup :data-source="conditionOptions" display-expr="label" value-expr="value" />
                    </dx-column>

                    <DxColumn :allow-sorting="false" data-field="specification" caption="Specification"
                        edit-cell-template="tagBoxEditor">
                        <DxLookup />
                    </DxColumn>

                    <DxToolbar>
                        <DxItem>
                            <DxButton class="additional-btn" text="Remove" type="default" styling-mode="contained"
                                @click="removeRowAttributes" />
                        </DxItem>
                        <DxItem location="after">
                            <DxButton class="additional-btn" icon="plus" text="New" type="default"
                                styling-mode="contained" @click="addRowAttributes" />
                        </DxItem>
                    </DxToolbar>

                    <template #dropDownBoxEditor="{ data: cellInfo }">
                        <DropDownBoxComponent :value="cellInfo.value" :on-value-changed="cellInfo.setValue"
                            :data-source="dataSource" />
                    </template>

                    <template #tagBoxEditor="{ data: cellInfo }">
                        <tagBoxComponet :cell-info="cellInfo"
                            :data-source="specificationDataSource(cellInfo.data.attribute_name)"
                            :data-grid-component="cellInfo.component" />
                    </template>

                </dx-data-grid>
            </dx-item>
        </dx-form>
    </div>
</template>

<style scoped lang="scss">
.breadcrumb-separator {
    font-size: medium;
    margin: 0 8px;
}

.header {
    margin-left: 10px;
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
