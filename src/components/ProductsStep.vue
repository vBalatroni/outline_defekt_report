<script setup>
import { defineProps, ref, computed, watch, onBeforeUnmount, inject, nextTick, reactive } from 'vue';
import { useRouter } from 'vue-router';
import SectionHeader from './StepHeader.vue';
import Button from './Button.vue';
import Divider from './Divider.vue';
import InputField from './InputField.vue';
import DynamicProductForm from './DynamicProductForm.vue'; // Make sure this is imported
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useProductStore } from '@/stores/productStore';
// import { fileToBase64 } from '@/utils/fileUtils';

const emit = defineEmits(['step-validation']);

const router = useRouter();
const productStore = useProductStore();
const showModal = ref(false);
const isBasicInfoValidated = ref(false);

const editingProductIndex = ref(-1);
const currentProduct = ref(null);
const currentDefekt = ref(null);
const editingDefektIndex = ref(-1);
const dynamicDefektData = ref({});

// Add new ref for current product model
const currentProductModel = ref('');

const props = defineProps({
    // productData prop is no longer needed, we get it from the store.
    productToEdit: {
        type: Object,
        default: null
    }
});

// Use the store's state for saved products
const savedProducts = computed(() => productStore.formState.savedProducts);

const initializeNewProduct = () => {
    // The previous approach was incorrect because productMapping is a config file,
    // not a product template. We need to build the product object structure manually.
    
    const product = {
        basicInfo: {
            category: {
                id: 'category',
                label: 'Category',
                type: 'select',
                value: '',
                isRequired: true,
                options: productStore.categories || []
            },
            model: {
                id: 'model',
                label: 'Model',
                type: 'select',
                value: '',
                isRequired: true,
                options: [] // This will be populated based on category selection
            },
            serialNumber: {
                id: 'serialNumber',
                label: 'Serial Number',
                type: 'text',
                value: '',
                isRequired: false
            }
        },
        defekts: []
    };

    if (product.basicInfo?.category?.value) {
        updateDependentOptions(product);
    }
    
    return product;
};

const initializeNewDefekt = (model = null) => {
    const modelToUse = model || currentProductModel.value;
    const defektTemplate = {};

    if (modelToUse) {
        const fieldsForModel = productStore.getModelFields(modelToUse);
        fieldsForModel.forEach(fieldConfig => {
            if (!defektTemplate[fieldConfig.section]) {
                defektTemplate[fieldConfig.section] = {};
            }
            // By copying the entire field configuration and just adding a 'value' property,
            // we ensure that the final saved defect object contains all necessary data
            // for rendering summaries, including 'id' for keys and 'label' for display.
            defektTemplate[fieldConfig.section][fieldConfig.id] = {
                ...fieldConfig, // Copy all original properties (id, label, type, etc.)
                value: ''       // And add an empty value to be filled by the user
            };
        });
    }
    return defektTemplate;
};

const clearForm = () => {
    currentProduct.value = initializeNewProduct();
    isBasicInfoValidated.value = false;
    showModal.value = false;
    editingProductIndex.value = -1;
};

const clearDefektForm = () => {
    currentDefekt.value = initializeNewDefekt();
    editingDefektIndex.value = -1;
};

const updateDependentOptions = inject('updateDependentOptions');

const handleInputChange = (event) => {
    if (!currentProduct.value) return;

    if (event.id === 'category') {
        updateDependentOptions(currentProduct.value);
        currentProduct.value.basicInfo.model.value = '';
        isBasicInfoValidated.value = false;

    } else if (event.id === 'model') {
        if (event.value) {
            isBasicInfoValidated.value = true;
            currentProductModel.value = event.value;
            // Now that we have a model and are about to display the defect form,
            // we must initialize it with the correct fields for that model.
            currentDefekt.value = initializeNewDefekt(event.value);
        } else {
            isBasicInfoValidated.value = false;
        }
        
        // This logic is now handled by initializeNewDefekt and is redundant/error-prone.
        /*
        // Update symptom areas when model changes in basic info
        if (currentDefekt.value && event.value) {
            const modelFields = productStore.getModelFields(event.value);
            const symptomAreaField = modelFields.find(f => f.isSymptomArea);
            if (symptomAreaField && symptomAreaField.options) {
                const symptomSets = productStore.symptomSets || {};
                currentDefekt.value.symptomInfo.symptomArea.options = symptomAreaField.options
                    .map(setKey => symptomSets[setKey]?.label)
                    .filter(Boolean);
            }
            currentDefekt.value.symptomInfo.symptomArea.value = '';
            currentDefekt.value.symptomInfo.symptomFound.value = '';
        }
        */
    }
};

const basicInfoFieldsFilled = computed(() => {
    if (!currentProduct.value) return false;
    const { category, model } = currentProduct.value.basicInfo;
    return category.value && model.value;
});

