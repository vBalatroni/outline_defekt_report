<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import { generateSupplierHtml, generateCustomerHtml } from '@/utils/htmlGenerator';
import StepHeader from './StepHeader.vue';
import Button from './Button.vue';

const router = useRouter();
const store = useProductStore();
const emailStatus = ref('sending'); // sending, success, error
const emailError = ref('');

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

onMounted(async () => {
    const generalData = store.formState.generalData;
    const savedProducts = JSON.parse(localStorage.getItem('defekt_report_data') || '[]');

    // Resolve recipients & settings robustly
    const emailCfg = store.productMapping?.emailConfig || {};
    const testingRecipient = emailCfg.testingRecipient || '';
    const supplierRecipient = emailCfg.supplierRecipient || testingRecipient || '';
    // Resolve customer email robustly: prefer companyData.email, else first email-typed field anywhere, else testing
    const findFirstEmail = (gd) => {
        try {
            for (const sectionKey in gd || {}) {
                const section = gd[sectionKey];
                for (const fieldKey in section || {}) {
                    const f = section[fieldKey];
                    if ((f?.type === 'email' || /email/i.test(f?.id || '') || /email/i.test(f?.label || '')) && f?.value) {
                        return f.value;
                    }
                }
            }
        } catch (_) {}
        return '';
    };
    const customerRecipient = (generalData?.companyData?.email?.value) || findFirstEmail(generalData) || testingRecipient || '';

    if (savedProducts.length > 0) {
        let supplierHtml = generateSupplierHtml(generalData, savedProducts) || '';
        let customerHtml = generateCustomerHtml(generalData, savedProducts) || '';
        const fallbackIfEmpty = (str, title) => {
          const safe = String(str || '').trim();
          if (safe.length > 20) return safe;
          return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title></head><body><p>Defekt Report</p></body></html>`;
        };
        supplierHtml = fallbackIfEmpty(supplierHtml, 'Defekt Report');
        customerHtml = fallbackIfEmpty(customerHtml, 'Defekt Report');

        // Download copies only if enabled
        if (emailCfg.downloadHtmlReports !== false) {
          downloadFile('defekt_report_supplier.html', supplierHtml);
          downloadFile('defekt_report_customer.html', customerHtml);
        }
        
        // Send emails only if we have recipients
        if (supplierRecipient && customerRecipient) {
            try {
                const response = await fetch('/api/mail/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        supplierHtml,
                        customerHtml,
                        supplierRecipient,
                        customerRecipient,
                        testRecipient: testingRecipient || undefined
                    }),
                });

                const result = await response.json().catch(() => ({}));
                if (!response.ok || (result && result.success === false)) {
                    throw new Error(result?.message || 'Unknown error sending email.');
                }
                emailStatus.value = 'success';
            } catch (error) {
                console.error('Failed to send emails:', error);
                emailStatus.value = 'error';
                emailError.value = error.message;
            }
        } else {
            // No recipients configured; skip email send
            emailStatus.value = 'error';
            emailError.value = 'Missing recipients: configure emailConfig or customer email.';
        }

    } else {
        console.warn('No products found to generate report.');
        emailStatus.value = 'error';
        emailError.value = 'No product data found to create a report.';
    }

    // Save submission (use deep-clone to avoid Proxy serialization)
    try {
        const safeGeneralData = JSON.parse(JSON.stringify(generalData));
        await fetch('/api/submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: store.formState.sessionId,
                generalData: safeGeneralData,
                products: savedProducts,
                emailStatus: emailStatus.value
            })
        });
    } catch (e) {
        console.warn('Failed to save submission to DB:', e);
    }

    store.resetForm();
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
        <StepHeader title="Report Complete" />
        <div class="status-message">
            <div v-if="emailStatus === 'sending'" class="status-box info">
                <i class="bi bi-arrow-repeat spin-icon"></i>
                <p>Generating reports and sending emails...</p>
            </div>
            <div v-if="emailStatus === 'success'" class="status-box success">
                <i class="bi bi-check-circle-fill"></i>
                <p>Your report has been successfully submitted and sent via email.</p>
                <p class="secondary-text">HTML reports have also been downloaded to your device.</p>
            </div>
            <div v-if="emailStatus === 'error'" class="status-box error">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <p>There was an error processing your request.</p>
                <p class="secondary-text">{{ emailError }}</p>
                <p class="secondary-text">Your data has been downloaded as HTML files, but the email could not be sent. Please send them manually.</p>
            </div>
        </div>
        <div class="button-group">
            <Button @click="handleClose" :type="'secondary'" :text="'Close Page'"></Button>
            <Button @click="startAgain" :type="'primary'" :text="'Start New Report'"></Button>
        </div>
    </div>
</template>

<style scoped>
.success-step {
    max-width: 600px;
    margin: 4rem auto;
    padding: 2rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    text-align: center;
}

.status-message {
    margin: 2rem 0;
}

.status-box {
    padding: 1.5rem;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.status-box.info {
    background-color: #e9f5ff;
    border: 1px solid #b3d7ff;
    color: #004085;
}

.status-box.success {
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
}

.status-box.error {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
}

.status-box i {
    font-size: 3rem;
}

.spin-icon {
    animation: spin 2s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.status-box p {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 500;
}

.secondary-text {
    font-size: 0.9rem !important;
    font-weight: 400 !important;
    color: #6c757d;
}

.button-group {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
}
</style>
