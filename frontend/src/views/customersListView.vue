<script setup>
// import { onMounted, reactive } from "vue";
// import { createResource } from "frappe-ui";
// import DxDataGrid, {
//   DxColumn,
//   DxFilterRow,
//   DxPager,
//   DxPaging,
// } from "devextreme-vue/data-grid";

import gridView from "@/components/grid-view.vue";

// const customersList = reactive({ message: [] });

  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);

  const filters = {};

  urlParams.forEach((value, key) => {
    filters[key] = value;
  });

  console.log("filters: ", filters);

// onMounted(() => {
//   createResource({
//     url: "/api/method/frappe.client.get_list",
//     method: "GET",
//     params: {
//       doctype: "Customer",
// 	  filters: JSON.stringify(filters),
//       fields: JSON.stringify([
//         "name",
//         "customer_name",
//         "age"
//       ]),
//     },
//   })
//     .fetch()
//     .then((response) => {
//       customersList.message = response.message;
//       console.log("Fetched Data:", customersList.message);
//     })
//     .catch((error) => {
//       console.error("Error fetching data:", error);
//     });
// });

</script>

<template>
	<div class="row">
		<h3>Customer</h3>
		<!-- <dx-button class="additional-btn" text="Add Customer" icon="plus" type="default" styling-mode="contained" -->
		<!-- /> -->
	</div>

	<!-- <div class="grid">
		<dx-data-grid
		class="dx-card content-block"
		:data-source="customersList.message"
		:focused-row-index="0"
		:show-borders="false"
		:focused-row-enabled="true"
		:column-auto-width="true"
		:column-hiding-enabled="true"
		key-expr="name"
		>
		<dx-paging :page-size="2" />
		<dx-pager :show-page-size-selector="true" :show-info="true" />
		<dx-filter-row :visible="false" />

		<dx-column data-field="name" :hiding-priority="3" />

		<dx-column
		data-field="customer_name"
		caption="Customer Name"
		:hiding-priority="0"
		/>
		<dx-column
		data-field="age"
		caption="Customer Age"
		:hiding-priority="0"
		/>
	</dx-data-grid>
	</div> -->
	<gridView
        doctype="Customer"
        :filters=filters
        :fields="[
            { fieldname: 'name', label: 'Name', fieldtype: 'Data' },
            { fieldname: 'customer_name', label: 'Customer Name', fieldtype: 'Data' },
            { fieldname: 'customer_type', label: 'Customer Type', fieldtype: 'Data' },
        ]"
    />
  </template>

<style lang="scss">
@import "../axe-custom-styles.scss";
</style>

