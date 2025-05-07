<script setup>
import { computed, onMounted, ref, watch, inject, defineProps } from 'vue';
import { DxColCountByScreen, DxForm, DxGroupItem as DxFormGroupItem, DxItem } from 'devextreme-vue/form';
import { DxAccordion } from "devextreme-vue/accordion";
import { createResource } from "frappe-ui";
import DxDataGrid, { DxColumn } from "devextreme-vue/data-grid";
import DxNumberBox from 'devextreme-vue/number-box';
import DxSelectBox from 'devextreme-vue/select-box';
import DxTagBox from 'devextreme-vue/tag-box';
import DxTextBox from 'devextreme-vue/text-box';
import DxButton from 'devextreme-vue/button';
import DxCheckBox from 'devextreme-vue/check-box';

const props = defineProps({
    rowData: {
        type: Object,
        required: true
    },
});

const emit = defineEmits(['add_attribute', 'add_service', 'back', 'send_purchase_order_details_id', 'send_purchase_order_attribute_details_id', 'item_id']);

const showToast = inject('showToast');

const isValidationTriggered = ref(false);
const locationsOptions = ref([]);
const uomOptions = ref([]);
const poTemplateOptions = ref([])
const poTempalteMap = ref([])
const productOption = ref([])

let purchase_order_stocked_as = props.rowData.stocked_as
let purchase_order_stocked_as_name = props.rowData.stocked_as_name
let purchase_order_details_id = props.rowData.name
let purchase_order_id = props.rowData.po_parent

const formData = ref({
    account: null,
    locations: '',
    sales: null,
    csr: null,
    po_tags: null,
    stocked_as: null,
    scrap_uom: null,
    scrap_price: null,
    scrap_quantity: null,
    scrap_restrict_quantity: null,
    scrap_max_qty: null,
    resale_unit: null,
    resale_fmv: null,
    resale_unit_min_fmv: null,
    resale_qty: null,
    resale_parts: null,
    resale_parts_fmv: null,
    resale_parts_min_fmv: null,
    reslae_dsd_resale: null,
    product_service_all_inclusive: null,
    product_service_secure: null,
    all_inclusive_price: null,
    secure_price: null,
    gridData: [],
    product_service: [],
    bought_as: null,
    alt_view: null
});

const handleAddClick = () => {
    emit('add_attribute', {
        stockedAs: purchase_order_stocked_as,
        stockedASName: purchase_order_stocked_as_name
    });
    emit('send_purchase_order_details_id', purchase_order_details_id)
    emit('send_purchase_order_attribute_details_id', null)
};

const handleConfigClick = () => {
    emit('add_service', purchase_order_stocked_as);
    emit('send_purchase_order_details_id', purchase_order_details_id)
};

const handleAttributeConfigClick = (rowData) => {
    emit('add_attribute', {
        stockedAs: purchase_order_stocked_as,
        stockedASName: purchase_order_stocked_as_name
    });
    emit('send_purchase_order_attribute_details_id', rowData.name)
};

const handleBackClick = () => {
    emit('back');
};

const validateForm = () => {
    isValidationTriggered.value = true; // Activate red border effect

    const requiredFields = [
        { key: "scrap_uom", label: "UOM" },
        { key: "scrap_price", label: "Price" },
        { key: "resale_unit", label: "Unit" },
        { key: "resale_fmv", label: "FMV" },
        { key: "resale_unit_min_fmv", label: "Min FMV" },
        { key: "resale_qty", label: "Qty" },
        { key: "resale_parts", label: "Parts" },
        { key: "resale_parts_fmv", label: "Parts FMV%" },
        { key: "resale_parts_min_fmv", label: "Min FMV" }

    ];

    const missingFields = requiredFields
        .filter(field =>
            formData.value[field.key] === undefined ||
            formData.value[field.key] === 0 ||
            formData.value[field.key] === null ||
            formData.value[field.key] === "" ||
            (Array.isArray(formData.value[field.key]) && formData.value[field.key].length === 0)
        ).map(field => field.label);


    if (missingFields.length > 0) {
        showToast(`Please enter mandatory fields`, "error");
        return false;
    }

    return true;
};

