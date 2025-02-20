<script setup>
import { defineProps, ref, computed, watch, onBeforeUnmount, inject } from 'vue';
import SectionHeader from './StepHeader.vue';
import Button from './Button.vue';
import Divider from './Divider.vue';
import InputField from './InputField.vue';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { modelSymptomAreas, symptomsByArea } from '../data/productMapping';  // Add symptomsByArea import

const emit = defineEmits(['prev-step', 'next-step', 'step-validation', 'update:savedProducts']);

const showModal = ref(false);
const isBasicInfoValidated = ref(false);
const isSerialNumberVerified = ref(false);
const serialNumberLoading = ref(false);

const editingProductIndex = ref(-1);
const currentProduct = ref(null);
const currentDefekt = ref(null);
const editingDefektIndex = ref(-1);

const props = defineProps({
    productData: {
        type: Object,
        required: true
    },
    savedProducts: {
        type: Array,
        default: () => []
    },
    productToEdit: {
        type: Object,
        default: null
    }
});

const initializeNewProduct = () => {
    const product = JSON.parse(JSON.stringify(props.productData));
    product.defekts = [];
    return product;
};

// Add a computed property to get symptom areas for current model
const currentModelSymptomAreas = computed(() => {
    const currentModel = currentProduct.value?.basicInfo?.model?.value;
    console.log('Current model:', currentModel);
    console.log('Available areas:', modelSymptomAreas[currentModel]);
    return modelSymptomAreas[currentModel] || [];
});

const initializeNewDefekt = () => {
    const defekt = {};
    Object.keys(props.productData).forEach(sectionKey => {
        // Only exclude basicInfo and categoryConfigs
        if (sectionKey !== 'basicInfo' && sectionKey !== 'categoryConfigs') {
            defekt[sectionKey] = JSON.parse(JSON.stringify(props.productData[sectionKey]));
        }
    });
    
    // Set symptom areas for current model
    if (currentProduct.value?.basicInfo?.model?.value) {
        defekt.symptomInfo.symptomArea.options = [...currentModelSymptomAreas.value];
    }
    
    return defekt;
};

const clearForm = () => {
    currentProduct.value = initializeNewProduct();
    isBasicInfoValidated.value = false;
    showModal.value = false;
    editingProductIndex.value = -1;
    isSerialNumberVerified.value = false;
};

const clearDefektForm = () => {
    currentDefekt.value = initializeNewDefekt();
    editingDefektIndex.value = -1;
};

// Add debounce time constant
const SERIAL_NUMBER_DEBOUNCE = 800; // milliseconds

const updateDependentOptions = inject('updateDependentOptions');

const handleInputChange = (event) => {
    if (!currentProduct.value) return;

    if (event.id === 'category') {
        // Update model options when category changes
        updateDependentOptions(currentProduct.value);
    } else if (event.id === 'serialNumber') {
        clearTimeout(validationTimeout);
        if (event.value) {
            validationTimeout = setTimeout(() => {
                serialNumberLoading.value = true;
                validateSerialNumber(event.value);
            }, SERIAL_NUMBER_DEBOUNCE);
        }
    }
};

const basicInfoFieldsFilled = computed(() => {
    if (!currentProduct.value) return false;
    const { category, model, serialNumber } = currentProduct.value.basicInfo;
    return category.value && model.value && serialNumber.value;
});

let validationTimeout;
const checkSerialNumber = (serialNumber) => {
    if (currentProduct.value.basicInfo.category.value && 
        currentProduct.value.basicInfo.model.value) {
        validateSerialNumber(serialNumber);
    }
};

const validateSerialNumber = async (serialNumber) => {
    try {
        // Simulate API call with 1.5 second delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('Validating serial number:', serialNumber);
        const isValid = true;
        isBasicInfoValidated.value = isValid;
        isSerialNumberVerified.value = isValid;
    } catch (error) {
        console.error('Validation error:', error);
        isBasicInfoValidated.value = false;
        isSerialNumberVerified.value = false;
    } finally {
        serialNumberLoading.value = false;
    }
};

// Clean up timeout when component is destroyed
onBeforeUnmount(() => {
    if (validationTimeout) {
        clearTimeout(validationTimeout);
    }
});

const canSave = computed(() => {
    if (!currentProduct.value) return false;
    if (!isSerialNumberVerified.value) return false;
    
    if (editingProductIndex.value >= 0) return true;
    
    return basicInfoFieldsFilled.value && isSerialNumberVerified.value;
});

