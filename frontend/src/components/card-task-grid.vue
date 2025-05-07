<script setup>
import DxLoadPanel from 'devextreme-vue/load-panel';
import gridView from './grid-view.vue';
import CustomStore from 'devextreme/data/custom_store';
import { createResource } from "frappe-ui";
import { ref, reactive } from "vue";

import { useRouter } from "vue-router";

const router = useRouter();
const emit = defineEmits(['update:selectedRowKeys']);

const doctype = 'Inbound Inquiry'
let parentImages = reactive({});
let fieldName = ref([]);
let responseData = ref([]);
const selectedrowkeys = ref([]);
const selectedRowKeys = ref([]);

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
      // fields: JSON.stringify(['*']),
      filters: JSON.stringify(filter),
      limit_start: skip || 0,
      limit_page_length: take || 10,
      order_by: orderBy,
    };

    const resource = createResource({
      url: 'axe_product.api.doc.get_grid_data',
      method: 'GET',
      params,
    });

    try {
      const response = await resource.fetch();
      const data = response.message.data || [];

      // Queue updates to reactive state to avoid redundant triggers
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

    //   emit("update:selectedRowKeys", selectedrowkeys.value);

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
    name: 'updateOrder',
    query: { name: selectedRowId }, // Pass the selected row's ID as a query parameter
  });
};

</script>

<template>
  <div id="card-tasks">
    <dx-load-panel :show-pane="false" width="auto" container="#card-tasks" :position="{ of: '#card-tasks' }" />
    <gridView   :doctype="doctype" :image="parentImages" :data="responseData"
    @update:selectedRowKeys="emit('update:selectedRowKeys', $event)" :isSaveFilter="true" @row-clicked="handleRowClicked"/>
  </div>
</template>

<style lang="scss">
// @import "../axe-custom-styles.scss";

.dx-datagrid-filter-panel {
  background-color: var(--base-header-row-bgcolor) !important;
  color: var(--base-header-row-color) !important;
}

.dx-datagrid-filter-panel .dx-datagrid-filter-panel-text,
.dx-icon-filter:before,
.dx-datagrid-filter-panel-clear-filter {
  color: var(--base-header-row-color) !important;
}
</style>
