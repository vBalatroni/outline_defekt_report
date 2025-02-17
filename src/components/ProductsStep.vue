<script setup>
import { defineProps, ref, computed, watch } from 'vue';
import SectionHeader from './StepHeader.vue';
import Button from './Button.vue';
import Divider from './Divider.vue';
import InputField from './InputField.vue';
import 'bootstrap-icons/font/bootstrap-icons.css';

const emit = defineEmits(['prev-step', 'next-step', 'step-validation', 'update:savedProducts']);

const showModal = ref(false);
const isBasicInfoValidated = ref(false);
const isSerialNumberVerified = ref(false);

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

const initializeNewDefekt = () => {
    const defekt = {};
    Object.keys(props.productData).forEach(sectionKey => {
        // Only exclude basicInfo and categoryConfigs
        if (sectionKey !== 'basicInfo' && sectionKey !== 'categoryConfigs') {
            defekt[sectionKey] = JSON.parse(JSON.stringify(props.productData[sectionKey]));
        }
    });
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

const handleInputChange = (event) => {
    if (event.id === 'serialNumber' && event.value) {
        checkSerialNumber(event.value);
    }
};

const basicInfoFieldsFilled = computed(() => {
    if (!currentProduct.value) return false;
    const { category, model, serialNumber } = currentProduct.value.basicInfo;
    return category.value && model.value && serialNumber.value;
});

let validationTimeout;
const checkSerialNumber = (serialNumber) => {
    clearTimeout(validationTimeout);
    validationTimeout = setTimeout(() => {
        if (currentProduct.value.basicInfo.category.value && 
            currentProduct.value.basicInfo.model.value) {
            validateSerialNumber(serialNumber);
        }
    }, 1000);
};

const validateSerialNumber = async (serialNumber) => {
    try {
        console.log('Validating serial number:', serialNumber);
        const isValid = true;
        isBasicInfoValidated.value = isValid;
        isSerialNumberVerified.value = isValid;
    } catch (error) {
        console.error('Validation error:', error);
        isBasicInfoValidated.value = false;
        isSerialNumberVerified.value = false;
    }
};

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
    if (newCategory && isBasicInfoValidated.value) {
        currentDefekt.value = initializeNewDefekt();
    }
}, { immediate: true });

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
                                <Button 
                                    :type="'secondary'" 
                                    :text="'Change Product'" 
                                    @click="isBasicInfoValidated = false"
                                />
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
.defekt-actions {
    display: flex;
    flex-direction: column;
    cursor: pointer;
    margin-right: 1rem;
}
.saved-products {
    margin-top: 2rem;
}

.product-list {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.product-card {
    border: 2px solid var(--black-color);
    padding: 1rem;
    min-width: 250px;
    background-color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.product-info h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: bold;
}

.product-info p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
}

.product-actions {
    display: flex;
    gap: 0.5rem;
}

.product-actions .button {
    padding: 8px 16px;
    font-size: 14px;
}

.defekts-list {
    margin-top: 2rem;
    border-top: 2px solid var(--black-color);
    padding-top: 1rem;
}

.defekt-card {
    border: 1px solid var(--black-color);
    padding: 1rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.defekt-actions {
    display: flex;
    gap: 0.5rem;
}

.defekt-info {
    flex: 1;
}

.defekt-info p {
    margin: 0.25rem 0;
}

.defekts-list {
    margin-top: 2rem;
}

.product-info-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 2px solid var(--black-color);
    margin: 1rem 0;
}

.product-info-box p {
    margin: 0.25rem 0;
}

.defect-form {
    margin: 2rem 0;
}

.report-summary {
    margin-top: 2rem;
}

.section-subheader {
    font-size: 20px;
    font-weight: bold;
    margin: 1rem 0;
}
</style>