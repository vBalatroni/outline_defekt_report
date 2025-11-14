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
import { fileToBase64 } from '@/utils/fileUtils';

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
const serialValidationEnabled = computed(() => Boolean(productStore.productMapping?.validationConfig?.serial?.enabled));
const serialDebugEnabled = computed(() => Boolean(productStore.productMapping?.validationConfig?.serial?.debugEnabled));

const cipherMap = Object.freeze({
    '1': 'B',
    '2': 'A',
    '3': 'R',
    '4': 'T',
    '5': 'I',
    '6': 'L',
    '7': 'O',
    '8': 'M',
    '9': 'E',
    '0': 'U'
});

const reverseCipherMap = Object.freeze(Object.keys(cipherMap).reduce((acc, digit) => {
    const letter = cipherMap[digit];
    acc[letter] = digit;
    return acc;
}, {}));

const dayLabels = {
    '1': 'Lunedi',
    '2': 'Martedi',
    '3': 'Mercoledi',
    '4': 'Giovedi',
    '5': 'Venerdi',
};

const decodeLetters = (letters) => {
    let digits = '';
    for (const ch of letters) {
        const digit = reverseCipherMap[ch];
        if (digit === undefined) {
            return null;
        }
        digits += digit;
    }
    return digits;
};

const validateSerialCode = (rawSerial) => {
    const serial = String(rawSerial || '').trim().toUpperCase();
    if (!serial) {
        return { valid: false, reason: '', breakdown: null };
    }
    if (serial.length < 6) {
        return { valid: false, reason: 'Formato troppo corto (minimo 6 caratteri).', breakdown: null };
    }

    const weekLetters = serial.slice(0, 2);
    const dayLetter = serial[2];
    const yearLetters = serial.slice(3, 5);
    const counter = serial.slice(5);
    if (!counter) {
        return { valid: false, reason: 'Il contatore finale è mancante.', breakdown: null };
    }

    const weekDigits = decodeLetters(weekLetters);
    if (!weekDigits || !/^\d{2}$/.test(weekDigits)) {
        return { valid: false, reason: 'Settimana non valida nella matricola.', breakdown: null };
    }
    const weekNum = Number(weekDigits);
    if (!Number.isInteger(weekNum) || weekNum < 1 || weekNum > 52) {
        return { valid: false, reason: 'La settimana deve essere compresa tra 01 e 52.', breakdown: null };
    }

    const dayDigit = decodeLetters(dayLetter);
    if (!dayDigit || !/^\d$/.test(dayDigit)) {
        return { valid: false, reason: 'Giorno della settimana non valido nella matricola.', breakdown: null };
    }
    const dayNum = Number(dayDigit);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 5) {
        return { valid: false, reason: 'Il giorno deve essere compreso tra 1 e 5 (giorni lavorativi).', breakdown: null };
    }

    const yearDigits = decodeLetters(yearLetters);
    if (!yearDigits || !/^\d{2}$/.test(yearDigits)) {
        return { valid: false, reason: 'Anno non valido nella matricola.', breakdown: null };
    }

    if (!/^\d+$/.test(counter)) {
        return { valid: false, reason: 'Il contatore finale deve essere composto da cifre numeriche.', breakdown: null };
    }

    return {
        valid: true,
        reason: '',
        breakdown: {
            week: weekDigits,
            day: dayDigit,
            year: yearDigits,
            counter,
        },
    };
};

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
                isRequired: true
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
    currentProductModel.value = '';
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
        currentProductModel.value = '';

    } else if (event.id === 'model') {
        if (event.value) {
            currentProductModel.value = event.value;
        } else {
            currentProductModel.value = '';
        }
        isBasicInfoValidated.value = false;
        currentDefekt.value = initializeNewDefekt(event.value || null);
        
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
    } else if (event.id === 'serialNumber') {
        if (typeof event.value === 'string') {
            currentProduct.value.basicInfo.serialNumber.value = event.value.toUpperCase();
        }
        isBasicInfoValidated.value = false;
    }
};

const basicInfoFieldsFilled = computed(() => {
    if (!currentProduct.value) return false;
    const { category, model, serialNumber } = currentProduct.value.basicInfo;
    return Boolean(category.value && model.value && serialNumber.value);
});

const serialValidationResult = computed(() => {
    if (!serialValidationEnabled.value) return { valid: true, reason: '', breakdown: null };
    const serial = currentProduct.value?.basicInfo?.serialNumber?.value || '';
    return validateSerialCode(serial);
});

const serialValidationSummary = computed(() => {
    if (!serialValidationEnabled.value || !basicInfoFieldsFilled.value) return '';
    return serialValidationResult.value.valid ? 'Seriale valido: si' : 'Seriale valido: no';
});

const serialValidationDetails = computed(() => {
    if (
        !serialValidationEnabled.value ||
        !serialDebugEnabled.value ||
        !basicInfoFieldsFilled.value
    ) {
        return '';
    }
    const { valid, reason, breakdown } = serialValidationResult.value;
    if (!valid) {
        return reason || 'Formato non valido.';
    }
    if (!breakdown) return '';
    const dayText = dayLabels[breakdown.day] ? `${breakdown.day} (${dayLabels[breakdown.day]})` : breakdown.day;
    return `Settimana ${breakdown.week}, Giorno ${dayText}, Anno ${breakdown.year}, Contatore ${breakdown.counter}`;
});

