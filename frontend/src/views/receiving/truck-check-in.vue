<script setup>
import { DxButton } from 'devextreme-vue/button';
import { DxTabPanel } from 'devextreme-vue/tab-panel';
import { DxItem as DxTabItem } from 'devextreme-vue/tabs';
import { ref, reactive, computed, onMounted, watch, inject } from "vue";
import { call, createResource, createListResource } from "frappe-ui";
import {
DxForm,
  DxItem as DxFormItem,
  DxGroupItem as DxFormGroupItem,
  DxColCountByScreen,
  DxRequiredRule
} from 'devextreme-vue/form';
import DxTextBox from "devextreme-vue/text-box";
import DxNumberBox from 'devextreme-vue/number-box';
import DxTextArea from "devextreme-vue/text-area";
import DxSelectBox from "devextreme-vue/select-box";
import DxCheckBox  from 'devextreme-vue/check-box';
import CustomStore from 'devextreme/data/custom_store';
import { useRouter } from "vue-router";



</script>

<template>
		<div class="row header">
			<h3>Truck Check-In<span class="pill">Not Saved</span></h3>
			<div class="row buttons">
			<dx-button class="additional-btn" text="Cancel" type="default" styling-mode="contained" />
			<dx-button class="additional-btn form-btn" text="Save and Next" type="default" styling-mode="contained" />
			</div>
		</div>
		<div class="main-content">
			<dx-form class="plain-styled-form dx-form form-container">

			<dx-form-group-item :col-count="2" >
			<dx-col-count-by-screen :xs="1" :sm="2" :md="2" :lg="2" />

			<dx-form-item css-class="accent">
				<label class="form-label"> Order</label>
				<dx-select-box/>
			</dx-form-item>
			</dx-form-group-item>

			<dx-form-group-item :col-count="4">
			<dx-col-count-by-screen :xs="1" :sm="2" :md="2" :lg="2" />
			<dx-form-item :col-span="2" >
				<label class="form-label">Order Notes</label>
				<dx-text-area/>
			</dx-form-item>
			</dx-form-group-item>

			</dx-form>
		</div>


</template>

<style scoped lang="scss">
@use "@/variables" as *;
@use "sass:math";


.checkbox-wrapper {
  display: block; /* Ensure the checkbox is on a new line */
  margin-top: 8px; /* Add space above the checkbox */
}

.additional-btn {
  margin-left: 10px;
}

.row{
  border: none !important;
}

.pill {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: 4.5px 8px;
  border-radius: 999px;
  height: 20px;
  background-color: var(--error-pill-bgcolor) !important;
  color: var(--error-pill-color) !important;
  margin-left: 10px;
  display: inline-flex;
  align-items: center;
}

.main-content {
  /* border: 1px solid #e0e0e0; */
  border: 1px solid var(--base-border-color);
  border-radius: 8px;
}

</style>


