<script setup>
import { usersStore } from "@/stores/users";
import DxButton from "devextreme-vue/button";
import DxDataGrid, {
  DxColumn,
  DxColumnChooser,
  DxFilterPanel,
  DxFilterRow,
  DxToolbar as DxGridToolbar,
  DxItem as DxGridToolbarItem,
  DxHeaderFilter,
  DxPager,
  DxPaging,
  DxSelection,
  DxSummary,
  DxTotalItem
} from "devextreme-vue/data-grid";
import { DxGallery } from 'devextreme-vue/gallery';
import DxPopup from "devextreme-vue/popup";
import DxTextBox from "devextreme-vue/text-box";
import { call } from 'frappe-ui';
import { computed, inject, onMounted, ref, watch } from "vue";

const props = defineProps({
  dataSource: {
    type: Object,
    required: true,
  },
  fields: {
    type: Array,
    default: () => [],
  },
  doctype: {
    type: String
  },
  image: {
    type: Object,
    default: () => ({}),
  },
  data: {
    type: Array,
    default: () => [],
  },
  fields: {
    type: Array,
    default: () => [],
  },
  isSaveFilter: {
    type: Boolean
  },
  showPagination: {
    type: Boolean,
    default: true,
  },
  showMultiSelect: {
    type: Boolean,
    default: true,
  },
});

const urlParams = new URLSearchParams(window.location.search);

urlParams.forEach((value, key) => {
  if (key !== 'tab' && key !== 'order_id' && key !== 'direct') {
    filters.push([key, '=', value]);
  }
  // filters.push([key, '=', value]);
});

const emit = defineEmits(['update:selectedRowKeys', 'gridReady', 'row-click', 'row-clicked']);

const showToast = inject('showToast');

const { getUser } = usersStore();

const user = computed(() => getUser() || {});

const orderName = ref("");
const currentImageIndex = ref(0);
const popupVisible = ref(false);
const filterName = ref("");
const currentFilter = ref([]);
const dataGridRef = ref(null);
const showPopup = ref(false);
const selectedRowKeys = ref([]);
const filters = [];

const selectedFilter = ref(null);
const savedFilters = ref([]);

// Method to get data-type based on fieldtype
const getColumnDataType = (fieldType) => {
  const typeMapping = {
    'Int': 'number',
    'Currency': 'currency',
    'Date': 'date',
    'Boolean': 'boolean',
    'String': 'string',
    'Decimal': 'number',
    'Text': 'string',
    'Custom': 'string',
  };

  return typeMapping[fieldType] || 'string';
};

// Mapping for specific formatting
const getColumnFormat = (fieldType) => {
  const formatMapping = {
    'Currency': {
      format: 'currency',
      currency: 'USD',
    },
    'Date': {
      format: 'shortDate',
    },
    'Decimal': {
      format: 'fixedPoint',
      precision: 2,
    },
  };

  return formatMapping[fieldType] || {};
};

const onLinkClick = (data) => {
  emit('row-click', data.data);
};

// const handleRowClick = (e) => {
//   const isImageColumn = e.event.target.closest('.dx-command-edit');

//   if (e.column?.dataField !== 'image') { // Skip row click for the 'image' column
//     const selectedRowId = e.data.name;
//     emit('row-clicked', selectedRowId);
//   }
// };

const handleRowClick = (e) => {
  const isImageColumn = e.event.target.closest('.dx-command-edit');

  // Check if the clicked column is the one you want to act as the hyperlink
  if (e.column?.dataField === 'name') { // Replace 'name' with your specific column dataField
    const selectedRowId = e.data.name;
    emit('row-clicked', selectedRowId);
  }
};

const emitGridInstance = () => {
  if (dataGridRef.value) {
    const gridInstance = dataGridRef.value.instance

    if (gridInstance) {
      emit('gridReady', gridInstance);
    }
  }
};

const onSelectionChanged = (e) => {
  selectedRowKeys.value = e.selectedRowKeys;
  emit("update:selectedRowKeys", selectedRowKeys.value);
};

const images = ref([
  'https://thumbs.dreamstime.com/b/wien-austria-june-pile-discarded-computer-memory-boards-sorted-bin-recycling-recovery-compound-vienna-168110588.jpg',
  'https://img.freepik.com/premium-photo/huge-tech-gadgets-garbage-e-waste-recycling-become-major-challenge_1041953-608.jpg',
  'https://cdn.downtoearth.org.in/library/large/2024-03-20/0.86913300_1710955696_istock-483215696.jpg'
]);