const saveData = () => {
    const productToSave = JSON.parse(JSON.stringify(currentProduct.value));
    const products = [...props.savedProducts];
    
    if (editingProductIndex.value >= 0) {
        products[editingProductIndex.value] = productToSave;
    } else {
        products.push(productToSave);
    }
    
    emit('update:savedProducts', products);
    clearForm();
};

const addDefekt = () => {
    const defektToSave = JSON.parse(JSON.stringify(currentDefekt.value));
    
    if (editingDefektIndex.value >= 0) {
        currentProduct.value.defekts[editingDefektIndex.value] = defektToSave;
    } else {
        if (!currentProduct.value.defekts) {
            currentProduct.value.defekts = [];
        }
        currentProduct.value.defekts.push(defektToSave);
    }
    
    clearDefektForm();
};

const editDefekt = (index) => {
    const defektToEdit = currentProduct.value.defekts[index];
    currentDefekt.value = JSON.parse(JSON.stringify(defektToEdit));
    editingDefektIndex.value = index;
};

const deleteDefekt = (index) => {
    currentProduct.value.defekts.splice(index, 1);
};

const editProduct = (index) => {
    const productToEdit = props.savedProducts[index];
    currentProduct.value = JSON.parse(JSON.stringify(productToEdit));
    currentDefekt.value = initializeNewDefekt(); // Initialize defekt form
    editingProductIndex.value = index;
    isBasicInfoValidated.value = true;
    showModal.value = true;
};

const deleteProduct = (index) => {
    const products = [...props.savedProducts];
    products.splice(index, 1);
    emit('update:savedProducts', products);
};

const openNewProductModal = () => {
    currentProduct.value = initializeNewProduct();
    currentDefekt.value = initializeNewDefekt();
    isBasicInfoValidated.value = false;
    showModal.value = true;
    
    // Debug log
    console.log('Initialized currentProduct:', currentProduct.value);
};

const canAddDefekt = computed(() => {
    if (!currentDefekt.value || !currentProduct.value?.basicInfo.category.value) return false;

    const visibleFields = getVisibleFields.value;
    if (!visibleFields) return false;

    // Check each section in the visible fields
    for (const sectionKey in visibleFields) {
        const fields = visibleFields[sectionKey];
        for (const fieldKey of fields) {
            const field = currentDefekt.value[sectionKey][fieldKey];
            if (field.isRequired && !field.value) {
                console.log(`Required field not filled: ${sectionKey}.${fieldKey}`);
                return false;
            }
        }
    }
    return true;
});

// Add debug watch for required fields
watch(() => currentDefekt.value, () => {
    if (currentDefekt.value && getVisibleFields.value) {
        console.log('Checking required fields:');
        for (const sectionKey in getVisibleFields.value) {
            const fields = getVisibleFields.value[sectionKey];
            fields.forEach(fieldKey => {
                const field = currentDefekt.value[sectionKey][fieldKey];
                if (field.isRequired) {
                    console.log(`${sectionKey}.${fieldKey}: ${field.value ? 'filled' : 'empty'}`);
                }
            });
        }
    }
}, { deep: true });

const getVisibleFields = computed(() => {
    if (!currentProduct.value?.basicInfo.category.value) return null;
    return props.productData.categoryConfigs[currentProduct.value.basicInfo.category.value]?.visibleFields || null;
});

const isFieldVisible = (sectionKey, fieldKey) => {
    const visibleFields = getVisibleFields.value;
    console.log('Visible Fields:', visibleFields);
    if (!visibleFields) return false;
    return visibleFields[sectionKey]?.includes(fieldKey);
};

// Initialize currentDefekt when category changes
watch(() => currentProduct.value?.basicInfo.category.value, (newCategory) => {
    if (currentProduct.value && newCategory) {
        updateDependentOptions(currentProduct.value);
    }
    if (newCategory && isBasicInfoValidated.value) {
        currentDefekt.value = initializeNewDefekt();
    }
}, { immediate: true });

// Watch for model changes to update symptom areas
watch(() => currentProduct.value?.basicInfo?.model?.value, (newModel) => {
    if (currentDefekt.value && newModel) {
        currentDefekt.value.symptomInfo.symptomArea.options = [...currentModelSymptomAreas.value];
        currentDefekt.value.symptomInfo.symptomArea.value = ''; // Reset selection
        currentDefekt.value.symptomInfo.symptomFound.value = ''; // Reset dependent field
        
        // Force reactivity update
        currentDefekt.value = { ...currentDefekt.value };
    }
});

