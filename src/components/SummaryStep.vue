<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import SectionHeader from './StepHeader.vue';
import Button from './Button.vue';
import Divider from './Divider.vue';
import { logger } from '@/utils/logger';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Expose File for template
const FileConstructor = typeof File !== 'undefined' ? File : null;

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

// Helper to get sections and fields from a defect - preserve images properly
const getDefektSections = (defekt) => {
    if (!defekt) return [];
    
    // Deep clone preserving File objects and preview strings
    const plainDefekt = {};
    Object.keys(defekt).forEach(sectionName => {
        const section = defekt[sectionName];
        if (!section || typeof section !== 'object') return;
        
        plainDefekt[sectionName] = {};
        Object.keys(section).forEach(fieldKey => {
            const field = section[fieldKey];
            if (field) {
                // Preserve the field structure, especially preview for images
                plainDefekt[sectionName][fieldKey] = {
                    id: field.id || fieldKey,
                    label: field.label || fieldKey,
                    value: field.value,
                    preview: field.preview || null
                };
            }
        });
    });
    
    if (typeof plainDefekt !== 'object') return [];
    
    const sections = [];
    Object.keys(plainDefekt).forEach(sectionName => {
        const section = plainDefekt[sectionName];
        if (!section || typeof section !== 'object') return;
        
        const fields = [];
        Object.keys(section).forEach(fieldKey => {
            const field = section[fieldKey];
            // Include field if it has a value OR a preview (for images)
            if (field && (field.value !== null && field.value !== undefined && field.value !== '') || field.preview) {
                fields.push({
                    key: fieldKey,
                    id: field.id || fieldKey,
                    label: field.label || fieldKey,
                    value: field.value,
                    preview: field.preview
                });
            }
        });
        
        if (fields.length > 0) {
            sections.push({
                name: sectionName,
                fields: fields
            });
        }
    });
    
    logger.debug('getDefektSections result:', sections);
    return sections;
};

const openProductDetails = (product) => {
    // Deep clone preserving preview strings for images
    const cloneProduct = (prod) => {
        const cloned = {};
        Object.keys(prod).forEach(key => {
            if (key === 'defekts' && Array.isArray(prod[key])) {
                cloned[key] = prod[key].map(defekt => {
                    const clonedDefekt = {};
                    Object.keys(defekt).forEach(sectionName => {
                        const section = defekt[sectionName];
                        clonedDefekt[sectionName] = {};
                        Object.keys(section).forEach(fieldKey => {
                            const field = section[fieldKey];
                            // Preserve the entire field object including preview
                            clonedDefekt[sectionName][fieldKey] = {
                                id: field.id,
                                label: field.label,
                                value: field.value,
                                preview: field.preview || null
                            };
                        });
                    });
                    return clonedDefekt;
                });
            } else {
                cloned[key] = prod[key];
            }
        });
        return cloned;
    };
    
    selectedProduct.value = cloneProduct(product);
    logger.debug('Product details opened:', {
        product: selectedProduct.value,
        defektsCount: selectedProduct.value.defekts?.length
    });
    showProductModal.value = true;
};

const closeProductModal = () => {
    showProductModal.value = false;
    selectedProduct.value = null;
};

// Helper to check if a value is a File instance
const isFile = (value) => {
    return FileConstructor && value instanceof FileConstructor;
};

