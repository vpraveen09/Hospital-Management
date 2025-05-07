<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DxTextBox from 'devextreme-vue/text-box';
import DxDateBox from 'devextreme-vue/date-box';
import DxSelectBox from 'devextreme-vue/select-box';
import DxTagBox from 'devextreme-vue/tag-box';
import DxTextArea from 'devextreme-vue/text-area';
import notify from 'devextreme/ui/notify';
import { createResource } from 'frappe-ui';
import CustomStore from 'devextreme/data/custom_store';
import { watch } from 'vue';


const route = useRoute();
const router = useRouter();

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

// Gender store
const genderStore = new CustomStore({
  key: 'value',
  load: async (loadOptions) => {
    const { sort, skip, take, searchValue } = loadOptions;
    const orderBy = sort?.length
      ? sort.map((s) => `${s.selector} ${s.desc ? 'desc' : 'asc'}`).join(',')
      : 'name asc';

    const filters = [];
    if (searchValue) {
      filters.push(["name", "like", `%${searchValue}%`]);
    }

    const params = {
      doctype: 'Gender',
      fields: JSON.stringify(['name']),
      filters: JSON.stringify(filters),
      limit_start: skip || 0,
      limit_page_length: take || 5,
      order_by: orderBy
    };

    const resource = createResource({
      url: 'frappe.client.get_list',
      method: 'GET',
      params
    });

    const response = await resource.fetch();
    return response.map(g => ({ label: g.name, value: g.name }));
  },
  byKey: async (key) => {
    if (key) {
      const params = {
        doctype: 'Gender',
        fields: JSON.stringify(['name']),
        filters: JSON.stringify([['name', '=', key]]),
        limit_page_length: 1
      };

      const resource = createResource({
        url: 'frappe.client.get_list',
        method: 'GET',
        params
      });

      const response = await resource.fetch();
      if (response.length > 0) {
        return {
          label: response[0].name,
          value: response[0].name
        };
      } else {
        throw new Error(`Gender with key "${key}" not found.`);
      }
    }
  }
});

// Country and State lists
const countries = [
  { name: 'India', code: '+91-', flag: '🇮🇳', display: '🇮🇳 +91-' },
  { name: 'USA', code: '+1-', flag: '🇺🇸', display: '🇺🇸 +1-' },
  { name: 'UK', code: '+44-', flag: '🇬🇧', display: '🇬🇧 +44-' },
  { name: 'Canada', code: '+1-', flag: '🇨🇦', display: '🇨🇦 +1-' },
  { name: 'Germany', code: '+49-', flag: '🇩🇪', display: '🇩🇪 +49-' }
];

const states = {
  India: ['','Maharashtra', 'Gujarat', 'Karnataka','TamilNadu','Kerala'],
  USA: ['','California', 'Texas', 'New York'],
  UK: ['','England', 'Scotland', 'Wales'],
  Canada: ['','Ontario', 'Quebec', 'British Columbia'],
  Germany: ['','Bavaria', 'Berlin', 'Saxony']
};

const medicalHistoryOptions = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart Disease',
  'Allergy',
  'Thyroid',
  'Cancer',
  'None'
];

const form = ref({
  fullName: route.query.fullName || '',
  dob: route.query.dob || null,
  gender: route.query.gender || '',
  country: route.query.country || '',
  state: route.query.state || '',
  contactCode: route.query.contactCode || '+91-',
  contact: route.query.contact || '',
  email: route.query.email || '',
  address: route.query.address || '',
  emergencyCode: route.query.emergencyCode || '+91-',
  emergency: route.query.emergency || '',
  bloodGroup: route.query.bloodGroup || '',
  medicalHistory: route.query.medicalHistory ? route.query.medicalHistory.split(',') : []
});

const fieldErrors = ref({});

