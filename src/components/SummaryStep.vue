<script setup>
import { computed, ref } from 'vue';
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

const showProductModal = ref(false);
const selectedProduct = ref(null);

const openProductDetails = (product) => {
    selectedProduct.value = product;
    console.log('Selected product:', product);
    console.log('Defekts:', product.defekts);
    if (product.defekts && product.defekts.length > 0) {
        console.log('First defekt:', product.defekts[0]);
        if (product.defekts[0]) {
            console.log('First defekt keys:', Object.keys(product.defekts[0]));
            Object.keys(product.defekts[0]).forEach(sectionName => {
                console.log(`Section ${sectionName}:`, product.defekts[0][sectionName]);
                if (product.defekts[0][sectionName]) {
                    console.log(`Section ${sectionName} keys:`, Object.keys(product.defekts[0][sectionName]));
                }
            });
        }
    }
    showProductModal.value = true;
};

const closeProductModal = () => {
    showProductModal.value = false;
    selectedProduct.value = null;
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

const editProduct = (index) => {
    router.push({ name: 'step-products' });
};

const deleteProduct = (index) => {
    savedProducts.value.splice(index, 1);
    localStorage.setItem('defekt_report_data', JSON.stringify(savedProducts.value));
};

const goToNext = () => {
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
                        <div class="product-actions">
                            <i @click="openProductDetails(product)" class="bi bi-eye" title="View details"></i>
                            <i @click="editProduct(index)" class="bi bi-pencil" title="Edit"></i>
                            <i @click="deleteProduct(index)" class="bi bi-trash" title="Delete"></i>
                        </div>
                        <div class="product-info">
                            <h4>{{ product.basicInfo?.model?.value || product.modelName || 'N/A' }}</h4>
                            <p v-if="product.basicInfo?.serialNumber?.value">
                                Serial Number: {{ product.basicInfo.serialNumber.value }}
                            </p>
                            <p v-if="product.basicInfo?.category?.value">
                                Category: {{ product.basicInfo.category.value }}
                            </p>
                            <p v-if="product.defekts?.length" class="defects-count">
                                <strong>Defects: {{ product.defekts.length }}</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Product Details Modal -->
            <div v-if="showProductModal && selectedProduct" class="modal custom-modal d-block" tabindex="-1" @click.self="closeProductModal">
                <div class="modal-dialog modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header-custom">
                            <h3 class="section-header mb-0">Product Details</h3>
                            <button type="button" class="btn-close" @click="closeProductModal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body-custom">
                            <!-- Basic Info -->
                            <div class="product-details-section" v-if="selectedProduct">
                                <h4 class="details-section-title">Basic Information</h4>
                                <div class="details-grid">
                                    <div class="detail-item" v-if="selectedProduct.basicInfo && selectedProduct.basicInfo.model && selectedProduct.basicInfo.model.value">
                                        <span class="detail-label">Model</span>
                                        <span class="detail-value">{{ selectedProduct.basicInfo.model.value }}</span>
                                    </div>
                                    <div class="detail-item" v-else-if="selectedProduct.modelName">
                                        <span class="detail-label">Model</span>
                                        <span class="detail-value">{{ selectedProduct.modelName }}</span>
                                    </div>
                                    <div class="detail-item" v-if="selectedProduct.basicInfo && selectedProduct.basicInfo.serialNumber && selectedProduct.basicInfo.serialNumber.value">
                                        <span class="detail-label">Serial Number</span>
                                        <span class="detail-value">{{ selectedProduct.basicInfo.serialNumber.value }}</span>
                                    </div>
                                    <div class="detail-item" v-if="selectedProduct.basicInfo && selectedProduct.basicInfo.category && selectedProduct.basicInfo.category.value">
                                        <span class="detail-label">Category</span>
                                        <span class="detail-value">{{ selectedProduct.basicInfo.category.value }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Defects -->
                            <div v-if="selectedProduct && selectedProduct.defekts && selectedProduct.defekts.length > 0" class="product-details-section">
                                <h4 class="details-section-title">Defects ({{ selectedProduct.defekts.length }})</h4>
                                <div class="defekts-grid">
                                    <div v-for="(defekt, dIndex) in selectedProduct.defekts" :key="dIndex" class="defekt-detail-card">
                                        <h5 class="defekt-detail-header">Defect {{ dIndex + 1 }}</h5>
                                        <template v-if="defekt && typeof defekt === 'object'">
                                            <div v-for="(section, sectionName) in defekt" :key="sectionName" class="defekt-section" v-if="section && typeof section === 'object'">
                                                <div v-for="field in section" :key="field && field.id ? field.id : sectionName + '-' + Math.random()" class="defekt-field" v-if="field && field.value !== null && field.value !== undefined && field.value !== '' && field.value !== false">
                                                    <span class="defekt-field-label">{{ field.label || 'Field' }}:</span>
                                                    <div class="defekt-field-value">
                                                        <template v-if="field.preview || (typeof field.value === 'string' && field.value.startsWith('data:image'))">
                                                            <img :src="field.preview || field.value" :alt="field.label || 'Image'" class="detail-image-preview" />
                                                        </template>
                                                        <template v-else-if="field && typeof field.value === 'object' && field.preview">
                                                            <img :src="field.preview" :alt="field.label || 'Image'" class="detail-image-preview" />
                                                        </template>
                                                        <template v-else>
                                                            <span>{{ formatFieldValue(field) }}</span>
                                                        </template>
                                                    </div>
                                                </div>
                                            </div>
                                        </template>
                                        <div v-else class="defekt-empty">
                                            <p class="text-muted">No details available</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else-if="selectedProduct" class="product-details-section">
                                <p class="text-muted">No defects added for this product.</p>
                            </div>
                        </div>
                        <div class="modal-footer-custom">
                            <Button :type="'primary'" :text="'Close'" @click="closeProductModal" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="button-group">
                <Button :type="'secondary'" :text="'Back'" @click="goToBack" />
                <Button :type="'primary'" :text="'Submit'" @click="goToNext" />
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Tutti gli stili sono ora gestiti dal CSS globale outline-inspired-css.css */
</style>
