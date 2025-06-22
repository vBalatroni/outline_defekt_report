# CSV Data Import for Product Mapping

This project includes a CSV reader component that allows you to import product mapping data from CSV files. The CSV reader is designed to work with the existing product mapping structure in your application.

## Features

- **Drag & Drop Upload**: Easy file upload with drag and drop support
- **CSV Parsing**: Robust CSV parsing with support for quoted fields
- **Data Validation**: Automatic validation of CSV structure and data integrity
- **Preview**: Preview parsed data before importing
- **Export**: Export current mapping data to CSV format
- **Sample Templates**: Download sample CSV templates

## CSV Format

The CSV file should have the following structure:

```csv
category,model,symptomAreas
Active_Speaker,DVS_10P_SP,"Amplifier,Audio_,Cabinet,Power,Speaker"
Passive_Speaker,AI_41,"Audio_,Cabinet,Speaker"
Processor,Newton_16,"Audio,Connections,Control_Software,Dante,Firmware,Mechanics,Power"
```

### Required Columns

- **category**: The product category (e.g., "Active_Speaker", "Passive_Speaker", "Processor")
- **model**: The specific model name (e.g., "DVS_10P_SP", "AI_41", "Newton_16")
- **symptomAreas**: Comma-separated list of symptom areas (quoted to handle commas)

### Optional Columns

You can add additional columns as needed, but the core functionality requires the three columns above.

## Usage

### 1. Access the CSV Demo

Navigate to `/csv-demo` in your application to access the CSV import demo page.

### 2. Upload CSV File

1. Click "Choose File" or drag and drop a CSV file onto the upload area
2. Click "Parse CSV" to process the file
3. Review the parsed data preview
4. Click "Import Mapping Data" to import the data

### 3. Download Sample CSV

Click "Download Sample CSV" to get a template file that you can use as a starting point.

### 4. Export Current Mapping

Click "Export Current Mapping to CSV" to export the current product mapping data to a CSV file.

## Components

### ProductMappingCsvReader.vue

The main CSV reader component that handles:
- File upload and parsing
- Data validation
- Preview display
- Import functionality

### csvUtils.js

Utility functions for:
- CSV text parsing
- Data validation
- Format conversion
- Export functionality

## Integration

The CSV reader emits a `mapping-imported` event with the parsed data:

```javascript
const handleMappingImported = (mappingData) => {
  // mappingData contains:
  // {
  //   categories: ['Active_Speaker', 'Passive_Speaker', ...],
  //   categoryModels: { 'Active_Speaker': ['DVS_10P_SP', ...], ... },
  //   modelSymptomAreas: { 'DVS_10P_SP': ['Amplifier', 'Audio_', ...], ... }
  // }
};
```

## Error Handling

The component includes comprehensive error handling for:
- Invalid CSV format
- Missing required columns
- Empty files
- Parsing errors

## Browser Support

The CSV reader uses modern browser APIs and supports:
- File API for file reading
- Drag and Drop API
- Blob API for file downloads

## Example CSV Files

### Basic Example
```csv
category,model,symptomAreas
Active_Speaker,DVS_10P_SP,"Amplifier,Audio_,Cabinet,Power,Speaker"
Active_Speaker,DVS_115_SW_iSP,"Amplifier,Audio_,Cabinet,Power,Speaker"
Passive_Speaker,AI_41,"Audio_,Cabinet,Speaker"
Processor,Newton_16,"Audio,Connections,Control_Software,Dante,Firmware,Mechanics,Power"
```

### Extended Example
```csv
category,model,symptomAreas,description,manufacturer
Active_Speaker,DVS_10P_SP,"Amplifier,Audio_,Cabinet,Power,Speaker","10-inch powered speaker","Company A"
Passive_Speaker,AI_41,"Audio_,Cabinet,Speaker","4-inch passive speaker","Company B"
Processor,Newton_16,"Audio,Connections,Control_Software,Dante,Firmware,Mechanics,Power","16-channel processor","Company C"
```

## Troubleshooting

### Common Issues

1. **CSV not parsing correctly**: Ensure the CSV has proper headers and the required columns
2. **Quoted fields not working**: Make sure symptom areas are properly quoted if they contain commas
3. **File upload not working**: Check that the file is a valid CSV file with .csv extension

### Validation Errors

The component will show specific error messages for:
- Missing required columns
- Empty data rows
- Invalid CSV format

## Development

To extend the CSV reader functionality:

1. Add new columns to the CSV format
2. Update the `csvToProductMapping` function in `csvUtils.js`
3. Modify the preview display in `ProductMappingCsvReader.vue`
4. Update validation rules as needed 