const canSave = computed(() => {
    if (!currentProduct.value) return false;
    if (editingProductIndex.value >= 0) return true;
    return basicInfoFieldsFilled.value && isBasicInfoValidated.value;
});

const deepClonePreservingFiles = (val) => {
    if (val === null || typeof val !== 'object') return val;
    // Preserve File and Blob instances
    if (typeof File !== 'undefined' && val instanceof File) return val;
    if (typeof Blob !== 'undefined' && val instanceof Blob) return val;
    if (Array.isArray(val)) return val.map(deepClonePreservingFiles);
    const out = {};
    for (const k in val) out[k] = deepClonePreservingFiles(val[k]);
    return out;
};

const saveData = () => {
    const productToSave = deepClonePreservingFiles(currentProduct.value);
    
    // Ensure both modelName and basicInfo.model.value are set correctly
    productToSave.modelName = currentProductModel.value;
    productToSave.basicInfo.model.value = currentProductModel.value;
    
    if (editingProductIndex.value >= 0) {
        productStore.updateProduct(editingProductIndex.value, productToSave);
    } else {
        productStore.addProduct(productToSave);
    }
    
    clearForm();
};

const addDefekt = async () => { // keep async signature for future
    // This function is now much simpler.
    // It takes the flat data from dynamicDefektData and structures it.
    const newDefekt = initializeNewDefekt(currentProduct.value.basicInfo.model.value);
    
    // Populate the structured defekt object with the collected data
    for (const sectionKey in newDefekt) {
        for (const fieldKey in newDefekt[sectionKey]) {
            if (dynamicDefektData.value.hasOwnProperty(fieldKey)) {
                const fieldValue = dynamicDefektData.value[fieldKey];
                
                // Keep File objects as-is; will be sent via multipart at submit time
                newDefekt[sectionKey][fieldKey].value = fieldValue;
            }
        }
    }

    if (editingDefektIndex.value >= 0) {
        currentProduct.value.defekts[editingDefektIndex.value] = newDefekt;
    } else {
        if (!currentProduct.value.defekts) {
            currentProduct.value.defekts = [];
        }
        currentProduct.value.defekts.push(newDefekt);
    }
    
    editingDefektIndex.value = -1;
    dynamicDefektData.value = {}; // Clear the form data
    // Clear file inputs preview by resetting the form fields in the dynamic form
    try {
      const inputs = document.querySelectorAll('input[type="file"]');
      inputs.forEach((inp) => { inp.value = ''; });
    } catch {}
};


