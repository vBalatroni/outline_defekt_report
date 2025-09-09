<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import SectionHeader from './StepHeader.vue';
import Button from './Button.vue';
import Divider from './Divider.vue';
import 'bootstrap-icons/font/bootstrap-icons.css';

const store = useProductStore();
const router = useRouter();

const generalData = computed(() => store.formState.generalData);
const savedProducts = computed(() => store.formState.savedProducts);


const sectionTitles = {
    companyData: 'Company Information',
    freightForwarderData: 'Freight Forwarder',
    companyAddress: 'Company Address',
    otherReturnAddress: 'Return Address'
};

const editProduct = (index) => {
    // For now, just navigate back to the products step.
    // A more advanced implementation might pass the product index as a param.
    router.push({ name: 'step-products' });
    // We could also set an 'editingProductIndex' in the store here.
};

const deleteProduct = (index) => {
    // This function must now operate on the local data from localStorage
    savedProducts.value.splice(index, 1);
    // And update localStorage to persist the change
    localStorage.setItem('defekt_report_data', JSON.stringify(savedProducts.value));
};

const goToNext = () => {
    // This will be the final submission logic later. For now, just navigate.
    router.push({ name: 'step-success' });
};

const goToBack = () => {
    router.push({ name: 'step-products' });
};
</script>

<template>
    <div class="summary-step">
        <div class="summary-wrapper">
            <SectionHeader title="Summary" />

            <!-- General Information Section -->
            <div class="recap-general-info" >
                <div  v-for="(section, sectionKey) in generalData" :key="sectionKey" class="mb-4 col-12 col-md-6">
                    <!-- FIX: Check for section.street.value instead of section.address.value -->
                    <template v-if="sectionKey !== 'otherReturnAddress' || (section.street && section.street.value)">
                        <h3 class="section-header">{{ sectionTitles[sectionKey] }}</h3>
                        <div class="info-card">
                            <div v-for="(field, fieldKey) in section" :key="fieldKey" class="info-item">
                                <strong>{{ field.label }}:</strong> {{ field.value || '-' }}
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <Divider />

            <!-- Products Section -->
            <h3 class="section-header">Products</h3>
            <div v-if="savedProducts.length > 0" class="saved-products mb-5">
                <div class="product-list">
                    <div v-for="(product, index) in savedProducts" :key="index" class="product-card">
                        <div class="product-actions me-3">
                            <i @click="editProduct(index)" class="bi bi-pencil"></i>
                            <i @click="deleteProduct(index)" class="bi bi-trash"></i>
                        </div>
                        <div class="product-info">
                            <!-- Read the model name from the top-level property we saved -->
                            <h4>{{ product.modelName || 'N/A' }}</h4>
                            
                            <!-- Basic Info - rendered dynamically for safety -->
                            <div v-if="product.basicInfo">
                                <p v-if="product.basicInfo.serialNumber && product.basicInfo.serialNumber.value">
                                    Serial Number: {{ product.basicInfo.serialNumber.value }}
                                </p>
                                <p v-if="product.basicInfo.category && product.basicInfo.category.value">
                                    Category: {{ product.basicInfo.category.value }}
                                </p>
                            </div>
                            
                            <!-- Defects Summary -->
                            <div v-if="product.defekts?.length" class="defects-summary">
                                <p><strong>Defects:</strong></p>
                                <div class="defekt-details" v-for="(defekt, dIndex) in product.defekts" :key="dIndex">
                                    <h5 class="defekt-summary-header">Defect {{ dIndex + 1 }}</h5>
                                    <div v-for="(section, sectionName) in defekt" :key="sectionName">
                                        <div v-for="field in section" :key="field.id">
                                            <div class="defekt-summary-item" v-if="field.value">
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
                        
                    </div>
                </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="button-group mx-auto justify-content-between">
                <Button :type="'secondary'" :text="'Back'" @click="goToBack" />
                <Button :type="'primary'" :text="'Submit'" @click="goToNext" />
            </div>
        </div>
    </div>
</template>

<style scoped>

.recap-general-info {
    display: flex;
    flex-wrap: wrap;
}
.info-card {
    border: 2px solid var(--black-color);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.info-item {
    margin-bottom: 0.5rem;
}

.defects-summary {
    margin-top: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid #ddd;
}

.defekt-details {
    margin-top: 0.5rem;
    padding-left: 1rem;
    border-left: 2px solid #eee;
}

.defekt-summary-header {
    font-size: 1rem;
    font-weight: bold;
    margin-bottom: 0.25rem;
}

.defekt-summary-item {
    margin-bottom: 0.75rem;
}

.defects-summary ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
}

.bi {
    font-size: 1.2rem;
}
.summary-field-label {
    display: block;
    font-size: 0.9em;
    color: #555;
    font-weight: bold;
}
.summary-image-preview {
    max-width: 150px;
    max-height: 150px;
    border-radius: 4px;
    border: 1px solid #ddd;
    margin-top: 5px;
    object-fit: cover;
}
.summary-field-value {
    font-size: 1em;
}
</style>
