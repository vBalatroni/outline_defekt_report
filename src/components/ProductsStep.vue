<script setup>
import { defineProps, ref, computed } from 'vue';
import SectionHeader from './StepHeader.vue';
import Button from './Button.vue';
import Divider from './Divider.vue';
import InputField from './InputField.vue';

const showModal = ref(false);
const isBasicInfoValidated = ref(false);
const isSerialNumberVerified = ref(false);
const savedProducts = ref([]);
const editingProductIndex = ref(-1);
const currentProduct = ref(null);
const currentDefekt = ref(null);
const editingDefektIndex = ref(-1);

const props = defineProps({
    productData: {
        type: Object,
        required: true
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
        if (sectionKey !== 'basicInfo') {
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
    
    if (editingProductIndex.value >= 0) {
        savedProducts.value[editingProductIndex.value] = productToSave;
    } else {
        savedProducts.value.push(productToSave);
    }
    
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
    const productToEdit = savedProducts.value[index];
    currentProduct.value = JSON.parse(JSON.stringify(productToEdit));
    currentDefekt.value = initializeNewDefekt(); // Initialize defekt form
    editingProductIndex.value = index;
    isBasicInfoValidated.value = true;
    showModal.value = true;
};

const deleteProduct = (index) => {
    savedProducts.value.splice(index, 1);
};

const openNewProductModal = () => {
    currentProduct.value = initializeNewProduct();
    currentDefekt.value = initializeNewDefekt(); // Initialize defekt form
    isBasicInfoValidated.value = false;
    showModal.value = true;
};

const canAddDefekt = computed(() => {
    if (!currentDefekt.value) return false;

    // Check each section in the defekt
    for (const sectionKey in currentDefekt.value) {
        const section = currentDefekt.value[sectionKey];
        for (const fieldKey in section) {
            const field = section[fieldKey];
            if (field.isRequired && !field.value) {
                return false;
            }
        }
    }
    return true;
});
</script>
<template>
    <div class="products-step">
        <div class="products-wrapper">
            <SectionHeader title="Products" />
            
            <div v-if="savedProducts.length > 0" class="saved-products mb-5">
                <h3 class="section-header mb-4">Saved Products</h3>
                <div class="product-list">
                    <div v-for="(product, index) in savedProducts" :key="index" class="product-card">
                        <div class="product-info">
                            <h4>{{ product.basicInfo.model.value }}</h4>
                            <p>Serial Number: {{ product.basicInfo.serialNumber.value }}</p>
                            <p>Category: {{ product.basicInfo.category.value }}</p>
                        </div>
                        <div class="product-actions">
                            <Button :type="'secondary'" :text="'Edit'" @click="editProduct(index)" ></Button>
                            <Button :type="'primary'" :text="'Delete'" @click="deleteProduct(index)" ></Button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-button my-5 mx-auto text-center">
                <Button @click="openNewProductModal" :type="'primary'" :text="'Add product'"></Button>
            </div>
            <Divider/>
            <div class="button-group mx-auto justify-content-between">
                <Button :type="'secondary'" :text="'Back'" :isDisabled="false" @click="$emit('prev-step')"></Button>
                <Button :type="'primary'" :text="'Next'" :isDisabled="!allRequiredFieldsFilled" @click="$emit('next-step')"></Button>
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
                    <template v-if="!isBasicInfoValidated">
                        <h3 class="section-header">Basic Information</h3>
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
                        <!-- Defekt Form -->
                        <div v-for="(section, sectionKey) in currentDefekt" :key="sectionKey">
                            <h3 class="section-header">{{ sectionKey }}</h3>
                            <div class="input-list">
                                <div class="input-wrapper col-12 col-md-4" v-for="(field, fieldKey) in section" :key="fieldKey">
                                    <InputField 
                                        :type="field.type" 
                                        :label="field.label" 
                                        :isRequired="field.isRequired" 
                                        :id="field.id" 
                                        :options="field.options"
                                        v-model="field.value"
                                    />
                                </div>
                            </div>
                        </div>
                        <!-- Add/Update Defekt Button -->
                        <div class="text-center mt-4 mb-4">
                            <Button 
                                :type="'primary'" 
                                :text="editingDefektIndex >= 0 ? 'Update Defekt' : 'Add Defekt'" 
                                :isDisabled="!canAddDefekt"
                                @click="addDefekt"
                            />
                        </div>

                        <!-- List of Added Defekts -->
                        <div v-if="currentProduct.defekts?.length > 0" class="defekts-list">
                            <Divider class="mb-4" />
                            <h3 class="section-header">Added Defekts</h3>
                            <div class="defekt-card" v-for="(defekt, index) in currentProduct.defekts" :key="index">
                                <div class="defekt-info">
                                    <p><strong>Symptom:</strong> {{ defekt.symptomInfo.symptomFound.value }}</p>
                                    <p><strong>Area:</strong> {{ defekt.symptomInfo.symptomArea.value }}</p>
                                    <p><strong>Occurrence:</strong> {{ defekt.symptomInfo.symptomOccurrence.value }}</p>
                                </div>
                                <div class="defekt-actions">
                                    <Button :type="'secondary'" :text="'Edit'" @click="editDefekt(index)" />
                                    <Button :type="'primary'" :text="'Delete'" @click="deleteDefekt(index)" />
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
</style>