const fetchDetails = async () => {
    try {
        if (purchase_order_id) {
            const purchaseOrderResponse = await createResource({
                url: "axe_product.api.doc.get_data",
                params: {
                    doctype: "Purchase Order",
                    name: purchase_order_id,
                }
            }).fetch();

            const templateresponseData = purchaseOrderResponse.message.data;

            formData.value.account = templateresponseData.account_name;
            formData.value.sales = templateresponseData.sales_name;
            formData.value.csr = templateresponseData.csr_name;
            formData.value.po_tags = templateresponseData.po_tags;

            let locationValues = templateresponseData.order_location
                .filter(field => field.location)
                .map(field => field.location);
            locationsOptions.value = locationValues;
        }

        if (purchase_order_stocked_as) {
            formData.value.stocked_as = purchase_order_stocked_as;

            const purchaseOrderDetailsResponse = await createResource({
                url: "axe_product.api.doc.get_data",
                params: {
                    doctype: "Purchase Order Pricing Details",
                    name: purchase_order_details_id,
                }
            }).fetch();

            const templateresponseData = purchaseOrderDetailsResponse.message.data;

            formData.value.alt_view = templateresponseData.alt_view
            formData.value.scrap_uom = templateresponseData.scrap_uom
            formData.value.scrap_price = templateresponseData.scrap_price
            formData.value.scrap_quantity = templateresponseData.scrap_quantity
            formData.value.scrap_order_alert = templateresponseData.scrap_order_alert
            formData.value.scrap_max_qty = templateresponseData.scrap_max_qty
            formData.value.resale_unit = templateresponseData.resale_unit
            formData.value.resale_fmv = templateresponseData.resale_fmv
            formData.value.resale_unit_min_fmv = templateresponseData.resale_unit_min_fmv
            formData.value.resale_qty = templateresponseData.resale_qty
            formData.value.resale_parts = templateresponseData.resale_parts
            formData.value.resale_parts_fmv = templateresponseData.resale_parts_fmv
            formData.value.resale_parts_min_fmv = templateresponseData.resale_parts_min_fmv
            formData.value.reslae_dsd_resale = templateresponseData.reslae_dsd_resale
            formData.value.all_inclusive_price = templateresponseData.all_inclusive_price
            formData.value.secure_price = templateresponseData.secure_price
            formData.value.bought_as = templateresponseData.bought_as

            let product_service_names = templateresponseData.product_service.map(item => item.product_service);

            const templateDetailsResponses = await Promise.all(
                product_service_names.map(serviceName =>
                    createResource({
                        url: "axe_product.api.doc.get_data",
                        params: {
                            doctype: "Purchase Order Product Service Link",
                            name: serviceName,
                        },
                    }).fetch()
                )
            );

            let data = templateresponseData.resale_pricing_template.map(field => field.resale_pricing_template);

            formData.value.product_service = templateDetailsResponses.map(response => {
                const data = response?.message?.data;
                return {
                    service_name: data?.product_service_name || "Unknown", // Fallback for missing name
                    selected_items: data?.selected_items?.map(item => item.selected_items).join(", ") || "None", // Convert array to string
                    price: data?.price || 0 // Default price if missing
                };
            });

            const resalePricingTempalteResponse = await createResource({
                url: "frappe.client.get_list",
                params: {
                    doctype: "Purchase Order Resale Details",
                    filters: { name: ["in", data] },
                    fields: JSON.stringify(["name", "description", "price", "quantity"]),
                },
            }).fetch();

            formData.value.gridData = resalePricingTempalteResponse.map(item => ({
                description: item.description,
                name: item.name,
                price: Number(item.price),
                quantity: Number(item.quantity),
                total: Number(item.price) * Number(item.quantity),
            }));
        }

        const poTemplateResponse = await createResource({
            url: "frappe.client.get_list",
            params: {
                doctype: "Purchase Order Template",
                fields: JSON.stringify(["name", "template_name"]),
            },
        }).fetch();

        poTemplateOptions.value = poTemplateResponse.map(order => order.template_name);

        await Promise.all(
            poTemplateResponse.map(async order => {
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

                    poTempalteMap.value[order.template_name].po_details_name = templateDetailsResponse.message.data.active_items.map(item => item.name);
                } catch (error) {
                    console.error("Error fetching template details for", order.template_name, error);
                }
            })
        );

        const uomResponse = await createResource({
            url: "frappe.client.get_list",
            params: {
                doctype: "UOM",
                fields: JSON.stringify(["name", "uom_name"]),
            },
        }).fetch();

        uomOptions.value = uomResponse

        const productResponse = await createResource({
            url: "frappe.client.get_list",
            params: {
                doctype: "Product Master",
                fields: JSON.stringify(["name", "name1", "default_alt_name"]),
            },
        }).fetch();

        productOption.value = productResponse.map(item => ({
            label: item.name1,
            value: item.name,
            alt_view: item.default_alt_name
        }))

    } catch (error) {
        console.error("Error fetching details:", error);
    }
};

