# Data Standardization

## Overview
This document describes the standardization of symptom area names in the product data to ensure consistency and eliminate confusion.

## Issues Resolved

### 1. Speaker Area Variations
**Problem**: Multiple variations of the same symptom area existed:
- `Speaker`
- `Speaker_`
- `Speaker__`
- `Speaker___`
- `Speaker.`
- `Speaker..`

**Solution**: All variations were standardized to `Speaker`

**Impact**: 
- Eliminates confusion in the UI
- Ensures consistent symptom reporting
- Simplifies data management

### 2. Audio Area Variations
**Problem**: Two different audio symptom areas existed:
- `Audio` (17 symptoms - comprehensive list)
- `Audio_` (11 symptoms - subset)

**Solution**: Merged both areas into a single `Audio` area containing all unique symptoms (21 total)

**Impact**:
- Provides complete audio symptom coverage
- Eliminates duplicate symptom areas
- Simplifies user interface

### 3. Rack Amplifier and Measurement System Issues
**Problem**: Several models had data quality issues:
- Duplicate "Power" entries (e.g., `["Power", "Power", "Power", "Power"]`)
- Inconsistent symptom area names
- Missing or malformed symptom area definitions

**Solution**: 
- Removed all duplicate entries
- Standardized symptom area names
- Ensured all models have proper symptom area definitions

**Impact**:
- Fixes dropdown display issues for Rack Amplifier and Measurement System categories
- Ensures consistent symptom area options
- Improves data integrity

## Current Standardized Symptom Areas

The following symptom areas are now consistently named throughout the system:

### Core Areas
- `Audio` - All audio-related symptoms
- `Power` - Power supply and electrical issues
- `Cabinet` - Physical cabinet and enclosure issues
- `Speaker` - Speaker-specific problems
- `Mechanics` - Mechanical and moving parts issues

### Technical Areas
- `Connections` - Input/output connection problems
- `Amplifier` - Amplifier-specific issues
- `Control_Software` - Software control issues
- `Firmware` - Firmware-related problems
- `Dante` - Dante network issues
- `Display` - Display and screen problems
- `DSP` - Digital signal processing issues
- `In_Out` - Input/output routing problems

### Specialized Areas
- `Hardware` - General hardware issues
- `Electronics` - Electronic component problems
- `Mechanical_Issue` - Specific mechanical problems
- `Armonia` - Armonia software issues

## Benefits of Standardization

1. **Consistency**: All models now use the same symptom area names
2. **Clarity**: Users see consistent terminology across all products
3. **Maintainability**: Easier to manage and update symptom data
4. **Data Integrity**: Eliminates duplicate or conflicting symptom areas
5. **User Experience**: Cleaner, more intuitive interface
6. **Functionality**: Fixes dropdown display issues for all product categories

## Data Management

The standardized data is stored in `src/assets/productData.json` and can be:
- Exported using the "Export to JSON" button in the JSON Configuration Manager
- Modified externally and re-imported
- Updated through the management system

## Future Considerations

When adding new symptom areas:
1. Use clear, descriptive names
2. Avoid underscores unless necessary for multi-word areas
3. Ensure consistency with existing naming conventions
4. Update this documentation when adding new areas
5. Avoid duplicate entries in symptom area arrays 