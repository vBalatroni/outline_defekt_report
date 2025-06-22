# JSON Configuration System

This document describes the enhanced JSON configuration system that allows dynamic form configuration, dropdown management, and conditional field visibility based on product models.

## Overview

The JSON configuration system provides a flexible way to:
- Define custom dropdown options for form fields
- Set up conditional field visibility based on product models
- Configure which fields are visible for different product categories
- Manage product mapping data
- Create dependent dropdowns (e.g., voltage range depends on voltage type)

## JSON File Structure

The system supports two types of files:

### 1. Form Configuration JSON

This JSON defines form behavior, dropdowns, and field visibility rules.

**Structure:**
```json
{
  "dropdowns": {
    "dropdownName": {
      "name": "Display Name",
      "values": ["value1", "value2", "value3"],
      "dependentOn": "otherDropdown",
      "dependentValues": {
        "value1": ["dependent1", "dependent2"],
        "value2": ["dependent3", "dependent4"]
      }
    }
  },
  "fieldVisibility": {
    "modelName": {
      "fieldName": {
        "show": true,
        "dependsOn": "otherField",
        "dependsValue": "specificValue"
      }
    }
  },
  "categoryConfigs": {
    "categoryName": {
      "visibleFields": {
        "sectionName": ["field1", "field2", "field3"]
      }
    }
  }
}
```

### 2. Product Mapping JSON

This JSON defines product categories, models, and symptom areas.

**Structure:**
```json
{
  "categoryModels": {
    "Active_Speaker": ["DVS_10P_SP", "DVS_115_SW_iSP"],
    "Passive_Speaker": ["AI_41", "AI_81"]
  },
  "modelSymptomAreas": {
    "DVS_10P_SP": ["Amplifier", "Audio_", "Cabinet", "Power", "Speaker"],
    "AI_41": ["Audio_", "Cabinet", "Speaker"]
  }
}
```

## Supported Dropdowns

The system includes the following configurable dropdowns:

### Symptom Occurrence
- After a while
- After long time switched off
- After product upgrade
- Constantly
- Due to a physical damage
- In a cold environment
- In a hot environment
- In a wet environment
- Intermittently
- Liquid contamination
- One time event
- Switched on the first time
- Under stressed condition
- Under vibration
- When switching

### Mains Voltage Type
- Single phase
- Bi phase
- Three phase with neutral
- Three phase without neutral

### Mains Voltage Range (Dependent on Voltage Type)
- Single phase: <100VAC, 200-240V
- Bi phase: 200-240V, >240V
- Three phase with neutral: >240VAC
- Three phase without neutral: >240VAC

### Output Load
- 2 Ohm
- 4 Ohm
- 8 Ohm
- 16 Ohm
- >16 Ohm
- Disconnected

### Load Connection Mode
- Single ended
- Bridged
- Parallel

### Installation Type
- Airport
- Rail Station
- Cinema
- Theatre
- Museum
- Club / Disco
- Pub
- Concert
- Touring Rental
- Mall
- Conference
- Church
- Boat
- Laboratory

## Field Visibility Rules

You can control field visibility based on:
- Product model
- Category
- Other field values (conditional visibility)

### Examples:

**Show voltage fields only for specific models:**
```json
{
  "fieldVisibility": {
    "DVS_10P_SP": {
      "mainsVoltageType": { "show": true }
    },
    "AI_41": {
      "mainsVoltageType": { "show": false }
    }
  }
}
```

**Show voltage range only when voltage type is selected:**
```json
{
  "fieldVisibility": {
    "DVS_10P_SP": {
      "mainsVoltageRange": {
        "show": true,
        "dependsOn": "mainsVoltageType",
        "dependsValue": "Single phase"
      }
    }
  }
}
```

## Category Configurations

Define which fields are visible for each product category:

### Active Speaker
- Symptom Info: symptomArea, symptomFound, symptomOccurrence
- Technical Info: mainsVoltageType, mainsVoltageRange, outputLoad, loadConnectionMode
- Additional Info: installationType, note

### Passive Speaker
- Symptom Info: symptomArea, symptomFound, symptomOccurrence
- Additional Info: installationType, note

### Processor
- Symptom Info: symptomArea, symptomFound, symptomOccurrence
- Technical Info: mainsVoltageType, mainsVoltageRange
- Additional Info: installationType, note

## Usage

### 1. Upload Configuration

1. Go to the CSV Demo page
2. Use the "Form Configuration Management" section
3. Upload your JSON configuration file
4. The system will automatically apply the configuration

### 2. Generate Sample Configuration

1. Click "Generate Sample JSON" to download a sample JSON file
2. Modify the sample according to your needs
3. Upload the modified file

### 3. Manage Configuration

- View current configuration status
- Export configuration as JSON
- Clear configuration to reset to defaults
- Preview dropdowns and visibility rules

## File Management

The system provides:
- Local storage of uploaded configurations
- Backup and restore functionality
- Configuration export/import
- Storage usage monitoring
- Support for both JSON and CSV formats (backward compatibility)

## Integration with Form

The configuration automatically applies to:
- Product selection dropdowns
- Defect form fields
- Dynamic field visibility
- Dependent dropdown behavior

## Technical Implementation

### Key Components

1. **formConfigUtils.js** - Core configuration utilities
2. **csvUtils.js** - Enhanced file parsing with JSON and CSV support
3. **storageUtils.js** - Configuration storage management
4. **CsvConfigManager.vue** - Configuration management UI
5. **ProductsStep.vue** - Updated form with dynamic configuration

### Data Flow

1. JSON file uploaded → Parsed by csvUtils.js
2. Configuration merged with defaults → Stored in localStorage
3. Form components load configuration → Apply dynamic behavior
4. User interactions trigger field updates → Dependent dropdowns update

## Benefits of JSON over CSV

1. **Better Structure**: JSON supports nested objects and arrays naturally
2. **Type Safety**: JSON maintains data types (arrays, objects, strings)
3. **Readability**: JSON is more human-readable than CSV
4. **Validation**: JSON can be validated with schemas
5. **Tooling**: Better IDE support and syntax highlighting
6. **No Escaping Issues**: No need to escape special characters like in CSV

## Backward Compatibility

The system still supports CSV files for backward compatibility:
- Legacy CSV configurations will continue to work
- New configurations should use JSON format
- The system automatically detects file format based on extension

## Best Practices

1. **Use JSON format** for new configurations
2. **Backup your configurations** before making changes
3. **Test visibility rules** with different product models
4. **Use consistent naming** for categories and models
5. **Validate JSON format** before uploading
6. **Keep configurations simple** to avoid conflicts

## Troubleshooting

### Common Issues

1. **Fields not showing**: Check category configuration and visibility rules
2. **Dropdowns not updating**: Verify dependent dropdown configuration
3. **Configuration not loading**: Clear browser storage and re-upload
4. **JSON parsing errors**: Check JSON format and syntax

### Debug Tips

1. Use browser console to check configuration loading
2. Verify JSON format with sample files
3. Test with simple configurations first
4. Check field visibility rules for specific models

## Future Enhancements

- Visual configuration builder
- Advanced conditional logic
- Multi-language support
- Configuration versioning
- Real-time configuration preview
- JSON schema validation 