const canSave = computed(() => {
    if (!currentProduct.value) return false;
    if (!basicInfoFieldsFilled.value) return false;
    if (serialValidationEnabled.value && !serialValidationResult.value.valid) return false;
    if (editingProductIndex.value >= 0) return true;
    return isBasicInfoValidated.value;
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
                
                // Keep File objects; add preview for summaries
                newDefekt[sectionKey][fieldKey].value = fieldValue;
                if (typeof File !== 'undefined' && fieldValue instanceof File) {
                    try { newDefekt[sectionKey][fieldKey].preview = await fileToBase64(fieldValue); } catch {}
                }
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
    dynamicDefektData.value = {}; // Clear the form data (triggers previews reset in DynamicProductForm)
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
    currentProductModel.value = '';
    
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
    currentProductModel.value = currentProduct.value.basicInfo.model.value;
    
    // Use the existing model value from the saved product
    currentDefekt.value = initializeNewDefekt(currentProduct.value.basicInfo.model.value);
    showModal.value = true;
};

const proceedToDefektStep = () => {
    if (!basicInfoFieldsFilled.value) return;
    if (serialValidationEnabled.value && !serialValidationResult.value.valid) {
        return;
    }
    currentProductModel.value = currentProduct.value.basicInfo.model.value;
    currentDefekt.value = initializeNewDefekt(currentProductModel.value);
    isBasicInfoValidated.value = true;
};

const editBasicInfo = () => {
    isBasicInfoValidated.value = false;
    // keep current selections, ensure dynamic form resets
    currentDefekt.value = initializeNewDefekt(currentProduct.value.basicInfo.model.value);
    nextTick(() => {
        const topSection = document.querySelector('.modal-body-custom');
        if (topSection) topSection.scrollTop = 0;
    });
};

const formatFieldValue = (field) => {
    if (!field) return '';
    const value = field.value;
    if (value === null || value === undefined || value === '') return '';

    if (typeof File !== 'undefined' && value instanceof File) {
        return value.name;
    }

    if (Array.isArray(value)) {
        return value.map((item) => {
            if (typeof File !== 'undefined' && item instanceof File) {
                return item.name;
            }
            if (typeof item === 'object' && item !== null) {
                return item.label || item.name || item.value || JSON.stringify(item);
            }
            return item;
        }).join(', ');
    }

    if (typeof value === 'object') {
        return value.label || value.value || JSON.stringify(value);
    }

    return value;
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
            <div class="button-group">
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
                        <div
                            v-if="serialValidationEnabled && basicInfoFieldsFilled"
                            class="serial-validation-status"
                        >
                            <span
                                class="serial-summary"
                                :class="{ 'is-valid': serialValidationResult.valid, 'is-invalid': !serialValidationResult.valid }"
                            >
                                {{ serialValidationSummary }}
                            </span>
                            <p v-if="serialValidationDetails" class="serial-debug-details">
                                {{ serialValidationDetails }}
                            </p>
                        </div>
                        <div class="basic-info-actions text-end mt-3">
                            <Button
                                :type="'primary'"
                                :text="'Continue'"
                                :isDisabled="!basicInfoFieldsFilled || (serialValidationEnabled && !serialValidationResult.valid)"
                                @click="proceedToDefektStep"
                            />
                        </div>
                    </template>
                    
                    <template v-else>
                        <!-- Product Summary Section -->
                        <div class="product-summary mb-4">
                            <div class="product-summary-header">
                                <h3 class="section-header mb-0">Product Overview</h3>
                                <button class="link-button" type="button" @click="editBasicInfo">Change product</button>
                            </div>
                            <div class="product-info-box">
                                <div class="product-info-grid">
                                    <div class="product-info-item">
                                        <span class="info-label">Model</span>
                                        <span class="info-value">{{ currentProductModel }}</span>
                                    </div>
                                    <div class="product-info-item">
                                        <span class="info-label">Serial Number</span>
                                        <span class="info-value">{{ currentProduct.basicInfo.serialNumber.value }}</span>
                                    </div>
                                    <div class="product-info-item">
                                        <span class="info-label">Category</span>
                                        <span class="info-value">{{ currentProduct.basicInfo.category.value }}</span>
                                    </div>
                                </div>
                            </div>
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
                                                        <span class="summary-field-value">{{ formatFieldValue(field) }}</span>
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
/* Stili rimossi - ora gestiti dal CSS globale outline-inspired-css.css */

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

.serial-validation-status {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
}
.serial-summary {
    font-weight: 600;
    font-size: 0.95rem;
}
.serial-summary.is-valid {
    color: #1e7e34;
}
.serial-summary.is-invalid {
    color: #c0392b;
}
.serial-debug-details {
    font-size: 0.85rem;
    color: #34495e;
}

/* Tutti gli stili sono ora gestiti dal CSS globale outline-inspired-css.css */
</style>