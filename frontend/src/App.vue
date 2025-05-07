<template>
   <div class="container"> 
  <router-view></router-view>

   <!-- Navigation Tabs 
    <div class="tabs">
      <button :class="{ active: activeTab === 'form' }" @click="activeTab = 'form'">Fill Form</button>
      <button :class="{ active: activeTab === 'grid' }" @click="activeTab = 'grid'">View Records</button>
    </div>

    <div class="form-section" v-if="activeTab === 'form'">
      <h2>Info Form</h2>
      <form @submit.prevent="addEntry">
        <div class="dx-field">
          <label for="fullName">Full Name</label>
          <DxTextBox
            id="fullName"
            v-model:value="form.fullName"
            :is-valid="!fieldErrors.fullName"
            :validation-error="{ message: fieldErrors.fullName }"
            
            styling-mode="outlined"
          />
          <span class="error" v-if="fieldErrors.fullName">{{ fieldErrors.fullName }}</span>
        </div>

        <div class="dx-field">
          <label for="dob">Date of Birth</label>
          <DxDateBox
            id="dob"
            v-model:value="form.dob"
            :is-valid="!fieldErrors.dob"
            :validation-error="{ message: fieldErrors.dob }"
            
            type="date"
            display-format="yyyy-MM-dd"
            styling-mode="outlined"
          />
          <span class="error" v-if="fieldErrors.dob">{{ fieldErrors.dob }}</span>
        </div>

        <div class="dx-field">
          <label for="gender">Gender</label>
          <DxSelectBox
            id="gender"
            v-model:value="form.gender"
            :items="['Male', 'Female', 'Other']"
            :is-valid="!fieldErrors.gender"
            :validation-error="{ message: fieldErrors.gender }"
            
            styling-mode="outlined"
          />
          <span class="error" v-if="fieldErrors.gender">{{ fieldErrors.gender }}</span>
        </div>

        <div class="dx-field">
          <label for="contact">Contact Number</label>
          <DxTextBox
            id="contact"
            v-model:value="form.contact"
            :is-valid="!fieldErrors.contact"
            :validation-error="{ message: fieldErrors.contact }"
            
            styling-mode="outlined"
          />
          <span class="error" v-if="fieldErrors.contact">{{ fieldErrors.contact }}</span>
        </div>

        <div class="dx-field">
          <label for="email">Email</label>
          <DxTextBox
            id="email"
            v-model:value="form.email"
            :is-valid="!fieldErrors.email"
            :validation-error="{ message: fieldErrors.email }"
            
            styling-mode="outlined"
          />
          <span class="error" v-if="fieldErrors.email">{{ fieldErrors.email }}</span>
        </div>

        <div class="dx-field">
          <label for="address">Address</label>
          <DxTextArea
            id="address"
            v-model:value="form.address"
            :is-valid="!fieldErrors.address"
            :validation-error="{ message: fieldErrors.address }"
            
            :min-height="60"
            styling-mode="outlined"
          />
          <span class="error" v-if="fieldErrors.address">{{ fieldErrors.address }}</span>
        </div>

        <div class="dx-field">
          <label for="emergency">Emergency Contact</label>
          <DxTextBox
            id="emergency"
            v-model:value="form.emergency"
            :is-valid="!fieldErrors.emergency"
            :validation-error="{ message: fieldErrors.emergency }"
            
            styling-mode="outlined"
          />
          <span class="error" v-if="fieldErrors.emergency">{{ fieldErrors.emergency }}</span>
        </div>

        <div class="dx-field">
          <label for="bloodGroup">Blood Group</label>
          <DxSelectBox
            id="bloodGroup"
            v-model:value="form.bloodGroup"
            :items="['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']"
            :is-valid="!fieldErrors.bloodGroup"
            :validation-error="{ message: fieldErrors.bloodGroup }"
            
            styling-mode="outlined"
          />
          <span class="error" v-if="fieldErrors.bloodGroup">{{ fieldErrors.bloodGroup }}</span>
        </div>

        <div class="dx-field">
          <label for="medicalHistory">Medical History</label>
          <DxTextArea
            id="medicalHistory"
            v-model:value="form.medicalHistory"
            :is-valid="!fieldErrors.medicalHistory"
            :validation-error="{ message: fieldErrors.medicalHistory }"
            
            :min-height="80"
            styling-mode="outlined"
          />
          <span class="error" v-if="fieldErrors.medicalHistory">{{ fieldErrors.medicalHistory }}</span>
        </div>

        <button type="submit">Submit</button>
      </form>
    </div>

    <div class="grid-section" v-if="activeTab === 'grid'">
      <h2>Submitted Records</h2>
        :fields="filterFields"
        v-model:value="filterValue"
        :group-operations="['and', 'or']"
        style="margin-bottom: 20px;" /> 
       <button @click="applyFilter" style="margin-bottom: 20px;">Apply Filter</button>
      <DxDataGrid
        :data-source="entries"
        :show-borders="true"
        :column-auto-width="true"
        :allow-column-resizing="true"
        :row-alternation-enabled="true"
        :hover-state-enabled="true"
        :show-column-lines="true"
        :show-row-lines="true"
        :word-wrap-enabled="true"
        :selection="{ mode: 'multiple', showCheckBoxesMode: 'always' }"
        :filter-value="filterValue"
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
        <DxPager
          :show-page-size-selector="true"
          :allowed-page-sizes="[5,10, 20, 30]"
          :show-info="true"
          showNavigationButtons="true"
          visible="true"
          displayMode="full" />
        <DxPaging :page-size="10" />
        <DxFilterRow :visible="true" />
        <DxSearchPanel :visible="true" :highlight-case-sensitive="false" />
        <DxColumnChooser :enabled="true" />
      </DxDataGrid>
  </div> -->
