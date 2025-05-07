<script setup>
import { defineExpose, defineProps, inject, reactive } from 'vue';
import { DxButton } from 'devextreme-vue/button';
import { DxColCountByScreen, DxForm, DxItem, } from 'devextreme-vue/form';
import { createResource } from "frappe-ui";
import DxDataGrid from 'devextreme-vue/data-grid';

const props = defineProps({
    tab_purchase_order_id: {
        type: String,
        required: true
    },
});

const showToast = inject('showToast');
let purchase_order_id = props.tab_purchase_order_id;


const fields = reactive([
    { fieldname: "account", fieldtype: "Button", buttonText: "Select a file", label: "Account", options: [], value: [], required: true, invalid: false },
]);

const formData = reactive(
    fields.reduce((acc, field) => {
        acc[field.fieldname] = field.default;
        return acc;
    }, {})
);

const updatePurchaseOrderDocuments = async () => {
    try {
        const updateResource = createResource({
            url: 'frappe.client.set_value',
            params: {
                doctype: 'Purchase Order',
                name: purchase_order_id,
                fieldname: {
                    status: 'Active'
                }
            },
            // auto: true,
            onSuccess: (response) => {
                showToast("Purchase Order Updated Successfully", "success");
            },
            onError: (error) => {
                showToast("Failed to update employee", "error");
            }
        })
        await updateResource.fetch();
    } catch (error) {
        showToast("Failed to save Purchase Order Resale Details", "error");
    }
}

defineExpose({
    updatePurchaseOrderDocuments
});

</script>

<template>
    <dx-form :form-data="formData" :col-count=4 class="form-container" :label-mode="'static'">
        <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />
        <dx-item :col-span="1">
            <dx-button class="additional-btn form-btn" text="Select a File" type="default" styling-mode="contained" />
        </dx-item>
        <dx-item :col-span="3">
            <div></div>
        </dx-item>

        <dx-item :col-span="4">
            <div class="dx-card details-card" id="card-tasks">
                <dx-data-grid :dataSource="null" :show-borders="true" />
            </div>
        </dx-item>
    </dx-form>
</template>


<style scoped lang="scss">
@use "@/variables" as *;
@use "sass:math";

@media only screen and (max-width: 875px) {
    :deep(.contact-name-toolbar-item) {
        min-width: calc(var(--left-panel-width) + var(--right-panel-width) - 145px);
    }
}
</style>
