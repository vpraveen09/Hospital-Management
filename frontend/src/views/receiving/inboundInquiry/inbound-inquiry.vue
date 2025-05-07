<script setup>
import cardTasks from '@/components/card-tasks.vue';
import { DxButton } from 'devextreme-vue/button';
import { DxScrollView } from 'devextreme-vue/scroll-view';
import { DxTabPanel } from 'devextreme-vue/tab-panel';
import { DxItem as DxTabItem } from 'devextreme-vue/tabs';
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { call, createResource, createListResource } from "frappe-ui";
import cardTaskGrid from '@/components/card-task-grid.vue';

const selectedrowkeys = ref([]);

// Mapping of tab names to their index
const tabMapping = {
  all: 0,
  checkin: 1,
  triage: 2,
  audit: 3,
  testing: 4,
  qurantine:5
};

const route = useRoute();
const router = useRouter();
const inboundInquiryOrderCount = ref(0);

const selectedTabIndex = ref(tabMapping[route.query.tab?.toLowerCase()] ?? 0);

watch(
  () => route.query.tab,
  (newTab) => {
    selectedTabIndex.value = tabMapping[newTab?.toLowerCase()] ?? 0;
  }
);

const handleTabChange = (e) => {
  const tabName = Object.keys(tabMapping).find(
    (key) => tabMapping[key] === e.component.option('selectedIndex')
  );

  const updatedQuery = { ...route.query };

  if (tabName && tabName !== 'all') {
    updatedQuery.tab = tabName;
  } else {
    delete updatedQuery.tab;
  }

  router.push({
    name: 'inbound-inquiry',
    query: updatedQuery,
  });
};


function navigateToCheckIn() {
  router.push({ name: 'CheckIn' ,query: {order_id: selectedrowkeys.value } });
}

function navigateToOrderCreate() {
  router.push({ name: 'createOrder' });
}

const fetchCount = async (doctype, filters = []) => {
  try {
    const response = await createResource({
      url: "frappe.client.get_count",
      params: {
        doctype,
        filters: {status: 'Active'},
      },
    }).fetch();

    return response || 0; // Return count, fallback to 0
  } catch (error) {
    console.error(`Error fetching ${doctype} count:`, error);
    return 0;
  }
};

const fetchOrderCount = async () => {
	inboundInquiryOrderCount.value = await fetchCount("Inbound Inquiry");
	// console.log(inboundInquiryOrderCount);
};



onMounted(() => {
  fetchOrderCount();
});

</script>

<template>
  <dx-scroll-view class="view-wrapper-scroll">
    <div class="view-wrapper">
      <div class="row">
        <h3>Receiving</h3>
        <dx-button class="additional-btn" text="Create New" icon="plus" type="default" styling-mode="contained" @click="navigateToOrderCreate" />
      </div>

      <div class="button-container">
        <dx-button class="additional-btn" text="TRUCK" type="default" styling-mode="contained" />
        <dx-button class="additional-btn" text="CHECK IN" type="default" styling-mode="contained"
        @click="navigateToCheckIn"/>
        <dx-button class="additional-btn" text="TRIAGE" type="default" styling-mode="contained" />
        <dx-button class="additional-btn" text="AUDIT" type="default" styling-mode="contained" />
		<dx-button class="additional-btn" text="TESTING" type="default" styling-mode="contained" />
        <dx-button class="additional-btn" text="PARTS HARVEST" type="default" styling-mode="contained" />
        <dx-button class="additional-btn" text="QUARANTINE" type="default" styling-mode="contained" />
      </div>

      <!-- card -->
      <div class="card-container">
        <div class="dx-card small-card">
          <div class="card-title">
            <h3 class="title-number"> {{ inboundInquiryOrderCount }} </h3>
            <i class="dx-icon-cart dx-card-icon custom-icon"></i>
          </div>

          <p>Total</p>
          <h5 class="card-desc">Active Orders</h5>
        </div>

        <!-- Card 2 -->
        <div class="dx-card small-card">
          <div class="card-title">
            <h3 class="title-number">0</h3>
            <i class="dx-icon-taskrejected dx-card-icon custom-icon"></i>
          </div>
          <p>Total</p>
          <h5 class="card-desc">Overdue Orders</h5>
        </div>
      </div>

      <div class="grid-main">
        <div class="dx-card details-card">
          <dx-tab-panel :selected-index="selectedTabIndex" @option-changed="handleTabChange">
            <dx-tab-item title="All">
              <cardTasks v-model:selectedRowKeys="selectedrowkeys"/>
            </dx-tab-item>

            <dx-tab-item title="Check In">
              <cardTaskGrid/>
            </dx-tab-item>

            <dx-tab-item title="Triage">
              <cardTaskGrid/>
            </dx-tab-item>

            <dx-tab-item title="Audit">
              <cardTaskGrid/>
            </dx-tab-item>

            <dx-tab-item title="Testing">
              <cardTaskGrid/>
            </dx-tab-item>

			<dx-tab-item title="Parts Harvest">
              <cardTaskGrid/>
            </dx-tab-item>

            <dx-tab-item title="Quarantine">
              <cardTaskGrid/>
            </dx-tab-item>

          </dx-tab-panel>
        </div>
      </div>

      <router-view />
    </div>
  </dx-scroll-view>

</template>


<style scoped lang="scss">
@use "@/variables" as *;
@use "sass:math";
// @import "../axe-custom-styles.scss";

@media only screen and (max-width: 875px) {
  :deep(.contact-name-toolbar-item) {
    min-width: calc(var(--left-panel-width) + var(--right-panel-width) - 145px);
  }
}

.view-wrapper {
  --left-panel-width: 400px;
  --right-panel-width: 360px;
  padding-top: var(--content-padding);
  padding-bottom: var(--content-padding);

  .panels {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 20px;

    .left {
      flex: 1 var(--left-panel-width);
      margin-top: 8px;
    }

    .right {
      flex: 1 calc(100% - var(--left-panel-width) - 20px);
      margin-top: 8px;
      min-width: 340px;
    }
  }
}

.grid-header {
  font-size: 22px;
  font-weight: 400;
  padding-right: 25px;
}

.button-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
  align-items: center;
  padding: 20px 0;
}

.card-container {
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin: 10px 0;
}

.small-card {
  padding: 12px;
  border: 1px solid var(--base-border-color);
  border-radius: 6px;
  width: 280px;
  background-color: var(--base-bg);
  color: var(--base-header-row-color);
  height: 130px;
}

.small-card p{
  margin: 0 !important;
}

.card-title {
  margin: 0;
}

/* Title Section Flexbox */
.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
}

.title-number {
  // font-size: 2px;
  // font-weight: bold;
  margin: 0 !important;
}

.card-desc{
  margin: 10px 0;
  font-weight: 900 !important;
  font-size: large !important;
}

@media only screen and (max-width: 768px) {
  .card-container {
    flex-direction: column;
    gap: 16px;
  }

  .small-card {
    width: 99%;
    max-width: 100%;
  }
}

// @media only screen and (max-width: 880px) {
//   .button-container{
//     gap:12px
//   }
// }

.grid-main{
  margin: 30px 0;
}

</style>
