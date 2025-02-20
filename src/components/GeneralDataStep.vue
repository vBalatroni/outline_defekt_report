<script setup>
import { ref, defineProps, computed, watch } from 'vue';
import SectionHeader from './StepHeader.vue';
import InputField from './InputField.vue';
import Button from './Button.vue';
import Divider from './Divider.vue';

const props = defineProps({
    generalData: {
        type: Object,
        required: true
    }
});

const sectionTitles = {
    companyData: 'Company Information',
    freightForwarderData: 'Freight Forwarder',
    companyAddress: 'Company Address',
    otherReturnAddress: 'Return Address'
};

const showOtherReturnAddress = ref(false);

const allRequiredFieldsFilled = computed(() => {
    for (const sectionKey in props.generalData) {
        if (sectionKey === 'otherReturnAddress' && !showOtherReturnAddress.value) {
            continue;
        }
        const section = props.generalData[sectionKey];
        for (const fieldKey in section) {
            const field = section[fieldKey];
            if (field.isRequired && !field.value) {
                return false;
            }
        }
    }
    return true;
});


const handleInputChange = () => {
    console.log('Current Form Data:', JSON.stringify(props.generalData, null, 2));
};
</script>

<template>
    <div class="general-data-step">
        <div class="general-data-wrapper">
            <SectionHeader title="General Information" />
            <div v-for="(section, sectionKey) in generalData" :key="sectionKey">
                <template v-if="sectionKey !== 'otherReturnAddress'">
                    <h3 class="section-header">{{ sectionTitles[sectionKey] }}</h3>
                    <div class="input-list">
                        <div class="input-wrapper col-12 col-md-4" v-for="(field, fieldKey) in section" :key="fieldKey">
                            <InputField 
                                :type="field.type" 
                                :label="field.label" 
                                :isRequired="field.isRequired" 
                                :id="field.id" 
                                v-model="field.value"
                                @input-change="handleInputChange"

                            />
                        </div>
                    </div>
                    <div v-if="sectionKey === 'companyAddress'" class="form-check custom-checkbox d-flex mt-3">
                        <input v-model="showOtherReturnAddress" type="checkbox" class="form-check-input" id="showOtherReturnAddress" />
                        <label class="form-check-label" for="showOtherReturnAddress">Use a different return address</label>
                    </div>
                </template>
            </div>
            <div v-if="showOtherReturnAddress">
                <Divider class="mt-4" />

                <h3 class="section-header">{{ sectionTitles.otherReturnAddress }}</h3>
                <div class="input-list">
                    <div class="input-wrapper col-12 col-md-4" v-for="(field, fieldKey) in generalData.otherReturnAddress" :key="fieldKey">
                        <InputField 
                            :type="field.type" 
                            :label="field.label" 
                            :isRequired="field.isRequired" 
                            :id="field.id" 
                            v-model="field.value"
                            @input-change="handleInputChange"

                        />
                    </div>
                </div>
            </div>
            <div class="button-group mx-auto justify-content-between">
                <Button :type="'secondary'" :text="'Back'" :isDisabled="false" @click="$emit('prev-step')"></Button>
                <Button :type="'primary'" :text="'Next'" :isDisabled="!allRequiredFieldsFilled" @click="$emit('next-step')"></Button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Add any necessary styles here */
</style>