const selectBoxOptions = computed(() => ({
  items: savedFilters.value,
  value: selectedFilter.value,
  displayExpr: "text",
  valueExpr: "value",
  placeholder: "Select a Filter",
  onValueChanged: onFilterChange,
}));

const fetchSavedFilters = async () => {
  try {
    const response = await call('frappe.client.get_list', {
      doctype: 'User Filter',
      filters: {
        user: user.value.name,
      },
      fields: ['filter_name', 'filters'],
    });

    savedFilters.value = response.map(filter => ({
      text: filter.filter_name,
      value: filter.filters,
    }));

  } catch (error) {
    console.error('Error fetching saved filters:', error);
  }
};

const saveFilterCondition = () => {
  if (dataGridRef.value) {
    const grid = dataGridRef.value.instance;
    const filter = grid.option("filterValue");
    if (filter) {
      currentFilter.value = filter;
      popupVisible.value = true;
    } else {
      showToast('No filter condition applied to save.', 'error');
    }
  }
};

const onFilterChange = (e) => {
  const selectedFilterValue = e.value;
  selectedFilter.value = selectedFilterValue;

  const selectedFilterData = savedFilters.value.find(
    (filter) => filter.value === selectedFilterValue
  );

  if (selectedFilterData) {

    if (dataGridRef.value) {
      const grid = dataGridRef.value.instance;
      const filterCondition = JSON.parse(selectedFilterData.value);
      grid.option("filterValue", filterCondition);
    }
  }
};

