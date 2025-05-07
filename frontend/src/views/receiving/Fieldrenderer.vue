<script setup>

import DxTextBox from "devextreme-vue/text-box";
import DxTextArea from "devextreme-vue/text-area";
import DxSelectBox from "devextreme-vue/select-box";
import DxProgressBar from "devextreme-vue/progress-bar";
// import {DxSwitch} from "devextreme-vue/switch";
import { debounce } from "lodash";
import{ ref, computed }from 'vue';

defineProps({
  field: Object,
  modelValue: [String, Number, Object],
});

// const props = defineProps({
//   field: Object,
//   modelValue: {type:[String, Number, Object], default: 0},
//   recieved_value:Object,
// });

const emit = defineEmits(['update:modelValue', 'trigger-search']);
// const remaining = computed(() => {
//   const max = props.field?.max || 0;
//   const value = props.modelValue || 0;
//   return max - value;
// });

const handleSearch = debounce((e) => {
  const searchTerm = e?.component?.option("text") || "";
  emit("trigger-search", searchTerm);
}, 300);

// const statusFormat=(value) =>{
//       return `${value}% Completed`;
//     }
const switchValue = ref(true);

</script>

<template>
  <div class="form-group">
    <div  class="field-container">
    <label :for="field.fieldname">{{ field.label }} <span v-if="field.required" class="required">*</span></label>
    <div class="produt_icon" v-if="field.fieldname==='product'">
      <i class="dx-icon-photooutline dx-card-icon camera-icon"></i>
    </div>

    <div v-if="field.fieldname==='unit_count'">
      <!-- <DxSwitch :value="switchValue" /> -->
    </div>
  </div>
    <dx-text-box v-if="['Int', 'Percent', 'Data'].includes(field.fieldtype)" :value="modelValue"
      @value-changed="(e) => emit('update:modelValue', e.value)" :placeholder="`Enter ${field.label}`"
      class=" p-2 border rounded-md" :class="{ 'is-invalid': field.invalid }" styling-mode="outlined"></dx-text-box>

    <dx-select-box v-if="field.fieldtype === 'Select'" :items="field.options.split('\n')" :value="modelValue"
      :placeholder="`Select ${field.label}`" @value-changed="(e) => emit('update:modelValue', e.value)"
      class=" p-2 border rounded-md" :class="{ 'is-invalid': field.invalid }" styling-mode="outlined"></dx-select-box>

    <dx-select-box v-if="field.fieldtype === 'Link'" :items="field.options" @input="handleSearch" :value="modelValue"
      @value-changed="(e) => emit('update:modelValue', e.value)"  :search-enabled="true"
      :show-clear-button="field.fieldname === 'purchase_order_id'" class=" p-2 "
      :class="{ 'is-invalid': field.invalid }" :placeholder="`Search or Select ${field.label}`"
      styling-mode="outlined" />

    <!-- <dx-select-box v-if="field.fieldtype === 'Link' && field.fieldname !== 'purchase_order_id'" :items="field.options"
      :value="modelValue" @value-changed="(e) => emit('update:modelValue', e.value)" :search-enabled="true"
      :placeholder="`Select ${field.label}`" class=" p-2 border rounded-md" :class="{ 'is-invalid': field.invalid }"
      styling-mode="outlined" />
      -->

    <dx-text-area v-if="field.fieldtype === 'Small Text'" :value="modelValue"
      @value-changed="(e) => emit('update:modelValue', e.value)" :placeholder="`Enter ${field.label}`"
      styling-mode="outlined" class=" p-2 border rounded-md" :class="{ 'is-invalid': field.invalid }"></dx-text-area>
    <!--
    <dx-progress-bar v-if="field.fieldtype === 'Progress'&& field.fieldname=='client_gross'" :value=modelValue :min=field.min || 0
      :max=field.max||0  @value-changed="(e) =>{console.log('Value changed:',modelValue);  emit('update:modelValue', e.value)}" />
       -->
    <dx-progress-bar v-if="field.fieldtype === 'Progress'" :value="modelValue||0" :min=field.min||0 :max=field.max||0
      :show-status="false"  class="custom-progress-bar" />
      <div class="progress-details" v-if="field.fieldtype === 'Progress'" >
      <span>Received - <b>{{ field.value || field.min }}</b></span>
      <span>Remaining - <b>{{ field.max? field.max - field.value : 0 }}</b></span>
      
      <!-- <span>Remaining - <b>{{ remaining }}</b></span> -->
    <!-- <span>Received - <b>{{ recieved_value.gross || field.min }}</b></span>
    <span>Remaining - <b>{{ field.max - recieved_value.gross }}</b></span> -->
    </div>
 </div>
</template>


<style scoped>
.required {
  margin-left: 4px;
  color: red;
  font-size: 14px;
}
.camera-icon{
  font-size: 24px !important;
}
.is-invalid {
  border: 1px solid red !important;
}
.field-container {
  height:14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin: 0px;
  padding:0;
}
.progress-details {
  display: flex;
  justify-content: space-between;
  font-weight: 300;
  font-size: small;
  margin:0px !important;
}
label {
  font-weight: 700;
  margin-bottom: 10px;
  color: #525252;
}

input,
select,
textarea {
  padding-bottom: 10px;
  font-size: 14px;

}

.form-group>* {
  margin-top: 5px;
  width: 350px;

}

input::placeholder,
textarea::placeholder {
  padding: 30px;
}

.custom-progress-bar{
  margin: 0px !important;
}

.custom-progress-bar .dx-progressbar-range {
  height: 8px !important;
}

.product_icon{
  display: flex;
  justify-content: space-between;
}
</style>
