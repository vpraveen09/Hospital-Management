<script setup>
import {
	DxAccordion,
	DxItem as DxAccordionItem,
} from "devextreme-vue/accordion";
import { DxButton } from "devextreme-vue/button";
import { DxToolbar, DxItem } from "devextreme-vue/toolbar";
import { DxLoadPanel } from "devextreme-vue/load-panel";
import { defineEmits, defineProps, ref, computed } from 'vue';
import { DxTextBox } from 'devextreme-vue/text-box';
import { DxList } from 'devextreme-vue/list';

// Props
const props = defineProps({
	isOpen: {
		type: Boolean,
		required: true,
	},
	isLoading: {
		type: Boolean,
		default: false,
	},
	panelData: {
		type: Object,
		default: () => ({
			attachment: [],
			discussions: [],
			notes: [],
		}),
	},
});

// Emits
const emit = defineEmits(["close"]);

// Methods
function onClose() {
	emit("close");
}

function formatPrice(price) {
	return `$${price.toFixed(2)}`;
}

// Table Data
const attachmentData = ref([
  { type: "Account", name: "W-9" },
  { type: "Logistics", name: "BOL" },
  { type: "Logistics", name: "FREIGHT INVOICE" },
  { type: "Order:", name: "PACKING LIST" },
  { type: "Order:", name: "MATERIAL PHOTOS" }
]);
const discussionCount = ref(2);
const discussionData = ref([
{ text: 'Lorem Ipsum is simply dummy text of the printing', id: 1 },
{ text: 'Lorem Ipsum is simply dummy text of the printing', id: 2 },
]);

const discussionTitle = computed(() => {
  return `DISCUSSIONS <span class="badge">${discussionCount.value}</span>`;
});

</script>

<template>
	<div id="side-panel" class="panel" :class="{ open: isOpen }">
		<div class="data-wrapper">
			<!-- Loading Indicator -->
			<dx-load-panel :visible="isLoading" :show-pane="false" :width="300" container="#side-panel"
				:position="{ of: '#side-panel' }" />

			<template v-if="panelData">
				<!-- Toolbar -->
				<dx-toolbar class="panel-toolbar">

					<dx-item location="before">
						<div class="panel-name">
							Details
						</div>
					</dx-item>

					<dx-item location="after" widget="dxButton" :options="{
						icon: 'close',
						stylingMode: 'text',
						locateInMenu: 'never',
						onClick: onClose,
					}" />
				</dx-toolbar>


				<!-- Accordion Section -->
				<div class="dx-card data-part">
					<dx-accordion :multiple="false" :collapsible="true">
						<dx-accordion-item title="ATTACHMENTS" class="shipment-table">
							<div class="buttons">
								<dx-button class="additional-btn" text="Add Files" type="default" styling-mode="contained"  />
								<dx-button class="additional-btn" text="Delete Files" type="default" styling-mode="contained" />
							</div>

								<table class="shipment-info-table">
								<thead>
									<tr>
									<th>TYPE</th>
									<th>NAME</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="(item, index) in attachmentData" :key="index">
									<td>{{ item.type }}</td>
									<td>{{ item.name }}</td>
									</tr>
								</tbody>
								</table>
						</dx-accordion-item>

						<dx-accordion-item :title="'DISCUSSIONS (' + discussionCount + ')'">
							<div class="button-container">
								<DxTextBox label="Discussion"  class="full-width-textbox"/>
								<!-- <dx-button class="additional-btn" text="Add" /> -->
								<dx-button class="additional-btn" text="Add" type="default" styling-mode="contained"  />
							</div>
							<div class="no-data-message">
								No Data
							</div>
							<!-- <DxList id="list"> </DxList> -->
						</dx-accordion-item>

						<dx-accordion-item :title="'ORDER NOTES (' + discussionCount + ')'">
							<div class="button-container">
								<DxTextBox label="Notes" class="full-width-textbox"/>
								<!-- <dx-button class="additional-btn" text="Add" /> -->
								<dx-button class="additional-btn" text="Add" type="default" styling-mode="contained"  />
							</div>
							<div class="no-data-message">
								No Data
							</div>
							<!-- <DxList id="list"> </DxList> -->
							<!-- <div class="no-data-card">
								<div class="no-data-message">
									No Data
								</div>
							</div> -->
						</dx-accordion-item>
					</dx-accordion>
				</div>

			</template>
		</div>
	</div>
</template>

<style scoped>
.panel {
	position: fixed;
	top: 0;
	bottom: 0;
	right: 0;
	width: 450px;
	background: var(--base-bg);
	box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.1);
	z-index: 1050;
	transition: transform 0.3s ease-in-out;
	transform: translateX(100%);
	overflow-y: auto;
}

.panel.open {
	transform: translateX(0);
}

.panel-toolbar {
	display: flex;
	justify-content: space-between;
	padding: 8px;
	/* Adjust as needed */
	z-index: 1060;
	/* Ensure toolbar is above everything */
	margin-top: 40px;
	background-color: var(--base-bg);
	border-color: var(--base-border-color);
}

.panel-toolbar .dx-item {
	min-width: 40px;
	/* Ensures buttons have enough space */
	flex-shrink: 0;
	/* Prevents buttons from collapsing */
}

.panel-name {
	font-size: large;
	font-weight: bold;
	margin-right: 8px;
}

/* .no-data-card {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100px;
	border: 1px solid #ccc;
	border-radius: 8px;
	background-color: var(--base-bg);
	padding: 16px;
	margin-top: 20px;
} */

.no-data-message {
	font-size: 16px;
	color: #888;
	text-align: center;
}

.dx-card {
	margin-left: 10px;
	margin-right: 10px;
}

.shipment-info-table {
  width: calc(100% - 20px); /* Subtract margin space from width */
  border-collapse: collapse;
  margin-top: 10px;
  margin-left: 10px;
  margin-right: 10px;
  box-sizing: border-box;
}

.shipment-info-table th,
.shipment-info-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.shipment-info-table th {
  background-color: var(--base-bg);
  font-weight: bold;
}


.button-container {
  display: flex;
  flex-direction: column; /* Arrange items in a column */
  gap: 8px; /* Add vertical space between the textbox and the button */
  align-items: flex-start; /* Align items to the left by default */
  position: relative; /* Position for absolute button alignment */
}

.button-container .additional-btn {
  align-self: flex-end; /* Move the button to the right */
  margin-top: 8px; /* Optional: add spacing between textbox and button */
  margin-left: 10px;

}

.buttons {
  display: flex;
  gap: 8px; /* Space between the buttons */
  justify-content: flex-end; /* Align buttons to the left */
  align-items: center; /* Align buttons vertically in the center */
}

.buttons .additional-btn {
  align-self: flex-end; /* Move the button to the right */
  margin-top: 8px; /* Optional: add spacing between textbox and button */
  margin-right: 10px;
}


.button-container .full-width-textbox {
  width: 100%; /* Make the text box take full width */
  box-sizing: border-box; /* Include padding and borders in width */
}

.badge {
  background-color: #007bff;
  color: white;
  padding: 0.2em 0.5em;
  border-radius: 0.25em;
  font-size: 0.75em;
  margin-left: 5px;
}

</style>