const handlePopupSave = async () => {
  if (filterName.value && currentFilter.value) {
    const payload = {
      filter_name: filterName.value,
      filters: JSON.stringify(currentFilter.value),
      reference_doctype: props.doctype,
      user: user.value.name,
    };
    try {
      const response = await call('frappe.client.insert', {
        doc: {
          doctype: 'User Filter',
          ...payload
        },
      })
      if (response) {
        popupVisible.value = false;
        filterName.value = "";
        showToast('Filter saved successfully!', 'success');
        await fetchSavedFilters();
      } else {
        console.log(`Error saving filter: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saving filter:", error);
      showToast(`Error saving filter: ${error}`, 'error');
    }
  } else {
    showToast('Filter name cannot be empty.', 'error');
  }
};

const handlePopupCancel = () => {
  popupVisible.value = false;
  filterName.value = "";
};

const handleImageClick = (key) => {
  const imagePaths = props.image[key] || [];

  showPopup.value = true;
  // images.value = imagePaths;
  currentImageIndex.value = 0;

  const orderData = props.data.find((order) => order.name === key);

  if (orderData) {
    orderName.value = orderData.order_id;
    showPopup.value = true;
  } else {
    console.error(`No matching order found for key: ${key}`);
    orderName.value = "";
  }
};

const imageCellTemplate = (container, options) => {
  const icon = document.createElement("i");
  icon.className = "dx-icon-eyeopen dx-card-icon";
  icon.onclick = () => handleImageClick(options.data.name);
  container.appendChild(icon);
};

const handlePopupHiding = () => {
  showPopup.value = false;
};

//const onExporting = (e) => {
//const date = null
//};

const clearFilter = () => {
  currentFilter.value = null;
  selectedFilter.value = ""
  // popupVisible.value = false;
  if (dataGridRef.value) {
    const grid = dataGridRef.value.instance;
    grid.clearFilter();
  }
};

const handleOptionChanged = (e) => {
  if (e.fullName === "filterValue" && !e.value) {
    clearFilter();
  }
};

const handleSavePopupHiding = () => {
  popupVisible.value = false;
  filterName.value = "";
};

// const onCellPrepared = (e) => {
//   if (e.rowType === 'header') {
//     e.cellElement.style.textAlign = 'center';
//   }
//   if (e.rowType === 'data') {
//     e.cellElement.style.textAlign = 'center';
//   }
// };

const notesCellTemplate = (container, options) => {
  const icon = document.createElement("i");
  icon.className = "dx-icon-doc dx-card-icon";
  // icon.onclick = () => handleImageClick(options.data.name);
  container.appendChild(icon);
};

// const hyperlinkCellTemplate = (container, options) => {
//   const link = document.createElement('a');
//   link.href = "#";
//   link.textContent = options.value;
//   link.style.textDecoration = 'none';
//   link.style.fontWeight = 'bold';
//   link.addEventListener('click', (event) => {
//     event.preventDefault();
//     onLinkClick(options);  // Pass data as parameter
//   });
//   container.appendChild(link);
// };

const hyperlinkCellTemplate = (container, options) => {
  const link = document.createElement('a');
  link.href = "#";
  link.textContent = options.value;
  link.style.textDecoration = 'none';
  link.style.fontWeight = 'bold';
  link.addEventListener('click', (event) => {
    event.preventDefault();
    onLinkClick(options);
    emit('row-clicked', options.data.name);  // Pass data as parameter
  });
  container.appendChild(link);
};

const statusCellTemplate = (container, options) => {
  const status = options.value;

  if (!status) return;

  const badgeClass = getStatusBadgeClass(status);

  const span = document.createElement('span');
  span.className = `status-badge ${badgeClass}`;
  span.innerText = status;

  // Clear the container to prevent duplicate appends
  container.innerHTML = '';

  // Append the span inside the container
  container.appendChild(span);
};

const getStatusBadgeClass = (status) => {
  switch (status.toLowerCase()) {
    case 'active': return 'badge-success';
    case 'draft': return 'badge-grey';
    case 'cancelled': return 'badge-danger';
    default: return 'badge-default';
  }
};
const formatNumber = (value) => {
  if (!value) return "0";
  return Number(value).toLocaleString("en-US"); // Adds commas (1,000 format)
}
const formatNumberCell = (cellData) => {
  return formatNumber(cellData.value);
}
const getCellTemplate = (field) => {
  if (field.fieldname === 'name' || field.isHyperlink) {
    return hyperlinkCellTemplate; // Use hyperlink template for the 'name' field
  } else if (field.fieldname === 'image') {
    return imageCellTemplate; // Use image template for the 'image' field
  } else if (field.fieldname === 'status') {
    return statusCellTemplate; // Use status template for the 'status' field
  } else if (field.fieldname === 'notes') {
    return notesCellTemplate; // Use notes template for the 'notes' field
  }
  return undefined; // Fall back to default rendering for other fields
};
const getSummaryFormat = (summaryType, label) => {
  switch (summaryType) {
    case "sum":
      return `Total ${label}: {0}`;
    case "avg":
      return `Avg ${label}: {0}`;
    case "min":
      return `Min ${label}: {0}`;
    case "max":
      return `Max ${label}: {0}`;
    case "count":
      return `Total ${label}: {0}`;
    default:
      return `{0}`;
  }
};

watch(
  () => props.dataSource,
  (newDataSource) => {
    if (dataGridRef.value?.instance) {
      dataGridRef.value.instance.option('dataSource', newDataSource);
    }
  }
);

onMounted(() => {
  if (filters.length > 0 && dataGridRef.value) {
    const gridInstance = dataGridRef.value.instance;
    gridInstance.option("filterValue", filters);
  }
  fetchSavedFilters();

});

</script>

<template>


  <div class="grid">


    <!-- :on-cell-prepared="onCellPrepared" -->
    <dx-data-grid ref="dataGridRef" :data-source="props.dataSource"
      :remote-operations="{ filtering: true, sorting: true, paging: true, selection: true }" :show-borders="false"
      :column-auto-width="true" :allow-column-reordering="true" key="name"
      :filter-builder="{ groupOperations: ['and'] }" :selected-row-keys="selectedRowKeys"
      @selection-changed="onSelectionChanged" :on-option-changed="handleOptionChanged" @row-click="handleRowClick"
      @content-ready="emitGridInstance">
      <DxSelection mode="multiple" :allow-select-all="true" select-all-mode="page" sensitivity="accent" />

      <!-- <dx-paging :page-size="5" />
      <dx-pager :show-page-size-selector="true" :show-info="true" :allowed-page-sizes="[5, 10, 20]" :visible="true" /> -->

      <dx-paging v-if="props.showPagination" :page-size="5" />
      <dx-pager v-if="props.showPagination" :show-page-size-selector="true" :show-info="true"
        :allowed-page-sizes="[5, 10, 20]" :visible="true" />

      <dx-filter-row :visible="true" />
      <dx-column-chooser :enabled="true" mode="select" />
      <!-- <dx-export :enabled="true" :allow-export-selected-data="true" :formats="['xlsx', 'pdf']" /> -->
      <dx-selection v-if="props.showMultiSelect" :mode="'multiple'" :show-checkboxes-mode="'always'" />

      <DxHeaderFilter :visible="true" />
      <DxFilterPanel class="test" v-if="props.isSaveFilter === true" :visible="true" />

      <dx-grid-toolbar>
        <dx-grid-toolbar-item name="exportButton" />
        <dx-grid-toolbar-item name="columnChooserButton" locate-in-menu="auto" />

        <dx-grid-toolbar-item v-if="props.isSaveFilter === true" location="after" @value-changed="onFilterChange"
          widget="dxSelectBox" placeholder="Select a Filter" :options="selectBoxOptions" />

        <dx-grid-toolbar-item v-if="props.isSaveFilter === true" location="after">
          <dx-button v-if="props.isSaveFilter === true" class="additional-btn" text="Save Filter" type="default"
            styling-mode="contained" @click="saveFilterCondition" />

        </dx-grid-toolbar-item>

      </dx-grid-toolbar>


      <!-- :visible="field.fieldname !== 'name'"  -->

      <template v-for="(field, index) in props.fields.filter(f => !f.hide)" :key="index">
        <dx-column :data-field="field.fieldname" :caption="field.label || field.fieldname"
          :alignment="field.fieldtype === 'string' ? 'left' : 'center'" :data-type="getColumnDataType(field.fieldtype)"
          :allow-sorting="field.fieldname !== 'image'" :width="field.width || undefined"
          :format="field.fieldtype === 'number' ? 'fixedPoint' : undefined" 
          :cell-template=" getCellTemplate(field)" />
        <!-- :cell-template="field.isHyperlink ? hyperlinkCellTemplate
				: (field.fieldname === 'image' ? imageCellTemplate
				: (field.fieldname === 'notes' ? notesCellTemplate
                : (field.fieldname === 'status' ? statusCellTemplate
				: undefined)))"  -->
        <!-- :cell-template="field.fieldname === 'name' ? hyperlinkCellTemplate : undefined" -->
      </template>
      <!-- <dx-template name="numberFormatter">
        <template #default="{ data }">
          {{ formatNumber(data.value) }}
        </template>
      </dx-template> -->
      <DxSummary>
        <DxTotalItem v-for="(field, index) in props.fields.filter(f => f.showSummary)" :key="index"
          :column="field.fieldname" :summary-type="field.summaryType || 'sum'"
          :value-format="field.fieldtype === 'number' ? 'fixedPoint' : undefined" 
          :display-format="getSummaryFormat(field.summaryType, field.label)" />
      </DxSummary>

    </dx-data-grid>

    <dx-popup :visible.sync="popupVisible" :width="400" :height="180" :show-title="true" title="Save Filter"
      :hide-on-outside-click="false" @hiding="handleSavePopupHiding">
      <div class="popup-content">
        <dx-text-box placeholder="Enter Filter Name" v-model="filterName" :value-change-event="'input'"
          class="filter-name-input" />
        <div class="button-container">
          <dx-button text="Cancel" styling-mode="contained" class="cancel-button" :on-click="handlePopupCancel" />
          <dx-button text="Save" styling-mode="contained" class="save-button" :on-click="handlePopupSave" />
        </div>
      </div>
    </dx-popup>

    <!-- Popup to show the image gallery -->
    <dx-popup :visible.sync="showPopup" :width="700" :height="600" title="View Details" :show-title="true"
      :hide-on-outside-click="true" @hiding="handlePopupHiding">
      <p>Order: <span class="order_name">{{ orderName }}</span></p>
      <dx-gallery :data-source="images" :height="400" :loop="true" :show-indicators="true" :show-nav-buttons="true"
        style="max-width: 100%; max-height: 100%;" />
    </dx-popup>

  </div>
</template>

<style scoped lang="scss">
// @import "../axe-custom-styles.scss";

.additional-btn {
  margin: 10px;
}

.popup-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.filter-name-input {
  margin-bottom: 20px;
  width: 100%;
}

.button-container {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.save-button,
.cancel-button {
  min-width: 100px;
}

.save-button {
  color: var(--base-bg) !important;
  background-color: var(--base-text-color) !important;
}

.order_name {
  font-weight: bold
}

.hyperlink-style {
  color: blue !important;
  text-decoration: none;
}

.hyperlink-style:hover {
  color: darkblue !important;
  /* Change color on hover */
  cursor: pointer;
}
</style>
