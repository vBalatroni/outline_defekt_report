// Minimal helpers for email-friendly markup without CSS blocks
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const renderFieldRow = (label, value) => {
  if (value == null || value === '') return '';
  if (typeof value === 'string' && value.startsWith('data:image')) {
    return `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;font-weight:bold;vertical-align:top;width:35%;">${esc(label)}</td>
        <td style="padding:8px;border:1px solid #ddd;vertical-align:top;">
          <img src="${value}" alt="${esc(label)}" style="max-width:100%;height:auto;border:1px solid #ccc;" />
        </td>
      </tr>`;
  }
  return `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;font-weight:bold;vertical-align:top;width:35%;">${esc(label)}</td>
      <td style="padding:8px;border:1px solid #ddd;vertical-align:top;">${esc(value)}</td>
    </tr>`;
};

const renderField = (field) => {
  if (!field || field.value == null || field.value === '') return '';
  return renderFieldRow(field.label, field.value);
};

export const generateSupplierHtml = (generalData, savedProducts) => {
    let body = `<h2 style="margin:24px 0 8px;">General Information</h2>`;

    for (const sectionKey in generalData) {
        const sectionObj = generalData[sectionKey] || {};
        const sectionTitle = sectionObj.companyName?.label || sectionKey.replace(/([A-Z])/g, ' $1').trim();
        body += `<h3 style="margin:16px 0 6px;">${esc(sectionTitle)}</h3>`;
        let rows = '';
        for (const fieldKey in sectionObj) {
            rows += renderField(sectionObj[fieldKey]);
        }
        if (rows) body += `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${rows}</table>`;
    }

    body += `<h2 style="margin:24px 0 8px;">Products & Defects</h2>`;
    savedProducts.forEach((product, index) => {
        body += `<div style="margin:12px 0; padding:12px; border:1px solid #eee;">
          <h3 style="margin:0 0 6px;">Product ${index + 1}: ${esc(product.modelName)}</h3>`;
        if (product.basicInfo) {
            let rows = '';
            for (const fieldKey in product.basicInfo) {
                rows += renderField(product.basicInfo[fieldKey]);
            }
            if (rows) body += `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${rows}</table>`;
        }
        
        product.defekts.forEach((defekt, dIndex) => {
            body += `<div style="margin-top:10px; padding-left:10px; border-left:3px solid #004a99;"><h4 style="margin:0 0 6px;">Defect ${dIndex + 1}</h4>`;
            for (const sectionKey in defekt) {
                const sec = defekt[sectionKey] || {};
                let rows = '';
                for (const fieldKey in sec) {
                    rows += renderField(sec[fieldKey]);
                }
                if (rows) body += `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${rows}</table>`;
            }
            body += `</div>`;
        });
        body += `</div>`;
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta charset="UTF-8" />
            <title>Defekt Report - Supplier Details</title>
        </head>
        <body style="margin:0; padding:0; background:#f4f4f4;">
          <div style="display:none; max-height:0; overflow:hidden; opacity:0;">New Defekt Report</div>
          <div style="max-width:800px; margin:20px auto; background:#fff; border:1px solid #ddd; padding:20px; font-family: Arial, sans-serif; color:#333;">
            <div style="background:#004a99; color:#fff; padding:10px 20px; text-align:center;"><h1 style="margin:0;">Defekt Report</h1></div>
            ${body}
          </div>
        </body>
        </html>
    `;
};

export const generateCustomerHtml = (generalData, savedProducts) => {
    let body = `
        <p style="margin:6px 0;">Dear ${esc(generalData.companyData?.contactPerson?.value || 'Customer')},</p>
        <p style="margin:6px 0;">Thank you for submitting your Defekt Report. Here is a summary of the reported products:</p>
    `;

    savedProducts.forEach((product, index) => {
        body += `
            <div style="margin:12px 0; padding:12px; border:1px solid #eee;">
                <h3 style="margin:0 0 6px;">Product ${index + 1}: ${esc(product.modelName)}</h3>
                ${renderField(product.basicInfo?.serialNumber)}
                <p style="margin:6px 0;">We will process your request and get back to you shortly.</p>
            </div>
        `;
    });
     body += `<p style="margin:6px 0;">Best regards,<br/>The Support Team</p>`;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta charset="UTF-8" />
            <title>Your Defekt Report Summary</title>
        </head>
        <body style="margin:0; padding:0; background:#f4f4f4;">
          <div style="display:none; max-height:0; overflow:hidden; opacity:0;">Your Defekt Report Summary</div>
          <div style="max-width:800px; margin:20px auto; background:#fff; border:1px solid #ddd; padding:20px; font-family: Arial, sans-serif; color:#333;">
            <div style="background:#004a99; color:#fff; padding:10px 20px; text-align:center;"><h1 style="margin:0;">Report Summary</h1></div>
            ${body}
          </div>
        </body>
        </html>
    `;
}; 