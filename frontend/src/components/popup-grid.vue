<script setup>
import { ref, onMounted, onUnmounted, inject } from 'vue';
import { DxButton } from 'devextreme-vue/button';
import { call, createResource } from "frappe-ui";
import DxPopup from "devextreme-vue/popup";

import gridView from './grid-view.vue';

const selectedrowkeys = ref([]);
const showToast = inject('showToast');

const props = defineProps({
    purchase_order_id: {
        type: String,
    },
    popupVisible: {
        type: Boolean,
        required: true,
    },
    dataSource: {
        type: [Array, Object],
        required: true,
    },
    fieldName: {
        type: [Array, Object],
        required: true,
    },
    doctype: {
        type: String,
        required: true,
    },
    responseData: {
        type: Object,
        required: true,
    },
    po_template: {
        type: [Array, Object],
    }
});

const emit = defineEmits(['update:popupVisible', 'duplicateFound']);

const popupWidth = ref(getPopupWidth());
const popupHeight = ref(getPopupHeight());

function getPopupWidth() {
    if (window.innerWidth > 1200) return '60%'; // Large screens
    if (window.innerWidth > 768) return '75%'; // Tablets
    return '90%'; // Mobile
}

function getPopupHeight() {
    return window.innerHeight > 768 ? 650 : '80%';
}

const updatePopupSize = () => {
    popupWidth.value = getPopupWidth();
    popupHeight.value = getPopupHeight();
};

const handleAddClick = async () => {
    if (!selectedrowkeys.value.length) {
        console.warn("No rows selected.");
        showToast("No rows selected.", "warning");
        return;
    }

    if (props.doctype === 'Product Master') {
        try {
            const responses = await Promise.all(
                selectedrowkeys.value.map(async (name) => {
                    return createResource({
                        url: "axe_product.api.doc.get_data",
                        params: {
                            doctype: "Product Master",
                            name: name,
                        },
                    }).fetch();
                })
            );

            const existingItemsResponse = await createResource({
                url: "axe_product.api.purchase_order.get_order_details_grid_data",
                params: {
                    doctype: "Purchase Order Pricing Details",
                    purchaseOrderName: props.purchase_order_id,
                    filters: "[]",
                    limit_start: 0,
                    limit_page_length: 100,
                    order_by: "name asc",
                },
            }).fetch();

            let existingItems = existingItemsResponse.message.data.map(item => item.stocked_as_name);

            for (const [index, response] of responses.entries()) {
                let responseData = response.message.data;

                if (existingItems.includes(responseData.name)) {
                    emit('duplicateFound', responseData.name1);
                    return
                }

                try {
                    const insertResponse = await call("frappe.client.insert", {
                        doc: {
                            doctype: "Purchase Order Pricing Details",
                            stocked_as: responseData.name,
                        },
                    });

                    if (insertResponse) {
                        let createdID = insertResponse.name;

                        const childRecords = {
                            doctype: "Purchase Order Pricing Details Child",
                            parent: props.purchase_order_id,
                            parenttype: "Purchase Order",
                            parentfield: "active_items",
                            purchase_order_pricing_details: createdID,
                        };

                        await call("frappe.client.insert", { doc: childRecords });
                    }

                } catch (insertError) {
                    console.error(`Error inserting Purchase Order for ${selectedrowkeys.value[index]}:`, insertError);
                }
            }
            emit('update:popupVisible', false);
        } catch (error) {
            console.error("Error fetching Item details:", error);
        }
    }

    if (props.doctype === 'PO Template') {
        try {

            const responses = await Promise.all(
                selectedrowkeys.value.map(async (name) => {

                    return createResource({
                        url: "axe_product.api.doc.get_data",
                        params: {
                            doctype: "Purchase Order Template Pricing Details",
                            name: name,
                        },
                    }).fetch();
                })
            );

            const existingItemsResponse = await createResource({
                url: "axe_product.api.purchase_order.get_order_details_grid_data",
                params: {
                    doctype: "Purchase Order Pricing Details",
                    purchaseOrderName: props.purchase_order_id,
                    filters: "[]",
                    limit_start: 0,
                    limit_page_length: 100,
                    order_by: "name asc",
                },
            }).fetch();

            let existingItems = existingItemsResponse.message.data.map(item => item.stocked_as_name);

            for (const [index, response] of responses.entries()) {
                let responseData = response.message.data;

                if (existingItems.includes(responseData.stocked_as)) {
                    emit('duplicateFound', responseData.bought_item_name);
                    return
                }
                try {
                    const insertResponse = await call("frappe.client.insert", {
                        doc: {
                            doctype: "Purchase Order Pricing Details",
                            bought_as: responseData.bought_as,
                            stocked_as: responseData.stocked_as,
                            description: responseData.description,
                            tags: responseData.tags,
                            groups: responseData.groups,
                            scrap_uom: responseData.scrap_uom,
                            scrap_price: responseData.scrap_price,
                            scrap_quantity: responseData.scrap_quantity,
                            scrap_restrict_quantity: responseData.scrap_restrict_quantity,
                            scrap_max_qty: responseData.scrap_max_qty,
                            resale_unit: responseData.resale_unit,
                            resale_parts: responseData.resale_parts,
                            resale_fmv: responseData.resale_fmv,
                            resale_parts_fmv: responseData.resale_parts_fmv,
                            resale_unit_min_fmv: responseData.resale_unit_min_fmv,
                            resale_parts_min_fmv: responseData.resale_parts_min_fmv,
                            resale_qty: responseData.resale_qty,
                            reslae_dsd_resale: responseData.reslae_dsd_resale,
                        },
                    });

                    if (insertResponse) {
                        let createdID = insertResponse.name;

                        const childRecords = {
                            doctype: "Purchase Order Pricing Details Child",
                            parent: props.purchase_order_id,
                            parenttype: "Purchase Order",
                            parentfield: "active_items",
                            purchase_order_pricing_details: createdID,
                        };


                        await call("frappe.client.insert", { doc: childRecords });

                    }
                } catch (insertError) {
                    console.error(`Error inserting Purchase Order for ${selectedrowkeys.value[index]}:`, insertError);
                }
            }

            if (props.po_template.length > 0) {
                try {

                    const existingRecordsResponse = await createResource({
                        url: "axe_product.api.doc.get_data",
                        params: {
                            doctype: "Purchase Order",
                            name: props.purchase_order_id,
                        }
                    }).fetch();

                    let poTemplateResponse = existingRecordsResponse.message.data.po_template

                    const existingTemplates = new Set(poTemplateResponse.map(record => record.purchase_order_template));

                    const newPoTemplates = props.po_template.filter(template => !existingTemplates.has(template));

                    if (newPoTemplates.length > 0) {
                        const po_templateChildRecords = newPoTemplates.map(template => ({
                            doctype: "Purchase Order Template Child",
                            parent: props.purchase_order_id,
                            parenttype: "Purchase Order",
                            parentfield: "po_template",
                            purchase_order_template: template,
                        }));

                        const bulkResponse = await call("frappe.client.insert_many", {
                            docs: po_templateChildRecords,
                        });

                    } else {
                        console.log('No new template child records to insert.');
                    }
                } catch (error) {
                    console.error('Error inserting unique child records:', error);
                }
            }

            emit('update:popupVisible', false);
        } catch (error) {
            console.error("Error fetching template details:", error);
        }
    }
};

