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
    const savedProducts = store.formState.savedProducts || [];

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

        // Do not download local copies in produzione; lasciare opzionale in futuro
        
        // Utility: convert data URL to Blob
        const dataUrlToBlob = (dataUrl) => {
            try {
                const [meta, b64] = String(dataUrl).split(',');
                const match = /data:(.*?);base64/.exec(meta || '');
                const mime = (match && match[1]) || 'application/octet-stream';
                const binary = atob(b64 || '');
                const len = binary.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
                return { blob: new Blob([bytes], { type: mime }), mime };
            } catch (_) { return null; }
        };

        // Collect media files (from savedProducts base64 values) into FormData
        const buildFormData = () => {
            const fd = new FormData();
            fd.append('supplierHtml', supplierHtml);
            fd.append('customerHtml', customerHtml);
            if (store.formState.sessionId) fd.append('submissionId', store.formState.sessionId);
            if (supplierRecipient) fd.append('supplierRecipient', supplierRecipient);
            if (customerRecipient) fd.append('customerRecipient', customerRecipient);
            if (testingRecipient) fd.append('testRecipient', testingRecipient);

            try {
                (savedProducts || []).forEach((product, pIdx) => {
                    const defekts = product?.defekts || [];
                    defekts.forEach((sections, dIdx) => {
                        Object.keys(sections || {}).forEach((sectionKey) => {
                            const fields = sections[sectionKey] || {};
                            Object.keys(fields).forEach((fid) => {
                                const field = fields[fid];
                                const val = field?.value;
                                const baseName = field?.id || 'file';
                                // If value is a File object, attach directly
                                if (val && typeof val === 'object' && 'name' in val && 'size' in val) {
                                    const name = String(val.name || `${baseName}.bin`);
                                    fd.append('files', val, name);
                                } else if (typeof val === 'string' && val.startsWith('data:')) {
                                    const conv = dataUrlToBlob(val);
                                    if (conv && conv.blob) {
                                        const ext = (conv.mime.split('/')?.[1] || 'bin').replace(/[^a-zA-Z0-9]/g, '');
                                        const filename = `product${pIdx + 1}_defekt${dIdx + 1}_${baseName}.${ext}`;
                                        fd.append('files', conv.blob, filename);
                                    }
                                }
                            });
                        });
                    });
                });
            } catch (e) { console.warn('Failed collecting media files:', e); }
            return fd;
        };

        // Send emails only if we have recipients
        if (supplierRecipient && customerRecipient) {
            try {
                const fd = buildFormData();
                console.log('[Email] Invio email in corso...');
                const response = await fetch('/mail/send-multipart', {
                    method: 'POST',
                    body: fd,
                });

                console.log('[Email] Response status:', response.status, response.statusText);
                const result = await response.json().catch((e) => {
                    console.error('[Email] Errore parsing JSON:', e);
                    return { success: false, message: 'Errore risposta server' };
                });
                
                console.log('[Email] Response data:', result);
                
                if (!response.ok || (result && result.success === false)) {
                    const errorMsg = result?.message || result?.error || `HTTP ${response.status}: ${response.statusText}`;
                    console.error('[Email] Errore invio:', errorMsg, result);
                    throw new Error(errorMsg);
                }
                emailStatus.value = 'success';
                console.log('[Email] Email inviata con successo');
            } catch (error) {
                console.error('[Email] Errore completo:', error);
                emailStatus.value = 'error';
                emailError.value = error.message || 'Errore sconosciuto durante invio email';
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
        await fetch('/submissions', {
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
