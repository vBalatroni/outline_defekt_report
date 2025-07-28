<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import { generateSupplierHtml, generateCustomerHtml } from '@/utils/htmlGenerator';
import SectionHeader from './StepHeader.vue';
import Button from './Button.vue';

const router = useRouter();
const store = useProductStore();

const downloadFile = (filename, content) => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

onMounted(() => {
    // 1. Get data
    const generalData = store.formState.generalData;
    const savedProducts = JSON.parse(localStorage.getItem('defekt_report_data') || '[]');

    if (savedProducts.length > 0) {
        // 2. Generate HTML content
        const supplierHtml = generateSupplierHtml(generalData, savedProducts);
        const customerHtml = generateCustomerHtml(generalData, savedProducts);

        // 3. Trigger downloads
        downloadFile('defekt_report_supplier.html', supplierHtml);
        downloadFile('defekt_report_customer.html', customerHtml);
    } else {
        console.warn('No products found to generate report.');
    }

    // 4. Reset the form state
    store.resetForm();
    // Clear both localStorage and sessionStorage
    localStorage.removeItem('defekt_report_data');
    sessionStorage.removeItem('defekt_report_session_id');
});

const handleClose = () => {
    window.close();
};

const startAgain = () => {
    router.push({ name: 'step-confirmation' });
}
</script>

<template>
    <div class="success-step">
        <div class="success-wrapper">
            <SectionHeader title="Defekt Report Submitted" />
            <p class="success-message mt-4">
                Your report files are being downloaded. You can now close this page.
            </p>
            <div class="button-wrapper mt-5">
                <Button 
                    :type="'primary'" 
                    :text="'Close Page'" 
                    @click="handleClose"
                />
                <Button 
                    :type="'secondary'" 
                    :text="'Start Again'" 
                    @click="startAgain"
                    class="ms-3"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.success-step {
    margin-top: 2rem;
}

.success-message {
    font-size: 1.2rem;
}

.button-wrapper {
    display: flex;
    justify-content: flex-start;
}
</style>
