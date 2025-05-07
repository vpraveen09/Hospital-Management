<template>
    <dx-form-item :css-class="cssClass">
      <label class="form-label">{{ label }}</label>
      <DxNumberBox format="#0.## lbs" :input-attr="{ 'aria-label': 'Weight Format' }"
        :value="modelValue"
        :min="0"
        :format="numberFormat"
        @value-changed="updateValue"
      />
    </dx-form-item>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  import { DxNumberBox } from 'devextreme-vue';
  
  const props = defineProps({
    label: String,
    modelValue: Number,
    cssClass: { type: String, default: 'accent' }
  });
  
  const emit = defineEmits(['update:modelValue']);
  
  const numberFormat = { type: "fixedPoint", precision: 0 };
  
  const updateValue = (e) => {
    emit('update:modelValue', e.value);
  };
  </script>
  
  <style scoped>
  .accent {
    font-weight: bold;
  }
  </style>
  


   <!-- <template>
    <dx-form-item :css-class="cssClass">
      <label class="form-label">{{ label }}</label>
      <DxNumberBox 
        :value="modelValue" 
        :min="0" 
        :format="formatNumber" 
        @value-changed="updateValue"
        :display-format="displayFormat"
      />
    </dx-form-item>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  import { DxNumberBox } from 'devextreme-vue';
  const props = defineProps({
    label: String,
    modelValue: Number,
    cssClass: { type: String, default: 'accent' }
  });
  
  const emit = defineEmits(['update:modelValue']);
  
  const formatNumber = (value) => {
    if (!value) return "0";
    return Number(value).toLocaleString("en-US"); // Formats with commas
  };
  
  // Function to add "lbs" suffix
  const displayFormat = (value) => {
    return value ? `${Number(value).toLocaleString()} lbs` : '0 lbs';
  };
  
  const updateValue = (e) => {
    emit('update:modelValue', e.value);
  };
  </script>
  
  <style scoped>
  .accent {
    font-weight: bold;
  }
  </style>
   -->