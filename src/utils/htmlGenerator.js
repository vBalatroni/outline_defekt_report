const generateStyles = () => `
<style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 800px; margin: 20px auto; background-color: #ffffff; border: 1px solid #dddddd; padding: 20px; }
    .header { background-color: #004a99; color: #ffffff; padding: 10px 20px; text-align: center; }
    h1, h2, h3 { color: #333333; }
    h2 { border-bottom: 2px solid #004a99; padding-bottom: 5px; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #dddddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .product-card { margin-bottom: 20px; border: 1px solid #eee; padding: 15px; }
    .defect-card { margin-top: 15px; padding-left: 15px; border-left: 3px solid #004a99; }
    .media-item img { max-width: 100%; height: auto; border: 1px solid #ccc; margin-top: 10px; }
</style>
`;

const renderField = (field) => {
    if (!field || !field.value) return '';
    if (typeof field.value === 'string' && field.value.startsWith('data:image')) {
        return `
            <tr>
                <th>${field.label}</th>
                <td class="media-item"><img src="${field.value}" alt="${field.label}" /></td>
            </tr>
        `;
    }
    return `
        <tr>
            <th>${field.label}</th>
            <td>${field.value}</td>
        </tr>
    `;
};

export const generateSupplierHtml = (generalData, savedProducts) => {
    let body = `<h2>General Information</h2>`;

    for (const sectionKey in generalData) {
        body += `<h3>${generalData[sectionKey].companyName?.label || sectionKey.replace(/([A-Z])/g, ' $1')}</h3><table>`;
        for (const fieldKey in generalData[sectionKey]) {
            body += renderField(generalData[sectionKey][fieldKey]);
        }
        body += `</table>`;
    }

    body += `<h2>Products & Defects</h2>`;
    savedProducts.forEach((product, index) => {
        body += `<div class="product-card"><h3>Product ${index + 1}: ${product.modelName}</h3>`;
        body += `<table>`;
        if (product.basicInfo) {
            for (const fieldKey in product.basicInfo) {
                body += renderField(product.basicInfo[fieldKey]);
            }
        }
        body += `</table>`;
        
        product.defekts.forEach((defekt, dIndex) => {
            body += `<div class="defect-card"><h4>Defect ${dIndex + 1}</h4>`;
            for (const sectionKey in defekt) {
                body += `<table>`;
                for (const fieldKey in defekt[sectionKey]) {
                    body += renderField(defekt[sectionKey][fieldKey]);
                }
                body += `</table>`;
            }
            body += `</div>`;
        });
        body += `</div>`;
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Defekt Report - Supplier Details</title>
            ${generateStyles()}
        </head>
        <body><div class="container"><div class="header"><h1>Defekt Report</h1></div>${body}</div></body>
        </html>
    `;
};

export const generateCustomerHtml = (generalData, savedProducts) => {
    let body = `
        <p>Dear ${generalData.companyData?.contactPerson?.value || 'Customer'},</p>
        <p>Thank you for submitting your Defekt Report. Here is a summary of the reported products:</p>
    `;

    savedProducts.forEach((product, index) => {
        body += `
            <div class="product-card">
                <h3>Product ${index + 1}: ${product.modelName}</h3>
                <table>
                    ${renderField(product.basicInfo.serialNumber)}
                </table>
                <p>We will process your request and get back to you shortly.</p>
            </div>
        `;
    });
     body += `<p>Best regards,<br/>The Support Team</p>`;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Your Defekt Report Summary</title>
            ${generateStyles()}
        </head>
        <body><div class="container"><div class="header"><h1>Report Summary</h1></div>${body}</div></body>
        </html>
    `;
}; 