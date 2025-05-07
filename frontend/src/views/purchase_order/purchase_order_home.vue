<script setup>
import { inject, onMounted, ref } from "vue";
import { DxButton } from 'devextreme-vue/button';
import { DxScrollView } from 'devextreme-vue/scroll-view';
import { createResource } from "frappe-ui";
import { useRouter } from 'vue-router';
import CustomStore from 'devextreme/data/custom_store';

import gridView from '@/components/grid-view.vue';

const showToast = inject('showToast');

const router = useRouter();

const doctype = 'Purchase Order'

let fieldName = ref([]);
let responseData = ref([]);

const handleClick = () => {
    router.push({ name: 'purchase-order-create' });
}

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
            doctype: doctype,
            filters: JSON.stringify(filter),
            limit_start: skip || 0,
            limit_page_length: take || 10,
            order_by: orderBy,
        };

        const resource = createResource({
            url: 'axe_product.api.purchase_order.get_grid_data',
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

                data.forEach((item) => {
                    if (item.child_records) {
                        parentImages[item.name] = item.child_records.filter(record => record.image).map(record => record.image);
                    }
                });
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

const handleRowClicked = (selectedRowId) => {
    router.push({
        name: 'purchase-order-update',
        query: {
            purchase_order_id: selectedRowId,
            direct: true
        }
    });

};

const fetchCount = async (doctype, filters = []) => {
    try {
        const response = await createResource({
            url: "frappe.client.get_count",
            params: {
                doctype,
                filters: { status: 'Active' }

            },
        }).fetch();

        return response || 0; // Return count, fallback to 0
    } catch (error) {
        console.error(`Error fetching ${doctype} count:`, error);
        return 0;
    }
};
const purchaseOrderCount = ref(0);

const fetchOrderCount = async () => {
    purchaseOrderCount.value = await fetchCount("Purchase Order");
};

onMounted(() => {
    fetchOrderCount();
});

</script>

<template>
    <dx-scroll-view class="view-wrapper-scroll">
        <div class="view-wrapper">

            <div class="row">
                <h3>Purchase Order</h3>
                <dx-button class="additional-btn" text="Create New" icon="plus" type="default" styling-mode="contained"
                    @click="handleClick" />
            </div>

            <div class="card-container">
                <div class="dx-card small-card">
                    <div class="card-title">
                        <h3 class="title-number"> {{ purchaseOrderCount }} </h3>
                        <i class="dx-icon-cart dx-card-icon custom-icon"></i>
                    </div>

                    <p>Total</p>
                    <h5 class="card-desc">Active POs</h5>
                </div>

                <div class="dx-card small-card">
                    <div class="card-title">
                        <h3 class="title-number">0</h3>
                        <i class="dx-icon-edittableheader dx-card-icon custom-icon"></i>
                    </div>
                    <p>Total</p>
                    <h5 class="card-desc">Scheduled Weight This Month</h5>
                </div>
                <div class="dx-card small-card">
                    <div class="card-title">
                        <h3 class="title-number">0</h3>
                        <i class="dx-icon-addtableheader dx-card-icon custom-icon"></i>
                    </div>
                    <p>Total</p>
                    <h5 class="card-desc">Received Weight This Month</h5>
                </div>
            </div>
            <div class="dx-card details-card" id="card-tasks">
                <gridView :data-source="dataSource" :fields="fieldName" :doctype="doctype" :data="responseData"
                    :showMultiSelect="false" @row-clicked="handleRowClicked" />
            </div>

            <router-view />
        </div>
    </dx-scroll-view>
</template>

<style scoped lang="scss">
.grid-header {
    font-size: 22px;
    font-weight: 400;
    padding-right: 25px;
}

.button-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: flex-start;
    align-items: center;
    padding: 20px 0;
}

.card-container {
    display: flex;
    flex-direction: row;
    gap: 12px;
    margin: 10px 0;
}

.small-card {
    padding: 12px;
    border: 1px solid var(--base-border-color);
    border-radius: 6px;
    width: 300px;
    background-color: var(--base-bg);
    color: var(--base-header-row-color);
    height: 150px;
}

.small-card p {
    margin: 0 !important;
}

.card-title {
    margin: 0;
}

/* Title Section Flexbox */
.card-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0;
}

.title-number {
    // font-size: 2px;
    // font-weight: bold;
    margin: 0 !important;
}

.card-desc {
    margin: 10px 0;
    font-weight: 900 !important;
    font-size: medium !important;
}

@media only screen and (max-width: 768px) {
    .card-container {
        flex-direction: column;
        gap: 16px;
    }

    .small-card {
        width: 99%;
        max-width: 100%;
        height: 130px;
    }
}

// @media only screen and (max-width: 880px) {
//   .button-container{
//     gap:12px
//   }
// }

.grid-main {
    margin: 30px 0;
}
</style>