const validateForm = () => {
  fieldErrors.value = {};
  const emailRegex = /\S+@\S+\.\S+/;
  const phoneRegex = /^\d{10}$/;

  const rules = {
    fullName: v => v.trim() !== '' && !/\d/.test(v) || 'Full Name',
    dob: v => v !== null || 'Date of Birth',
    gender: v => v !== '' || 'Gender',
    country: v => v !== '' || 'Country',
    state: v => v !== '' || 'State',
    contact: v => phoneRegex.test(v) || 'Contact Number',
    email: v => emailRegex.test(v) || 'Email',
    address: v => v.trim() !== '' || 'Address',
    emergency: v => phoneRegex.test(v) || 'Emergency Contact',
    bloodGroup: v => v !== '' || 'Blood Group',
    medicalHistory: v => v.length > 0 || 'Medical History'
  };

  let isValid = true;
  let invalidFields = [];

  for (const [field, rule] of Object.entries(rules)) {
    const result = rule(form.value[field]);
    if (result !== true) {
      fieldErrors.value[field] = `Enter Your ${result}.`;
      invalidFields.push(result);
      isValid = false;
    }
  }

  if (!isValid) {
    if (invalidFields.length === 1) {
      showToast(`Please Fill The ${invalidFields[0]} field.`, 'warning', 3000);
    } else {
      showToast('Please Fill All Required Mandatory Fields.', 'warning', 3000);
    }
  }

  return isValid;
};

