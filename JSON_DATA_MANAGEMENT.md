# JSON Data Management System

This application now uses a JSON-based data management system that allows you to easily update product data without modifying code.

## How It Works

### 1. Data Source
- Product data is loaded from `src/assets/productData.json`
- The store automatically imports this JSON file on startup
- All product categories, models, and symptom areas are managed through this file

### 2. Workflow for Data Updates

#### Option A: Direct File Replacement (Recommended)
1. **Export current data**: Use the "Export to JSON" button in the JSON Configuration Manager
2. **Modify the data**: Edit the exported JSON file with your changes
3. **Replace the file**: Save the modified JSON as `src/assets/productData.json`
4. **Reload the application**: The changes will be automatically loaded

#### Option B: Using the Management Interface
1. **Make changes**: Use the Product Category Manager to modify data
2. **Export the changes**: Use "Export to JSON" to download the updated data
3. **Replace the file**: Save the exported JSON as `src/assets/productData.json`
4. **Reload**: Use "Reload from JSON" to apply the changes

### 3. JSON File Structure

The `productData.json` file contains the following structure:

```json
{
  "categories": ["Active Speaker", "Passive Speaker", "Processor", ...],
  "categoryModels": {
    "Active Speaker": ["DVS_10P_SP", "DVS_115_SW_iSP", ...],
    "Passive Speaker": ["AI_41", "AI_81", ...],
    ...
  },
  "modelSymptomAreas": {
    "DVS_10P_SP": ["Amplifier", "Audio_", "Cabinet", "Power", "Speaker__"],
    "AI_41": ["Audio_", "Cabinet", "Speaker__"],
    ...
  },
  "symptomsByArea": {
    "Audio": ["Audio channel on protection", "Audio level problem", ...],
    "Power": ["Can't power up", "Keep restarting", ...],
    ...
  },
  "mainVoltageTypes": ["Single_phase", "Bi_phase", ...],
  "mainVoltageRanges": {
    "Single_phase": ["<100VAC", "200-240V"],
    ...
  },
  "outputLoadOptions": ["2 Ohm", "4 Ohm", "8 Ohm", ...],
  "loadConnectionModes": ["Single ended", "Bridged", "Parallel"],
  "symptomOccurrences": ["After a while", "Constantly", ...],
  "installationTypes": ["Airport", "Rail Station", ...],
  "voltageTypes": {
    "Active Speaker": ["Single_phase", "Bi_phase"],
    ...
  },
  "voltageRangesByType": {
    "Single_phase": ["<100VAC", "200-240V"],
    ...
  }
}
```

### 4. Available Actions

#### Reload from JSON
- Loads the latest data from `src/assets/productData.json`
- Clears any custom configurations from browser storage
- Useful when you've updated the JSON file

#### Export to JSON
- Downloads current data as a JSON file
- Includes all modifications made through the management interface
- Perfect for backing up or transferring data

#### Export Configuration
- Downloads complete configuration (form config + product data)
- Useful for full system backup

#### Import Configuration
- Loads configuration from a JSON file
- Supports both form configuration and product data
- Useful for restoring from backup

#### Reset to Defaults
- Clears all custom configurations
- Returns to using the default JSON data
- Useful for troubleshooting

### 5. Benefits

1. **Easy Updates**: No need to modify code to update product data
2. **Version Control**: JSON files can be version controlled
3. **Backup & Restore**: Easy to backup and restore configurations
4. **Collaboration**: Multiple people can work on the same data file
5. **No Restart Required**: Changes can be applied without restarting the application

### 6. Best Practices

1. **Always backup**: Export your current data before making changes
2. **Validate JSON**: Ensure your JSON file is valid before replacing
3. **Test changes**: Verify that your changes work as expected
4. **Version control**: Keep track of different versions of your data
5. **Documentation**: Document any custom fields or special configurations

### 7. Troubleshooting

#### Data not loading
- Check that `src/assets/productData.json` exists and is valid JSON
- Use "Reload from JSON" to force reload
- Check browser console for errors

#### Changes not appearing
- Make sure you've saved the JSON file
- Use "Reload from JSON" to apply changes
- Clear browser cache if needed

#### Invalid JSON
- Use a JSON validator to check your file
- Ensure all quotes and brackets are properly closed
- Check for trailing commas

### 8. Example Workflow

1. **Current state**: You have a working application with product data
2. **Need to add a new model**: 
   - Export current data to JSON
   - Add the new model to the appropriate category
   - Add symptom areas for the new model
   - Save as `src/assets/productData.json`
   - Use "Reload from JSON" in the application
3. **Result**: New model is now available in the application

This system makes it incredibly easy to manage and update your product data without touching any code! 