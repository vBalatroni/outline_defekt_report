<script setup>
import { defineProps } from 'vue';
import SectionHeader from './StepHeader.vue';
import Button from './Button.vue';
import Divider from './Divider.vue';
import 'bootstrap-icons/font/bootstrap-icons.css';

const props = defineProps({
    generalData: {
        type: Object,
        required: true
    },
    savedProducts: {
        type: Array,
        required: true
    }
});

const sectionTitles = {
    companyData: 'Company Information',
    freightForwarderData: 'Freight Forwarder',
    companyAddress: 'Company Address',
    otherReturnAddress: 'Return Address'
};

const editProduct = (index) => {
    emit('edit-product', index);
};

const deleteProduct = (index) => {
    emit('delete-product', index);
};

const emit = defineEmits(['prev-step', 'next-step', 'edit-product', 'delete-product']);
</script>

<template>
    <div class="summary-step">
        <div class="summary-wrapper">
            <SectionHeader title="Summary" />

            <!-- General Information Section -->
            <div class="recap-general-info" >
                <div  v-for="(section, sectionKey) in generalData" :key="sectionKey" class="mb-4 col-12 col-md-6">
                    <template v-if="sectionKey !== 'otherReturnAddress' || section.address.value">
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
                        <div class="product-info">
                            <h4>{{ product.basicInfo.model.value }}</h4>
                            <p>Serial Number: {{ product.basicInfo.serialNumber.value }}</p>
                            <p>Category: {{ product.basicInfo.category.value }}</p>
                            
                            <!-- Defects Summary -->
                            <div v-if="product.defekts?.length" class="defects-summary">
                                <p><strong>Defects:</strong></p>
                                <ul>
                                    <li v-for="(defekt, dIndex) in product.defekts" :key="dIndex">
                                        {{ defekt.symptomInfo.symptomFound.value }}
                                        ({{ defekt.symptomInfo.symptomArea.value }})
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="product-actions">
                            <i @click="editProduct(index)" class="bi bi-pencil"></i>
                            <i @click="deleteProduct(index)" class="bi bi-trash"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="button-group mx-auto justify-content-between">
                <Button :type="'secondary'" :text="'Back'" @click="$emit('prev-step')" />
                <Button :type="'primary'" :text="'Submit'" @click="$emit('next-step')" />
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

.defects-summary ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
}

.bi {
    font-size: 1.2rem;
}
</style>