const addEntry = async () => {
  if (!validateForm()) return;

  const dob = new Date(form.value.dob);
  const formattedDob = `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;

  const payload = {
    full_name: form.value.fullName,
    date_of_birth: formattedDob,
    gender: form.value.gender,
    country: form.value.country,
    state: form.value.state,
    contact_number: `${form.value.contactCode}${form.value.contact}`,
    email: form.value.email,
    address: form.value.address,
    emergency_contact: `${form.value.emergencyCode}${form.value.emergency}`,
    blood_group: form.value.bloodGroup,
    medical_history: form.value.medicalHistory.join(', ')
  };

  try {
    let response;
    if (route.query.id) {
      response = await createResource({
        url: 'hospital_management.api.patient.update_patient',
        params: { id: route.query.id, form_data: payload }
      }).submit();

      if (response?.status === 'success') {
        showToast('Patient updated successfully!', 'success', 3000);
        router.push('/patient-List');
      } else {
        showToast(`Error: ${response.message || 'Update failed'}`, 'error', 3000);
      }
    } else {
      response = await createResource({
        url: 'hospital_management.api.patient.create_patient',
        params: { form_data: payload }
      }).submit();

      if (response?.status === 'success') {
        showToast('Patient added successfully!', 'success', 3000);
        router.push('/patient-List');
      } else {
        showToast(`Error: ${response.message || 'Creation failed'}`, 'error', 3000);
      }
    }
  } catch (error) {
    console.error('Error saving to Frappe:', error);
    showToast('Failed to save data to Frappe server.', 'error', 3000);
  }
};

Object.keys(form.value).forEach((key) => {
  watch(() => form.value[key], (newVal) => {
    if (fieldErrors.value[key]) {
      fieldErrors.value[key] = '';
    }
  });
});

</script>


<template>
  <div class="form-section">
    <h2>{{ route.query.id ? 'Edit Patient' : 'Add Patient' }}</h2>
    <form @submit.prevent="addEntry">
      
      <div class="dx-field">
        <label>Full Name</label>
        <DxTextBox
          v-model:value="form.fullName"
          styling-mode="outlined"
          :is-valid="!fieldErrors.fullName"
          :validation-error="{ message: fieldErrors.fullName }"
        />
        <span class="error" v-if="fieldErrors.fullName">{{ fieldErrors.fullName }}</span>
      </div>

      <div class="dx-field">
        <label>Date of Birth</label>
        <DxDateBox
          v-model:value="form.dob"
          type="date"
          display-format="yyyy-MM-dd"
          styling-mode="outlined"
          :is-valid="!fieldErrors.dob"
          :validation-error="{ message: fieldErrors.dob }"
        />
        <span class="error" v-if="fieldErrors.dob">{{ fieldErrors.dob }}</span>
      </div>

      <div class="dx-field">
        <label>Gender</label>
        <DxSelectBox
          :data-source="genderStore"
          v-model:value="form.gender"
          value-expr="value"
          display-expr="label"
          :search-enabled="true"
          :show-clear-button="true"
          placeholder=""
          styling-mode="outlined"
          :is-valid="!fieldErrors.gender"
          :validation-error="{ message: fieldErrors.gender }"
        />
        <span class="error" v-if="fieldErrors.gender">{{ fieldErrors.gender }}</span>
      </div>
      <div class="dx-field">
        <label>Country</label>
        <DxSelectBox
          v-model:value="form.country"
          :items="countries"
          display-expr="name"          
          value-expr="name"
          styling-mode="outlined"
          placeholder=""
          :search-enabled="true"
          :show-clear-button="true"
          :is-valid="!fieldErrors.country"
          :validation-error="{ message: fieldErrors.country }"
        />
        <span class="error" v-if="fieldErrors.country">{{ fieldErrors.country }}</span>
      </div>

      <div class="dx-field">
        <label>State</label>
        <DxSelectBox
          v-model:value="form.state"
          :items="states[form.country] || []"
          styling-mode="outlined"
          placeholder=""
          :search-enabled="true"
          :show-clear-button="true"
          :is-valid="!fieldErrors.state"
          :validation-error="{ message: fieldErrors.state }"
        />
        <span class="error" v-if="fieldErrors.state">{{ fieldErrors.state }}</span>
     </div>


      <div class="dx-field">
        <label>Contact Number</label>
        <div class="contact-wrapper">
          <DxSelectBox
            :items="countries"
            v-model:value="form.contactCode"
            display-expr="display"
            value-expr="code"
            class="code-box"
          />
          <DxTextBox
            v-model:value="form.contact"
            class="number-box"
            styling-mode="outlined"
            :is-valid="!fieldErrors.contact"
            :validation-error="{ message: fieldErrors.contact }"
          />
        </div>
        <span class="error" v-if="fieldErrors.contact">{{ fieldErrors.contact }}</span>
      </div>

      <div class="dx-field">
        <label>Email</label>
        <DxTextBox
          v-model:value="form.email"
          styling-mode="outlined"
          :is-valid="!fieldErrors.email"
          :validation-error="{ message: fieldErrors.email }"
        />
        <span class="error" v-if="fieldErrors.email">{{ fieldErrors.email }}</span>
      </div>

      <div class="dx-field">
        <label>Address</label>
        <DxTextArea
          v-model:value="form.address"
          :min-height="60"
          styling-mode="outlined"
          :is-valid="!fieldErrors.address"
          :validation-error="{ message: fieldErrors.address }"
        />
        <span class="error" v-if="fieldErrors.address">{{ fieldErrors.address }}</span>
      </div>

      <div class="dx-field">
        <label>Emergency Contact</label>
        <div class="contact-wrapper">
          <DxSelectBox
            :items="countries"
            v-model:value="form.emergencyCode"
            display-expr="display"
            value-expr="code"
            class="code-box"
          />
          <DxTextBox
            v-model:value="form.emergency"
            class="number-box"
            styling-mode="outlined"
            :is-valid="!fieldErrors.emergency"
            :validation-error="{ message: fieldErrors.emergency }"
          />
        </div>
        <span class="error" v-if="fieldErrors.emergency">{{ fieldErrors.emergency }}</span>
      </div>

      <div class="dx-field">
        <label>Blood Group</label>
        <DxSelectBox
          :items="['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']"
          v-model:value="form.bloodGroup"
          styling-mode="outlined"
          placeholder=""
          :is-valid="!fieldErrors.bloodGroup"
          :validation-error="{ message: fieldErrors.bloodGroup }"
        />
        <span class="error" v-if="fieldErrors.bloodGroup">{{ fieldErrors.bloodGroup }}</span>
      </div>

      <div class="dx-field">
        <label>Medical History</label>
        <DxTagBox
          v-model:value="form.medicalHistory"
          :items="medicalHistoryOptions"
          :show-selection-controls="true"
          :multiline="false"
          apply-value-mode="useButtons"
          placeholder=" "
          :search-enabled="true"
          styling-mode="outlined"
          :is-valid="!fieldErrors.medicalHistory"
          :validation-error="{ message: fieldErrors.medicalHistory }"
        />
        <span class="error" v-if="fieldErrors.medicalHistory">{{ fieldErrors.medicalHistory }}</span>
      </div>

      <button type="submit" class="submit-btn">
        {{ route.query.id ? 'Update' : 'Submit' }}
      </button>
    </form>
    <!-- <PatientList  ></PatientList> -->
  </div>
</template>

 
 
<style scoped>
.form-section {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 30px;
  background-color: #f7f9fc;
  border-radius: 10px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', sans-serif;
}
h2 {
  text-align: center;
  margin-bottom: 24px;
  font-size: 1.8em;
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
.contact-wrapper {
  display: flex;
  gap: 10px;
}
.code-box {
  width: 110px;
}
.number-box {
  flex: 1;
}
.error {
  color: red;
  font-size: 13px;
  margin-top: 5px;
}
.submit-btn {
  width: 20%;
  background: #007bff;
  color: white;
  padding: 10px;
  border: none;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  display: block;
  margin: 20px auto;
}
 
.submit-btn:hover {
  background: #0056b3;
}

</style>
 