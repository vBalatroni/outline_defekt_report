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

// Instead of a computed property from the store, we use a local ref
// that will be populated from localStorage.
const generalData = computed(() => store.formState.generalData); // General data can still come from the store for now
const savedProducts = ref([]);

onMounted(() => {
    // Per the user's request, load the product data from localStorage
    try {
        const storedData = localStorage.getItem('defekt_report_data');
        if (storedData) {
            savedProducts.value = JSON.parse(storedData);
            console.log('Loaded products from localStorage:', savedProducts.value);
        } else {
            console.warn('No product data found in localStorage.');
        }
    } catch (error) {
        console.error('Failed to load products from localStorage:', error);
    }
});


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
                                            <p class="defekt-summary-item" v-if="field.value">
                                                <strong>{{ field.label }}:</strong> {{ field.value }}
                                            </p>
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
    margin-bottom: 0.25rem;
    font-size: 0.9em;
}

.defects-summary ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
}

.bi {
    font-size: 1.2rem;
}
</style>