const editDefekt = (index) => {
    const defektToEdit = currentProduct.value.defekts[index];
    const newDynamicData = {};
    
    Object.keys(defektToEdit).forEach(sectionKey => {
        Object.keys(defektToEdit[sectionKey]).forEach(fieldKey => {
            newDynamicData[fieldKey] = defektToEdit[sectionKey][fieldKey].value;
        });
    });

    dynamicDefektData.value = newDynamicData;
    editingDefektIndex.value = index;
    
    // Scroll to the form
    nextTick(() => {
        const formElement = document.querySelector('.defect-form');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
};

const deleteDefekt = (index) => {
    currentProduct.value.defekts.splice(index, 1);
};

const deleteProduct = (index) => {
    productStore.deleteProduct(index);
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

    // Check each section in the visible fields
    for (const sectionKey in currentDefekt.value) {
        const fields = currentDefekt.value[sectionKey];
        for (const fieldKey of Object.keys(fields)) {
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
    if (currentDefekt.value) {
        console.log('Checking required fields:');
        for (const sectionKey in currentDefekt.value) {
            const fields = currentDefekt.value[sectionKey];
            Object.keys(fields).forEach(fieldKey => {
                const field = currentDefekt.value[sectionKey][fieldKey];
                if (field.isRequired) {
                    console.log(`${sectionKey}.${fieldKey}: ${field.value ? 'filled' : 'empty'}`);
                }
            });
        }
    }
}, { deep: true });

// Initialize currentDefekt when category changes
watch(() => currentProduct.value?.basicInfo.category.value, (newCategory) => {
    if (currentProduct.value && newCategory) {
        updateDependentOptions(currentProduct.value);
    }
    if (newCategory && isBasicInfoValidated.value) {
        currentDefekt.value = initializeNewDefekt();
    }
}, { immediate: true });

// Add a debug watch for currentProduct
watch(() => currentProduct.value?.basicInfo, (newVal) => {
    console.log('Current Product Basic Info:', newVal);
}, { deep: true });

// Add computed property for next button validation
const canProceedToNextStep = computed(() => {
    return savedProducts.value.length > 0;
});

// Watch savedProducts to emit step validation
watch(() => savedProducts.value.length, (newLength) => {
    emit('step-validation', newLength > 0);
}, { immediate: true });

// Watch for productToEdit changes to load product for editing
watch(() => props.productToEdit, (newVal) => {
    if (newVal) {
        const productCopy = JSON.parse(JSON.stringify(newVal));
        if (productCopy.basicInfo?.category?.value) {
            updateDependentOptions(productCopy);
        }
        currentProduct.value = productCopy;
        isBasicInfoValidated.value = true;
        currentDefekt.value = initializeNewDefekt();
        showModal.value = true;
    }
}, { immediate: true });

// Update editProduct function with more logging
// Modify editProduct function to use stored model name
const editProduct = (index) => {
    const originalProduct = savedProducts.value[index];
    
    // Set validation flags
    isBasicInfoValidated.value = true;
    editingProductIndex.value = index;
    
    // Set the current product
    currentProduct.value = deepClonePreservingFiles(originalProduct);
    
    // Use the existing model value from the saved product
    currentDefekt.value = initializeNewDefekt(currentProduct.value.basicInfo.model.value);
    showModal.value = true;
};

const goToNext = () => {
    // Do not persist File objects to localStorage; proceed to summary
    router.push({ name: 'step-summary' });
};

const goToBack = () => {
    router.push({ name: 'step-general-data' });
};

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
                <Button :type="'secondary'" :text="'Back'" :isDisabled="false" @click="goToBack"></Button>
                <Button :type="'primary'" :text="'Next'" :isDisabled="!canProceedToNextStep" @click="goToNext"></Button>
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
                    <template v-if="!isBasicInfoValidated && editingProductIndex === -1">
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
                                    <p><strong>Model:</strong> {{ currentProductModel }}</p>
                                    <p><strong>Serial Number:</strong> {{ currentProduct.basicInfo.serialNumber.value }}</p>
                                    <p><strong>Category:</strong> {{ currentProduct.basicInfo.category.value }}</p>
                                </div>
                                <!-- Remove the change product link -->
                            </div>
                            <Divider />
                        </div>
                        
                        <!-- Defect Form Section -->
                        <div class="defect-form mb-4">
                            <h3 class="section-header">Defect</h3>
                            
                            <DynamicProductForm 
                                v-if="currentProduct?.basicInfo.model.value"
                                :productCategory="currentProduct.basicInfo.category.value"
                                :productModel="currentProduct.basicInfo.model.value"
                                v-model:modelValue="dynamicDefektData"
                            />

                            <div class=" add-edit-button text-center mt-4">
                                <Button 
                                    :type="'primary'" 
                                    :text="editingDefektIndex >= 0 ? 'Update Defect' : 'Add Defect'" 
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
                                        <div v-for="(section, sectionName) in defekt" :key="sectionName">
                                            <div v-for="field in section" :key="field.id">
                                                <div v-if="field.value" class="summary-field">
                                                    <strong class="summary-field-label">{{ field.label }}:</strong>
                                                    <template v-if="typeof field.value === 'string' && field.value.startsWith('data:image')">
                                                        <img :src="field.value" :alt="field.label" class="summary-image-preview" />
                                                    </template>
                                                    <template v-else>
                                                        <span class="summary-field-value">{{ field.value }}</span>
                                                    </template>
                                                </div>
                                            </div>
                                        </div>
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
.products-step {
    background-color: #f9f9f9;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.products-wrapper {
    max-width: 800px;
    margin: 0 auto;
}

.modal-button {
    margin-top: 2rem;
}

.saved-products {
    margin-top: 2rem;
}

.product-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    background-color: #f9f9f9;
}

.product-actions {
    display: flex;
    gap: 0.5rem;
}

.product-info {
    flex-grow: 1;
    margin-left: 1rem;
}

.custom-modal {
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1050;
}

.modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.buttons-section {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.modal-header-custom {
    margin-bottom: 1.5rem;
}

.modal-body-custom {
    max-height: 60vh;
    overflow-y: auto;
}

.product-summary {
    padding: 1.5rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    background-color: #fafafa;
}

.product-info-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.defekt-form {
    padding: 1.5rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    background-color: #fafafa;
}

.report-summary {
    padding: 1.5rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #fafafa;
}

.defekt-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    background-color: #f9f9f9;
}

.defekt-actions {
    display: flex;
    gap: 0.5rem;
}

.defekt-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    background-color: #f9f9f9;
}

.defekt-actions {
    display: flex;
    gap: 0.5rem;
}

.defekt-form {
    padding: 1.5rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    background-color: #fafafa;
}

.modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.summary-field {
    margin-bottom: 0.75rem;
}
.summary-field-label {
    display: block;
    font-size: 0.9em;
    color: #555;
}
.summary-image-preview {
    max-width: 100px;
    max-height: 100px;
    border-radius: 4px;
    border: 1px solid #ddd;
    margin-top: 5px;
    object-fit: cover;
}
.summary-field-value {
    font-size: 1em;
}
</style>