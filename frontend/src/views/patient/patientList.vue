<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import notify from 'devextreme/ui/notify';
import DxDataGrid, {
  DxColumn,
  DxPaging,
  DxPager,
  DxFilterRow,
  DxSearchPanel,
  DxColumnChooser,
  DxHeaderFilter,
  DxSelection,
} from 'devextreme-vue/data-grid';
import DxSelectBox from 'devextreme-vue/select-box';
import DxButton from 'devextreme-vue/button';
import { CustomStore } from 'devextreme/common/data';
import { createResource } from 'frappe-ui';

const router = useRouter();
const gridRef = ref(null);
const selectedRows = ref([]);
const buttonLabel = ref('Add patient');
const selectedBloodGroup = ref('');
const BloodGroup = ref(["A+", "B+", "O+", "O-", "AB+", "AB-", "A-", "B-"]);

const dataSource = ref();

const showToast = (message, type = 'info') => {
  notify({
    message,
    type,
    displayTime: 3000,
    position: {
      my: 'bottom right',
      at: 'bottom right',
      offset: '0 -20', 
    },
  });
};


const createDataSource = (bloodGroup) => {
  return new CustomStore({
    key: 'name',
    load: async (loadOptions) => {
      let { filter = [], sort, skip, take } = loadOptions;

      if (bloodGroup) {
        filter.push(["blood_group", "=", bloodGroup]);
      }

      const orderBy = sort?.length
        ? sort.map(s => `${s.selector} ${s.desc ? 'desc' : 'asc'}`).join(',')
        : 'name desc';

      const params = {
        doctype: 'Patient Master',
        fields: JSON.stringify([
          'name', 'full_name', 'date_of_birth', 'gender', 'country', 'state',
          'contact_number', 'email', 'blood_group',
          'address', 'emergency_contact', 'medical_history',
        ]),
        filters: JSON.stringify(filter),
        limit_start: skip || 0,
        limit_page_length: take || 100,
        order_by: orderBy,
      };

      const resource = createResource({
        url: 'hospital_management.api.patient.get_patients',
        method: 'GET',
        params,
      });

      const response = await resource.fetch();

      return {
        data: response.data,
        totalCount: response.total,
      };
    },
  });
};

dataSource.value = createDataSource(selectedBloodGroup.value);

watch(() => selectedBloodGroup.value, (newVal) => {
  dataSource.value = createDataSource(newVal);
  if (gridRef.value?.instance) {
    gridRef.value.instance.refresh();
  }
});

const goToPatientForm = () => {
  const splitPhone = (phone) => {
    const match = phone?.match(/^(\+\d+-)(\d{10})$/);
    return match ? { code: match[1], number: match[2] } : { code: '+91-', number: '' };
  };

  if (selectedRows.value.length === 1) {
    const selected = selectedRows.value[0];
    const contact = splitPhone(selected.contact_number);
    const emergency = splitPhone(selected.emergency_contact);

    router.push({
      path: '/patient-Form',
      query: {
        id: selected.name,
        fullName: selected.full_name,
        dob: selected.date_of_birth,
        gender: selected.gender,
        contactCode: contact.code,
        contact: contact.number,
        email: selected.email,
        address: selected.address,
        emergencyCode: emergency.code,
        emergency: emergency.number,
        bloodGroup: selected.blood_group,
        medicalHistory: selected.medical_history,
        country: selected.country,
        state: selected.state,
      },
    });
  } else {
    router.push('/patient-Form');
  }
};

const onSelectionChanged = (e) => {
  selectedRows.value = e.selectedRowsData;
  buttonLabel.value = selectedRows.value.length === 1 ? 'Edit patient' : 'Add patient';
};

const deleteSelectedPatients = async () => {
  if (selectedRows.value.length === 0) return;

  try {
    for (const patient of selectedRows.value) {
      await createResource({
        url: 'hospital_management.api.patient.delete_patient',
        params: { id: patient.name },
      }).submit();
    }

    showToast('Patient(s) deleted successfully.', 'success');

    selectedRows.value = [];
    if (gridRef.value?.instance) {
      gridRef.value.instance.refresh();
    }
  } catch (error) {
    console.error('Error deleting patients:', error);
    showToast('Error deleting patient(s). Please try again.', 'error');
  }
};
</script>

<template>
  <div class="grid-selection">
    <h2>Patient List</h2>

    <div class="button-group">
      <label>Filter By:</label>

      <DxSelectBox
        :items="BloodGroup"
        v-model:value="selectedBloodGroup"
        :search-enabled="true"
        :show-clear-button="true"
        styling-mode="outlined"
        placeholder="Select Blood Group"
      />

      <DxButton
        v-if="selectedRows.length <= 1"
        class="additional-btn"
        type="submit"
        styling-mode="contained"
        :text="buttonLabel"
        @click="goToPatientForm"
      />

      <DxButton
        v-if="selectedRows.length > 0"
        class="delete-btn"
        type="danger"
        styling-mode="contained"
        text="Delete"
        @click="deleteSelectedPatients"
      />
    </div>

    <DxDataGrid
      ref="gridRef"
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
      @selection-changed="onSelectionChanged"
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
      <DxColumn dataField="medical_history" caption="Medical History" />

      <DxPaging :page-size="10" />
      <DxPager
        :show-page-size-selector="true"
        :allowed-page-sizes="[5, 10, 20]"
        :show-info="true"
        showNavigationButtons="true"
        visible="true"
        displayMode="full"
      />
      <DxFilterRow :visible="true" />
      <DxHeaderFilter :visible="true" />
      <DxSearchPanel :visible="true" :highlight-case-sensitive="false" />
      <DxColumnChooser :enabled="true" />
    </DxDataGrid>
  </div>
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
  font-size: large;
}

.additional-btn {
  background-color: #007bff;
  color: white;
  font-weight: 600;
  font-size: large;
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