// Add handler for symptom area changes
const handleSymptomAreaChange = (field) => {
    if (field.id === 'symptomArea' && currentDefekt.value) {
        const selectedArea = field.value;
        console.log('Selected symptom area:', selectedArea);
        
        // Update symptom found options based on selected area
        const symptoms = symptomsByArea[selectedArea] || [];
        console.log('Available symptoms:', symptoms);
        
        currentDefekt.value.symptomInfo.symptomFound.options = [...symptoms];
        currentDefekt.value.symptomInfo.symptomFound.value = ''; // Reset selection
        
        // Force reactivity update
        currentDefekt.value = { ...currentDefekt.value };
    }
};

// Add a debug watch to help troubleshoot
watch(() => currentDefekt.value, (newVal) => {
    console.log('Current Defekt:', newVal);
}, { deep: true });

watch(() => currentProduct.value?.basicInfo.category.value, (newVal) => {
    console.log('Selected Category:', newVal);
    console.log('Visible Fields:', getVisibleFields.value);
}, { immediate: true });

// Add a debug watch for currentProduct
watch(() => currentProduct.value?.basicInfo, (newVal) => {
    console.log('Current Product Basic Info:', newVal);
}, { deep: true });

// Add computed property for next button validation
const canProceedToNextStep = computed(() => {
    return props.savedProducts.length > 0;
});

// Watch savedProducts to emit step validation
watch(() => props.savedProducts.length, (newLength) => {
    emit('step-validation', newLength > 0);
}, { immediate: true });

// Watch for productToEdit changes to load product for editing
watch(() => props.productToEdit, (newVal) => {
    if (newVal) {
        currentProduct.value = JSON.parse(JSON.stringify(newVal));
        isBasicInfoValidated.value = true;
        showModal.value = true;
    }
}, { immediate: true });

// Reset validation when category or model changes
watch(() => [
    currentProduct.value?.basicInfo.category.value,
    currentProduct.value?.basicInfo.model.value
], () => {
    isBasicInfoValidated.value = false;
    isSerialNumberVerified.value = false;
}, { deep: true });

