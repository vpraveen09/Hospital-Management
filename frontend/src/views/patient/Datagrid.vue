<!-- PatientDataGrid.vue -->
<script setup>
import { defineExpose, ref as vueRef, defineProps, defineEmits } from 'vue';

// import { defineProps, defineEmits } from 'vue';
import {
  DxDataGrid,
  DxColumn,
  DxPaging,
  DxPager,
  DxFilterRow,
  DxSearchPanel,
  DxColumnChooser,
  DxFilterPanel,
  DxHeaderFilter,
  DxSelection,
} from 'devextreme-vue/data-grid';

const props = defineProps({
  dataSource: Object,
  selectedRows: Array,
});

const emit = defineEmits(['selectionChanged']);
const internalGridRef = vueRef(null);
defineExpose({ instance: internalGridRef });

</script>

<template>
  <DxDataGrid
    :data-source="dataSource"
    :show-borders="true"
    :column-auto-width="true"
    :allow-column-resizing="true"
    :row-alternation-enabled="true"
    :hover-state-enabled="true"
    :remote-operations="true"
    :show-column-lines="true"
    :show-row-lines="true"
    :word-wrap-enabled="true"
    :scrolling="{ mode: 'standard' }"
    :selection="{ mode: 'multiple', showCheckBoxesMode: 'always' }"
    @selection-changed="e => emit('selectionChanged', e)"
    class="grid"
  >
    <DxColumn dataField="name" caption="ID" />
    <DxColumn dataField="full_name" caption="Full Name" />
    <DxColumn dataField="date_of_birth" caption="Date of Birth" dataType="date" format="yyyy-MM-dd" />
    <DxColumn dataField="gender" />
    <DxColumn dataField="contact_number" caption="Contact Number" />
    <DxColumn dataField="email" />
    <DxColumn dataField="address" />
    <DxColumn dataField="emergency_contact" caption="Emergency Contact" />
    <DxColumn dataField="blood_group" caption="Blood Group" />

    <DxPager
      :show-page-size-selector="true"
      :allowed-page-sizes="[5, 10, 20]"
      :show-info="true"
      showNavigationButtons="true"
      visible="true"
      displayMode="full"
    />
    <DxPaging :page-size="10" />
    <DxFilterRow :visible="true" />
    <DxSelection :show-check-boxes-mode="'always'" :mode="'multiple'" />
    <DxHeaderFilter :visible="true" />
    <DxSearchPanel :visible="true" :highlight-case-sensitive="false" />
    <DxColumnChooser :enabled="true" />
  </DxDataGrid>
</template>

<style scoped>
.grid-selection {
  width: 100%;
  padding: 24px;
  box-sizing: border-box;
}

h2 {
  text-align: center;
  margin-bottom: 24px;
  font-size: 1.8em;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-bottom: 15px;
}

.additional-btn {
  background-color: #007bff;
  color: white;
  font-weight: 600;
  padding: 10px;
  width: 100px;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  font-weight: 600;
  padding: 10px;
  width: 100px;
}
</style>
