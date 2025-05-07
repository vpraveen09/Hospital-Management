<script setup>
import {
    DxColumn,
    DxDataGrid,
    DxPaging,
    DxScrolling,
    DxSelection,
    DxFilterRow
} from 'devextreme-vue/data-grid';
import DxDropDownBox from 'devextreme-vue/drop-down-box';
import { ref } from 'vue';

const props = defineProps({
    value: Number,
    onValueChanged: Function,
    dataSource: Object,
});

const currentValue = ref(props.value);
console.log("currentValue: ", currentValue);

const dropDownBoxRef = ref(null);
const dropDownOptions = { width: 500 };

function getSelectedRowKeys(value) {
    console.log("value: ", value);
    return value !== null && value !== undefined ? [value] : [];
}

const onSelectionChanged = (e) => {
    currentValue.value = e.selectedRowKeys[0];
    
    props.onValueChanged(currentValue.value);
    // props.onValueChanged(e.selectedRowsData[0].displayText);

    if (e.selectedRowKeys.length > 0) {
        dropDownBoxRef.value.instance.close();
    }
};

</script>

<template>
    <DxDropDownBox ref="dropDownBoxRef" :drop-down-options="dropDownOptions" :input-attr="{ 'aria-label': 'Attribute Name' }"
        :data-source="dataSource" v-model:value="currentValue" 
        content-template="contentTemplate">
        <template #contentTemplate>
            <DxDataGrid :data-source="dataSource" :remote-operations="true" :height="250"
                :selected-row-keys="getSelectedRowKeys(currentValue)" :hover-state-enabled="true"
                :on-selection-changed="onSelectionChanged" :focused-row-enabled="true" :focused-row-key="currentValue">
                <DxColumn data-field="attribute_names"/>
                <DxColumn data-field="product_name"/>
                <DxPaging :enabled="true" :page-size="10" />
                <DxFilterRow :visible="true" />
                <DxScrolling mode="virtual" />
                <DxSelection mode="single" />
            </DxDataGrid>
        </template>
    </DxDropDownBox>
</template>