</script>
<template>
    <div class="products-step">
        <div class="products-wrapper">
            <SectionHeader title="Products" />
            


            <div class="modal-button my-5 mx-auto text-center">
                <Button @click="openNewProductModal" :type="'primary'" :text="'Add product'"></Button>
            </div>
            <Divider/>
            <div v-if="savedProducts.length > 0" class="saved-products mb-5">
                <h3 class="section-header mb-4">Saved Products</h3>
                <div class="product-list">
                    <div v-for="(product, index) in savedProducts" :key="index" class="product-card">
                        <div class="product-actions">
                            <i @click="editProduct(index)" class="bi bi-pencil"></i>
                            <i @click="deleteProduct(index)" class="bi bi-trash"></i>
                        </div>
                        <div class="product-info">
                            <h4>{{ product.basicInfo.model.value }}</h4>
                            <p>Serial Number: {{ product.basicInfo.serialNumber.value }}</p>
                            <p>Category: {{ product.basicInfo.category.value }}</p>
                        </div>
                       
                    </div>
                </div>
            </div>
            <div class="button-group mx-auto justify-content-between">
                <Button :type="'secondary'" :text="'Back'" :isDisabled="false" @click="$emit('prev-step')"></Button>
                <Button :type="'primary'" :text="'Next'" :isDisabled="!canProceedToNextStep" @click="$emit('next-step')"></Button>
            </div>
        </div>
    </div>
    <div v-if="showModal" class="modal custom-modal d-block" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="buttons-section mb-4">
                    <Button :type="'secondary'" :text="'Cancel'" @click="clearForm"></Button>
                    <Button 
                        :type="'primary'" 
                        :text="'Save'" 
                        :isDisabled="!canSave"
                        @click="saveData"
                    ></Button>
                </div>
                <div class="modal-header-custom">
                    <SectionHeader title="Report" />
                </div>
                <div class="modal-body-custom">
                    <template v-if="!isBasicInfoValidated && currentProduct">
                        <h3 class="section-header">Product</h3>
                        <div class="input-list">
                            <div class="input-wrapper col-12 col-md-4" v-for="(field, fieldKey) in currentProduct.basicInfo" :key="fieldKey">
                                <InputField 
                                    :type="field.type" 
                                    :label="field.label" 
                                    :isRequired="field.isRequired" 
                                    :id="field.id" 
                                    :options="field.options"
                                    :isLoading="field.id === 'serialNumber' && serialNumberLoading"
                                    v-model="field.value"
                                    @input-change="handleInputChange"
                                />
                            </div>
                        </div>
                    </template>
                    
                    <template v-else>
                        <!-- Product Summary Section -->
                        <div class="product-summary mb-4">
                            <h3 class="section-header">Product</h3>
                            <div class="product-info-box">
                                <div>
                                    <p><strong>Model:</strong> {{ currentProduct.basicInfo.model.value }}</p>
                                    <p><strong>Serial Number:</strong> {{ currentProduct.basicInfo.serialNumber.value }}</p>
                                </div>
                                <p class="change-product-link" @click="isBasicInfoValidated = false">Change Product</p>
                            </div>
                            <Divider />
                        </div>
                        
                        <!-- Defect Form Section -->
                        <div class="defect-form mb-4">
                            <h3 class="section-header">Defect</h3>
                            <div class="input-list">
                                <template v-if="currentDefekt && currentProduct?.basicInfo.category.value">
                                    <div 
                                        v-for="(field, fieldKey) in currentDefekt.symptomInfo" 
                                        :key="'symptom-' + fieldKey"
                                        v-show="isFieldVisible('symptomInfo', fieldKey)"
                                        class="input-wrapper col-12 col-md-4"
                                    >
                                        <InputField 
                                            :type="field.type" 
                                            :label="field.label" 
                                            :isRequired="field.isRequired" 
                                            :id="field.id" 
                                            :options="field.options"
                                            v-model="field.value"
                                            @input-change="handleSymptomAreaChange"
                                        />
                                    </div>

                                    <div 
                                        v-for="(field, fieldKey) in currentDefekt.technicalInfo" 
                                        :key="'technical-' + fieldKey"
                                        v-show="isFieldVisible('technicalInfo', fieldKey)"
                                        class="input-wrapper col-12 col-md-4"
                                    >
                                        <InputField 
                                            :type="field.type" 
                                            :label="field.label" 
                                            :isRequired="field.isRequired" 
                                            :id="field.id" 
                                            :options="field.options"
                                            v-model="field.value"
                                        />
                                    </div>

                                    <div 
                                        v-for="(field, fieldKey) in currentDefekt.serialNumbers" 
                                        :key="'serial-' + fieldKey"
                                        v-show="isFieldVisible('serialNumbers', fieldKey)"
                                        class="input-wrapper col-12 col-md-4"
                                    >
                                        <InputField 
                                            :type="field.type" 
                                            :label="field.label" 
                                            :isRequired="field.isRequired" 
                                            :id="field.id" 
                                            :options="field.options"
                                            v-model="field.value"
                                        />
                                    </div>

                                    <div 
                                        v-for="(field, fieldKey) in currentDefekt.versions" 
                                        :key="'version-' + fieldKey"
                                        v-show="isFieldVisible('versions', fieldKey)"
                                        class="input-wrapper col-12 col-md-4"
                                    >
                                        <InputField 
                                            :type="field.type" 
                                            :label="field.label" 
                                            :isRequired="field.isRequired" 
                                            :id="field.id" 
                                            :options="field.options"
                                            v-model="field.value"
                                        />
                                    </div>

                                    <div 
                                        v-for="(field, fieldKey) in currentDefekt.additionalInfo" 
                                        :key="'additional-' + fieldKey"
                                        v-show="isFieldVisible('additionalInfo', fieldKey)"
                                        class="input-wrapper col-12 col-md-4"
                                    >
                                        <InputField 
                                            :type="field.type" 
                                            :label="field.label" 
                                            :isRequired="field.isRequired" 
                                            :id="field.id" 
                                            :options="field.options"
                                            v-model="field.value"
                                        />
                                    </div>
                                </template>
                            </div>
                            <div class=" add-edit-button text-center mt-4">
                                <Button 
                                    :type="'primary'" 
                                    :text="editingDefektIndex >= 0 ? 'Update Defect' : 'Add Defect'" 
                                    :isDisabled="!canAddDefekt"
                                    @click="addDefekt"
                                />
                            </div>
                            <Divider />
                        </div>

                        <!-- Report Summary Section -->
                        <div class="report-summary">
                            <h3 class="section-header">Report Summary</h3>
                            <div v-if="currentProduct.defekts?.length > 0" class="defects-summary">
                                <div class="defekt-card" v-for="(defekt, index) in currentProduct.defekts" :key="index">
                                    <div class="defekt-actions">
                                        <i @click="editDefekt(index)" class="bi bi-pencil"></i>
                                        <i @click="deleteDefekt(index)" class="bi bi-trash"></i>
                                    </div>
                                    <div class="defekt-info">
                                        <p><strong>Symptom:</strong> {{ defekt.symptomInfo.symptomFound.value }}</p>
                                        <p><strong>Area:</strong> {{ defekt.symptomInfo.symptomArea.value }}</p>
                                        <p><strong>Occurrence:</strong> {{ defekt.symptomInfo.symptomOccurrence.value }}</p>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-center mt-4">
                                <p>No defects added yet</p>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>