const handleSaveNextClick = async () => {
    try {

        if (!validateForm()) {
            return;
        }

        const formDataCopy = { ...formData.value };

        delete formDataCopy.stocked_as;
        delete formDataCopy.product_service;

        const updateResource = createResource({
            url: 'frappe.client.set_value',
            params: {
                doctype: 'Purchase Order Pricing Details',
                name: purchase_order_details_id,
                fieldname: formDataCopy
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
    } catch (error) {
        console.error("Error in Save Next:", error);
    }
};

const infoLinkTemplate = (container, options) => {
    const anchor = document.createElement('a');
    anchor.href = "#";
    anchor.innerText = "Config";
    anchor.style.color = '#28a0e4';
    anchor.style.textDecoration = 'underline';

    anchor.onclick = (event) => {
        event.preventDefault();
        handleAttributeConfigClick(options.data);
    };

    container.innerHTML = '';
    container.appendChild(anchor)
};

const isPartsDisabled = computed(() => {
    return formData.value.resale_unit === 'Not Allowed';
});

watch(() => formData.value.resale_unit, (newVal) => {
    if (newVal === 'Not Allowed') {
        formData.value.resale_parts = 'Not Allowed';
        formData.value.reslae_dsd_resale = 'No'
        formData.value.resale_fmv = 'FMV %'
        formData.value.resale_unit_min_fmv = '0'
        formData.value.resale_qty = '0'
        formData.value.resale_parts_fmv = '0'
        formData.value.resale_parts_min_fmv = '0'

    }
});

watch(() => formData.value.bought_as, (newVal) => {
    if (newVal) {
        const selectedProduct = productOption.value.find(item => item.value === newVal);
        const selectedAltView = productOption.value.find(item => item.value === selectedProduct.alt_view);
        if (selectedAltView) {
            formData.value.alt_view = selectedAltView ? selectedAltView.label : "";
        }
    }

});

watch(() => formData.value.resale_parts, (newVal) => {
    if (newVal === 'Not Allowed') {
        formData.value.reslae_dsd_resale = ''
    }
});

const isDsdDisabled = computed(() => {
    return formData.value.resale_parts === 'Not Allowed';
});

onMounted(() => {
    fetchDetails()
});

</script>

<template>
    <div>
        <div class="row header">
            <span class="tab_breadcrumbs">
                <span class="clickable-pricing" @click="handleBackClick">Pricing</span><span
                    class="breadcrumb-separator">></span>
                <span style="color: #7c7c7c !important;">{{ purchase_order_stocked_as }}</span>
            </span>

            <div class="row buttons">
                <!-- <dx-button class="additional-btn" text="Back" type="default" styling-mode="contained"
                    @click="handleBackClick" /> -->
                <dx-button class="additional-btn form-btn" text="Save" type="default" @click="handleSaveNextClick"
                    styling-mode="contained" />
            </div>
        </div>

        <dx-form :form-data="formData" :col-count=4 class="form-container" :label-mode="'static'">
            <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

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

            <!-- PO Tags -->
            <dx-item :col-span="1">
                <label class="form-label">PO Tags</label>
                <dx-text-box v-model="formData.po_tags" class="p-2 border rounded-md" :disabled="true"
                    styling-mode="outlined" />
            </dx-item>

            <!-- PO Template -->
            <dx-item :col-span="1">
                <label class="form-label">Stocked as</label>
                <dx-text-box v-model="formData.stocked_as" class="p-2 border rounded-md" :disabled="true"
                    styling-mode="outlined" />
            </dx-item>

            <dx-item :col-span="1">
                <label class="form-label">Bought as</label>
                <dx-select-box :items="productOption" v-model="formData.bought_as" value-expr="value" placeholder=""
                    display-expr="label" class="p-2 border rounded-md" styling-mode="outlined" />
            </dx-item>

            <dx-item :col-span="1">
                <label class="form-label">Alt View</label>
                <dx-text-box v-model="formData.alt_view" class="p-2 border rounded-md" :disabled="true"
                    styling-mode="outlined" />
            </dx-item>

        </dx-form>

        <dx-accordion class="accordion" :multiple="false" :collapsible="true">

            <dx-item title="Scrap">
                <dx-form :form-data="formData" class="form-container" :label-mode="'static'">

                    <dx-form-group-item :col-count="4">
                        <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

                        <dx-item :col-span="1">
                            <label class="form-label">UOM<span class="required">*</span></label>
                            <!-- <dx-label class="form-label" text="UOM" /> -->
                            <dx-select-box :items="uomOptions" v-model="formData.scrap_uom" value-expr="name"
                                placeholder="" display-expr="name" class="p-2 border rounded-md" styling-mode="outlined"
                                :class="{ 'border-red': !formData.scrap_uom && isValidationTriggered }" />
                        </dx-item>

                        <dx-item :col-span="1">
                            <label class="form-label">Price<span class="required">*</span></label>
                            <DxNumberBox format="$ #,##0.##" :input-attr="{ 'aria-label': 'Currency Format' }"
                                v-model="formData.scrap_price" :min="0"
                                :class="{ 'border-red': !formData.scrap_price && isValidationTriggered }"
                                class="p-2 border rounded-md" styling-mode="outlined" />
                        </dx-item>

                        <dx-item :col-span="1">
                            <label class="form-label">Quantity</label>
                            <DxNumberBox format="#" v-model="formData.scrap_quantity" :min="0"
                                class="p-2 border rounded-md" styling-mode="outlined" />
                            <!-- <dx-text-box v-model="formData.scrap_quantity" class="p-2 border rounded-md"
                                 styling-mode="outlined" /> -->
                        </dx-item>

                        <dx-item :col-span="1">
                            <label class="form-label">Restrict Quantity</label>
                            <!-- <dx-label class="form-label" text="Order Alert" /> -->
                            <div>
                                <dx-check-box v-model="formData.scrap_restrict_quantity"
                                    class="p-2 border rounded-md" />
                            </div>
                        </dx-item>

                        <dx-item :col-span="1">
                            <label class="form-label">Max Quantity</label>
                            <DxNumberBox format="#" v-model="formData.scrap_max_qty" :min="0"
                                class="p-2 border rounded-md" styling-mode="outlined" />
                            <!-- <dx-text-box v-model="formData.scrap_max_qty" class="p-2 border rounded-md"
                                styling-mode="outlined" /> -->
                        </dx-item>
                    </dx-form-group-item>
                </dx-form>
            </dx-item>
        </dx-accordion>

        <dx-accordion class="accordion" :multiple="false" :collapsible="true">
            <dx-item title="Resale">
                <dx-form :form-data="formData" class="form-container" :label-mode="'static'">
                    <dx-form-group-item :col-count="4">
                        <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

                        <dx-item>
                            <label class="form-label">Unit<span class="required">*</span></label>
                            <dx-select-box :items="['Allowed', 'Not Allowed']" v-model="formData.resale_unit"
                                placeholder="" class="p-2 border rounded-md" styling-mode="outlined"
                                :class="{ 'border-red': !formData.resale_unit && isValidationTriggered }" />
                        </dx-item>

                        <dx-item>
                            <label class="form-label">Credit<span class="required">*</span></label>
                            <dx-select-box :items="['FMV %', 'FMV Fixed']" v-model="formData.resale_fmv" placeholder=""
                                :disabled="isPartsDisabled" class="p-2 border rounded-md" styling-mode="outlined"
                                :class="{ 'border-red': !formData.resale_fmv && isValidationTriggered }" />
                        </dx-item>

                        <dx-item>
                            <label class="form-label">Min FMV<span class="required">*</span></label>
                            <DxNumberBox format="$ #,##0.##" v-model="formData.resale_unit_min_fmv" :min="0"
                                :disabled="isPartsDisabled" class="p-2 border rounded-md" styling-mode="outlined"
                                :class="{ 'border-red': !formData.resale_unit_min_fmv && isValidationTriggered }" />
                            <!-- <dx-text-box v-model="formData.resale_unit_min_fmv" class="p-2 border rounded-md"
                                 styling-mode="outlined"
                                :class="{ 'border-red': !formData.resale_unit_min_fmv && isValidationTriggered }" /> -->
                        </dx-item>

                        <dx-item>
                            <label class="form-label">Quantity<span class="required">*</span></label>
                            <DxNumberBox format="#" v-model="formData.resale_qty" :min="0" class="p-2 border rounded-md"
                                :disabled="isPartsDisabled" styling-mode="outlined"
                                :class="{ 'border-red': !formData.resale_qty && isValidationTriggered }" />
                            <!-- <dx-text-box v-model="formData.resale_qty" class="p-2 border rounded-md"
                               styling-mode="outlined"
                                :class="{ 'border-red': !formData.resale_qty && isValidationTriggered }" /> -->
                        </dx-item>
                    </dx-form-group-item>

                    <dx-form-group-item :col-count="4">
                        <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />

                        <dx-item>
                            <label class="form-label">Parts<span class="required">*</span></label>
                            <dx-select-box :items="['Allowed', 'Not Allowed']" v-model="formData.resale_parts"
                                placeholder="" :disabled="isPartsDisabled" class="p-2 border rounded-md"
                                styling-mode="outlined"
                                :class="{ 'border-red': !formData.resale_parts && isValidationTriggered }" />
                        </dx-item>

                        <dx-item>
                            <label class="form-label">Parts FMV%<span class="required">*</span></label>
                            <DxNumberBox format="#" v-model="formData.resale_parts_fmv" :min="0"
                                class="p-2 border rounded-md" styling-mode="outlined" :disabled="isPartsDisabled"
                                :class="{ 'border-red': !formData.resale_parts_fmv && isValidationTriggered }" />
                        </dx-item>

                        <dx-item>
                            <label class="form-label">Min FMV<span class="required">*</span></label>
                            <DxNumberBox format="$ #,##0.##" v-model="formData.resale_parts_min_fmv" :min="0"
                                :disabled="isPartsDisabled" class="p-2 border rounded-md" styling-mode="outlined"
                                :class="{ 'border-red': !formData.resale_parts_min_fmv && isValidationTriggered }" />
                            <!-- <dx-text-box v-model="formData.resale_parts_min_fmv" class="p-2 border rounded-md"
                                 styling-mode="outlined"
                                :class="{ 'border-red': !formData.resale_parts_min_fmv && isValidationTriggered }" /> -->
                        </dx-item>
                    </dx-form-group-item>

                    <!-- <dx-item :col-span="1">
                        <div></div>
                    </dx-item> -->
                    <dx-form-group-item :col-count="4">
                        <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />
                        <dx-item>
                            <label class="form-label">DSD Resale Allowed</label>
                            <dx-select-box :items="['Yes', 'No']" v-model="formData.reslae_dsd_resale" placeholder=""
                                :disabled="isDsdDisabled" class="p-2 border rounded-md" styling-mode="outlined" />
                        </dx-item>
                    </dx-form-group-item>
                </dx-form>


                <div v-if="formData.resale_fmv === 'FMV Fixed'">
                    <div class="button-container">
                        <dx-button class="additional-btn form-btn" text="Add" type="default" icon="plus"
                            @click="handleAddClick" styling-mode="contained" />
                    </div>
                    <div class="dx-card details-card" id="card-tasks">
                        <dx-data-grid :remote-operations="false" :allow-column-reordering="true"
                            :data-source="formData.gridData" :row-alternation-enabled="true" :show-borders="true"
                            :width="'100%'">

                            <dx-column caption="Resale Pricing Table" dataField="description" />
                            <dx-column caption="Quantity" dataField="quantity" />
                            <dx-column caption="Price" dataField="price" />
                            <dx-column caption="Total" dataField="total" />

                            <dx-column caption="Action" :alignment="'center'" data-field="action"
                                :cell-template="infoLinkTemplate" />

                        </dx-data-grid>
                    </div>
                </div>

            </dx-item>
        </dx-accordion>

        <dx-accordion class="accordion" :multiple="false" :collapsible="true">
            <dx-item title="Product Service">
                <div class="button-container">
                    <dx-button class="additional-btn form-btn" text="Config" type="default" icon="plus"
                        @click="handleConfigClick" styling-mode="contained" />
                </div>
                <div class="dx-card details-card custom-grid" id="card-tasks">
                    <dx-data-grid :dataSource="formData.product_service" :remote-operations="false"
                        :allow-column-reordering="true" :row-alternation-enabled="true" :show-borders="true"
                        :width="'100%'">

                        <dx-column dataField="service_name" caption="Name">
                            <!-- <DxLookup :data-source="serviceOptions" display-expr="label" value-expr="value" /> -->
                        </dx-column>

                        <dx-column dataField="selected_items" caption="Selected Items">
                            <!-- <DxLookup :data-source="secureOptions" display-expr="label" value-expr="value" /> -->
                        </dx-column>

                        <dx-column dataField="price" caption="Price($)" format="$ #,##0.##" data-type="number" />

                    </dx-data-grid>
                </div>
                <dx-form :form-data="formData" :col-count=4 class="form-container" :label-mode="'static'">
                    <dx-col-count-by-screen :xs="1" :sm="2" :md="3" :lg="4" />


                    <dx-item :col-span="1">
                        <label class="form-label">All Inclusive</label>
                        <DxNumberBox format="$ #,##0.##" :input-attr="{ 'aria-label': 'Currency Format' }" :min="0"
                            :disabled="true" v-model="formData.all_inclusive_price" />
                    </dx-item>


                    <dx-item :col-span="1">
                        <label class="form-label">Secure</label>
                        <DxNumberBox format="$ #,##0.##" :input-attr="{ 'aria-label': 'Currency Format' }" :min="0"
                            :disabled="true" v-model="formData.secure_price" />
                    </dx-item>
                </dx-form>
            </dx-item>
        </dx-accordion>

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

.header {
    margin-left: 10px;
}

.buttons {
    margin-right: 18px;
}

.breadcrumb-separator {
    font-size: medium;
    margin: 0 8px;
}

.button-container {
    display: flex;
    justify-content: flex-end;
    /* Pushes the button to the right */
    width: 100%;
    /* Ensures it spans the full width of its container */
    padding-right: 10px;
    /* Optional: Adds some spacing from the right */
    margin: 10px 0 10px 0;
}

// .button-container {
//     display: flex !important;
//     //   gap: 10px !important; /* Add space between the buttons */
//     //   flex-wrap: wrap !important; /* Allow buttons to wrap on smaller screens */
// }

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

.arrow span {
    display: inline-block;
    transform: rotate(-180deg);
}


.accordion {
    margin-top: 10px;
    border: 1px solid var(--base-border-color);
    border-radius: 8px;
}
</style>