// Helper to get preview data from a field (similar to DynamicProductForm)
const getFieldPreviews = (field) => {
    if (!field) return [];
    
    const previews = [];
    
    // Check if field has a preview property
    if (field.preview) {
        if (typeof field.preview === 'string') {
            // String preview (data URL)
            if (field.preview.startsWith('data:image')) {
                previews.push({ previewType: 'image', url: field.preview, name: field.label || 'Image' });
            } else if (field.preview.startsWith('data:video')) {
                previews.push({ previewType: 'video', url: field.preview, name: field.label || 'Video' });
            }
        } else if (typeof field.preview === 'object' && field.preview.url) {
            // Object preview (like in DynamicProductForm)
            previews.push(field.preview);
        }
    }
    
    // Check if value is a File or array of Files
    const value = field.value;
    if (isFile(value)) {
        if (value.type.startsWith('image/')) {
            previews.push({ 
                previewType: 'image', 
                url: URL.createObjectURL(value), 
                name: value.name,
                size: value.size 
            });
        } else if (value.type.startsWith('video/')) {
            previews.push({ 
                previewType: 'video', 
                url: URL.createObjectURL(value), 
                name: value.name,
                size: value.size 
            });
        }
    } else if (Array.isArray(value) && value.length > 0) {
        value.forEach(item => {
            if (isFile(item)) {
                if (item.type.startsWith('image/')) {
                    previews.push({ 
                        previewType: 'image', 
                        url: URL.createObjectURL(item), 
                        name: item.name,
                        size: item.size 
                    });
                } else if (item.type.startsWith('video/')) {
                    previews.push({ 
                        previewType: 'video', 
                        url: URL.createObjectURL(item), 
                        name: item.name,
                        size: item.size 
                    });
                }
            } else if (typeof item === 'string' && (item.startsWith('data:image') || item.startsWith('data:video'))) {
                if (item.startsWith('data:image')) {
                    previews.push({ previewType: 'image', url: item, name: field.label || 'Image' });
                } else {
                    previews.push({ previewType: 'video', url: item, name: field.label || 'Video' });
                }
            } else if (item && item.preview) {
                previews.push(item);
            }
        });
    } else if (typeof value === 'string' && (value.startsWith('data:image') || value.startsWith('data:video'))) {
        if (value.startsWith('data:image')) {
            previews.push({ previewType: 'image', url: value, name: field.label || 'Image' });
        } else {
            previews.push({ previewType: 'video', url: value, name: field.label || 'Video' });
        }
    }
    
    return previews;
};

const formatFieldValue = (field) => {
    if (!field) return '';
    
    // If there's a preview, don't show the value as text
    const previews = getFieldPreviews(field);
    if (previews.length > 0) {
        return '';
    }
    
    const value = field.value;
    if (value === null || value === undefined || value === '') return '';

    if (isFile(value)) {
        return value.name;
    }

    if (Array.isArray(value)) {
        return value.map((item) => {
            if (isFile(item)) {
                return item.name;
            }
            if (typeof item === 'object' && item !== null) {
                return item.label || item.name || item.value || '';
            }
            return item;
        }).filter(item => item !== '').join(', ');
    }

    if (typeof value === 'object' && value !== null) {
        if (Object.keys(value).length === 0) {
            return '';
        }
        return value.label || value.value || '';
    }

    return String(value);
};

// Format file size (same as DynamicProductForm)
const formatSize = (bytes) => {
    if (!Number.isFinite(bytes)) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
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
                <div  v-for="(section, sectionKey) in generalData" :key="sectionKey" class="single-info-card mb-4 col-12 col-md-6">
                    <!-- FIX: Check for section.street.value instead of section.address.value -->
                    <template class="info-card-content" v-if="sectionKey !== 'otherReturnAddress' || (section.street && section.street.value)">
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
                                    <template v-for="(defekt, dIndex) in selectedProduct.defekts" :key="dIndex">
                                        <div class="defekt-detail-card">
                                            <h5 class="defekt-detail-header">Defect {{ dIndex + 1 }}</h5>
                                            <template v-for="section in getDefektSections(defekt)" :key="section.name">
                                                <div class="defekt-section">
                                                    <div v-for="field in section.fields" :key="field.key" class="defekt-field">
                                                        <span class="defekt-field-label">{{ field.label || field.key }}:</span>
                                                        <div class="defekt-field-value">
                                                            <!-- Use the same preview system as DynamicProductForm -->
                                                            <template v-if="getFieldPreviews(field).length > 0">
                                                                <div class="attachments-preview-grid">
                                                                    <div
                                                                        v-for="(preview, idx) in getFieldPreviews(field)"
                                                                        :key="idx"
                                                                        class="attachment-preview"
                                                                    >
                                                                        <template v-if="preview.previewType === 'image'">
                                                                            <img :src="preview.url" :alt="preview.name || field.label" class="detail-image-preview" />
                                                                        </template>
                                                                        <template v-else-if="preview.previewType === 'video'">
                                                                            <video :src="preview.url" controls muted playsinline class="detail-image-preview"></video>
                                                                        </template>
                                                                        <div v-if="preview.name || preview.size" class="attachment-meta">
                                                                            <span v-if="preview.name" class="attachment-name">{{ preview.name }}</span>
                                                                            <span v-if="preview.size" class="attachment-size">{{ formatSize(preview.size) }}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </template>
                                                            <!-- Default: show text value -->
                                                            <template v-else>
                                                                <span>{{ formatFieldValue(field) }}</span>
                                                            </template>
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                        </div>
                                    </template>
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