onMounted(() => {
    window.addEventListener("resize", updatePopupSize);
});
onUnmounted(() => {
    window.removeEventListener("resize", updatePopupSize);
});

</script>

<template>
    <dx-popup :visible.sync="popupVisible" :width="popupWidth" :height="popupHeight" :show-title="true"
        :title="props.doctype" :hide-on-outside-click="false" >
        <div class="popup-content">
            <div class="dx-card details-card" id="card-tasks">
                <gridView :data-source="dataSource" :fields="fieldName" :doctype="doctype" :data="responseData"
                    @update:selectedRowKeys="selectedrowkeys = $event" />
            </div>
            <dx-button class="additional-btn popup-grid-btn" text="Add" icon="plus" type="default"
                styling-mode="contained" @click="handleAddClick" />
        </div>
    </dx-popup>
</template>


<style scoped>
/* Ensure the popup content is responsive */
/* .popup-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    gap: 10px;
} */

/* Make gridView responsive */
#card-tasks {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
}

/* Ensure button stays visible on smaller screens */
.popup-grid-btn {
    width: 100%;
    max-width: 200px;
}

/* Adjustments for mobile screens */
/* Default styles for large screens (desktops) */
/* .popup-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    gap: 10px;
} */

/* Responsive grid container */
#card-tasks {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
}

/* Ensure the button is always accessible */
/* .popup-grid-btn {
    width: 100%;
    max-width: 200px;
} */

.popup-content {
    display: flex;
    flex-direction: column;
    align-items: flex-end; /* Align content to the right */
    padding: 16px;
    gap: 10px;
    width: 100%;
}

.popup-grid-btn {
    align-self: flex-end; /* Align button to the right */
    max-width: 100px;
}

/* Large screens (1200px width) */
@media only screen and (max-width: 1200px) {
    .popup-content {
        padding: 14px; /* Adjust padding */
    }

    #card-tasks {
        overflow-x: auto;
    }

    .popup-grid-btn {
        max-width: 180px; /* Adjust button width */
    }
}


/* Medium screens (Tablets, iPads) */
@media only screen and (max-width: 1024px) {
    .popup-content {
        padding: 12px;
    }

    #card-tasks {
        overflow-x: auto;
    }

    .popup-grid-btn {
        max-width: 180px;
    }
}

/* Small screens (Mobile devices) */
@media only screen and (max-width: 768px) {
    .popup-content {
        padding: 10px;
        gap: 6px;
    }

    #card-tasks {
        overflow-x: scroll;
    }

    .popup-grid-btn {
        max-width: 150px;
    }
}

/* Extra small screens (Narrow mobile devices) */
@media only screen and (max-width: 480px) {
    .popup-content {
        padding: 8px;
        gap: 6px;
    }

    #card-tasks {
        overflow-x: scroll;
    }

    .popup-grid-btn {
        max-width: 120px;
        font-size: 14px;
    }
}

</style>