</div>

</template>

<!-- <script setup>
import { ref, onMounted } from 'vue';
import DxTextBox from 'devextreme-vue/text-box';
import DxDateBox from 'devextreme-vue/date-box';
import DxSelectBox from 'devextreme-vue/select-box';
import DxTextArea from 'devextreme-vue/text-area';
// import DxFilterBuilder from 'devextreme-vue/filter-builder';
import DxDataGrid, { DxColumn, DxPaging, DxPager, DxFilterRow, DxSearchPanel, DxColumnChooser } from 'devextreme-vue/data-grid';
import { createResource } from 'frappe-ui';

const activeTab = ref('grid');
const form = ref({ fullName: '', dob: null, gender: '', contact: '', email: '', address: '', emergency: '', bloodGroup: '', medicalHistory: '' });
const entries = ref([]);
const fieldErrors = ref({});
const filterValue = ref(null);

// const filterFields = [
//   { dataField: 'full_name', dataType: 'string', caption: 'Full Name' },
//   { dataField: 'gender', dataType: 'string', caption: 'Gender' },
//   { dataField: 'blood_group', dataType: 'string', caption: 'Blood Group' },
//   { dataField: 'contact_number', dataType: 'string', caption: 'Contact Number' },
//   { dataField: 'email', dataType: 'string', caption: 'Email' },
//   { dataField: 'date_of_birth', dataType: 'date', caption: 'Date of Birth' }
// ];

const validateForm = () => {
  fieldErrors.value = {};
  const emailRegex = /\S+@\S+\.\S+/;
  const phoneRegex = /^\d{10}$/;

  const rules = {
    fullName: v => v.trim() !== '' && !/\d/.test(v) || 'Enter a valid name.',
    dob: v => v !== null || 'Select your date of birth.',
    gender: v => v !== '' || 'Select your gender.',
    contact: v => phoneRegex.test(v) || 'Enter a valid 10-digit contact number,',
    email: v => emailRegex.test(v) || 'Enter a valid email address.',
    address: v => v.trim() !== '' || 'Enter your address.',
    emergency: v => phoneRegex.test(v) || 'Enter a valid 10-digit emergency contact (no leading 0),',
    bloodGroup: v => v !== '' || 'Select your blood group.',
    medicalHistory: v => v.trim() !== '' || 'Enter your medical history.'
  };

  let isValid = true;
  for (const [field, rule] of Object.entries(rules)) {
    const result = rule(form.value[field]);
    if (result !== true) {
      fieldErrors.value[field] = result;
      isValid = false;
    }
  }
  return isValid;
};

const addEntry = async () => {
  if (!validateForm()) return;

  const dob = new Date(form.value.dob);
  const formattedDob = `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;
  const payload = { full_name: form.value.fullName, date_of_birth: formattedDob, gender: form.value.gender, contact_number: form.value.contact, email: form.value.email, address: form.value.address, emergency_contact: form.value.emergency, blood_group: form.value.bloodGroup, medical_history: form.value.medicalHistory };

  try {
    const response = await createResource({ url: 'hospital_management.api.patient.create_patient', params: { form_data: payload } }).submit();
    if (response?.status === 'success') {
      entries.value.push({ name: response.name || 'New', ...payload });
      Object.assign(form.value, { fullName: '', dob: null, gender: '', contact: '', email: '', address: '', emergency: '', bloodGroup: '', medicalHistory: '' });
      activeTab.value = 'grid';
    } else {
      alert(`Error: ${response.message || 'Something went wrong'}`);
    }
  } catch (error) {
    console.error('Error saving to Frappe:', error);
    alert('Failed to save data to Frappe server.');
  }
};

const applyFilter = () => {
  // grid automatically applies filterValue via binding
};

// onMounted(async () => {
//   try {
//     const response = await createResource({ url: 'hospital_management.api.patient.get_patient_data', method: 'GET' }).fetch();
//     entries.value = response || [];
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     entries.value = [];
//   }
// });
</script> -->

<!-- <style scoped>
.container {
  width: 100%;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  margin: 0 auto;
  padding: 30px;
  font-family: Arial, sans-serif;
  background-color: #f7f9fc;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  box-sizing: border-box;
}

.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  gap: 10px;
  width: 100%;
}

.tabs button {
  padding: 10px 20px;
  background-color: #e0e0e0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  flex: 1;
  max-width: 200px;
}

.tabs button.active {
  background-color: #1976d2;
  color: white;
}

.form-section {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.dx-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.dx-field label {
  margin-bottom: 6px;
  font-weight: 600;
}

button[type="submit"] {
  padding: 10px;
  background-color: #1976d2;
  color: white;
  font-size: 1em;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  width: 200px;
  align-self: center;
  margin-top: 20px;
}

button[type="submit"]:hover {
  background-color: #145ea8;

}

.error {
  color: red;
  font-size: 0.85em;
  margin-top: 4px;
}

.grid-section {
  width: 101%;
  overflow-x: auto;
  margin-top: 40px;
}

.grid {
  margin-top: 20px;
}
</style> -->
