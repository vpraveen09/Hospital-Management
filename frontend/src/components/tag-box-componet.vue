<script setup>
import { ref } from 'vue';
import { DxDataGrid } from 'devextreme-vue/data-grid';
import DxTagBox from 'devextreme-vue/tag-box';
import CustomStore from 'devextreme/data/custom_store';

const props = defineProps({
  cellInfo: Object,
  dataSource: Object,
  dataGridComponent: Object,
});

const currentValue = ref(props.cellInfo.value);

const onSelectionChanged = () => {
  props.dataGridComponent.updateDimensions();
};

const onValueChanged = (e) => {
  props.cellInfo.setValue(e.value);
};
</script>

<template>
    <DxTagBox
      :data-source="dataSource"
      v-model:value="currentValue"
      :show-selection-controls="true"
      :input-attr="{ 'aria-label': 'Name' }"
      :max-displayed-tags="3"
      :show-multi-tag-only="false"
      :on-value-changed="onValueChanged"
      :on-selection-changed="onSelectionChanged"
      :search-enabled="true"
      value-expr="specification"
      display-expr="specification"
      apply-value-mode="useButtons"
    />
</template>
