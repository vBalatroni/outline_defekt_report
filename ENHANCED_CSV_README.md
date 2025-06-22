# Enhanced Product Mapping Management System

This enhanced system provides a comprehensive solution for managing product mapping data with CSV import/export, visual Kanban-style category building, and persistent storage management.

## 🚀 Key Features

### 📁 Mapping Source Management
- **Dropdown Selection**: Choose between default local assets and uploaded CSV files
- **File Persistence**: Uploaded files are automatically saved to localStorage
- **Delete Protection**: Local default assets cannot be deleted, only uploaded files
- **Storage Monitoring**: Real-time storage usage tracking with 5MB limit

### 🎯 Kanban-Style Category Builder
- **Visual Interface**: Drag-and-drop interface for organizing categories and models
- **Real-time Editing**: Inline editing of category names, model names, and symptom areas
- **Model Duplication**: Copy existing models with all their symptom areas
- **Intuitive UX**: Click to select, drag to move, and visual feedback for all actions

### 📊 CSV Import/Export
- **Smart Parsing**: Robust CSV parsing with quoted field support
- **Data Validation**: Automatic validation of CSV structure and content
- **Multiple Formats**: Support for various CSV structures and additional columns
- **Export Options**: Export current mapping, Kanban-built data, or sample templates

### 💾 Storage Management
- **Automatic Backup**: Uploaded files are automatically saved to localStorage
- **Backup Export/Import**: Export all uploaded files as JSON backup
- **Storage Statistics**: Monitor storage usage with visual indicators
- **Bulk Operations**: Clear all uploaded files or manage individual files

## 🎨 User Interface

### Mapping Selection Section
```
┌─────────────────────────────────────────────────────────┐
│ Select Mapping Source                                   │
├─────────────────────────────────────────────────────────┤
│ Current Mapping: [Default Asset (Local) ▼] [Delete]     │
│                                                         │
│ Storage Info:                                           │
│ 📁 3 files  💾 2.1KB used  📊 42.0% of limit           │
│ [Export Backup] [Import Backup] [Clear All]             │
└─────────────────────────────────────────────────────────┘
```

### Kanban Builder Interface
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Active      │ │ Passive     │ │ Processor   │
│ Speaker     │ │ Speaker     │ │             │
├─────────────┤ ├─────────────┤ ├─────────────┤
│ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │
│ │DVS_10P  │ │ │ │AI_41    │ │ │ │Newton_16│ │
│ │[Audio_] │ │ │ │[Audio_] │ │ │ │[Audio]  │ │
│ │[Power]  │ │ │ │[Cabinet]│ │ │ │[Power]  │ │
│ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │
│ ┌─────────┐ │ │             │ │             │
│ │DVS_115  │ │ │             │ │             │
│ │[Audio_] │ │ │             │ │             │
│ └─────────┘ │ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
```

## 📋 Usage Guide

### 1. Access the Management Interface
Navigate to `/csv-demo` in your application to access the enhanced management interface.

### 2. Select Mapping Source
- Use the dropdown to select between "Default Asset (Local)" and uploaded files
- Uploaded files show with "(Uploaded)" suffix
- Delete button appears only for uploaded files (not local assets)

### 3. Import New CSV Files
1. Click "Choose File" or drag & drop a CSV file
2. Click "Parse CSV" to process the file
3. Review the parsed data preview
4. Click "Import Mapping Data" to add to your collection

### 4. Use the Kanban Builder
- **Add Categories**: Click "Add Category" to create new columns
- **Add Models**: Click "Add Model" to add models to the first category
- **Edit Names**: Click on category or model names to edit inline
- **Drag & Drop**: Drag models between categories to reorganize
- **Manage Symptoms**: Add/remove symptom areas for each model
- **Duplicate Models**: Select a model and click "Duplicate Model"

### 5. Export Your Work
- **Export Current**: Download the currently selected mapping as CSV
- **Export Kanban**: Export the Kanban-built data as CSV
- **Export Backup**: Download all uploaded files as JSON backup

## 📁 File Management

### Storage System
- **Local Storage**: All uploaded files are automatically saved to browser localStorage
- **5MB Limit**: System enforces a 5MB storage limit with usage monitoring
- **Automatic Cleanup**: Storage usage is tracked and displayed in real-time

### Backup System
- **Export Backup**: Download all uploaded files as a single JSON file
- **Import Backup**: Restore all uploaded files from a backup JSON file
- **File Recovery**: Backup files contain all metadata and can be restored completely

### File Operations
- **Individual Delete**: Delete specific uploaded files (local assets protected)
- **Bulk Clear**: Remove all uploaded files at once
- **File Persistence**: Files survive browser restarts and page refreshes

## 🔧 Technical Details

### CSV Format Requirements
```csv
category,model,symptomAreas
Active_Speaker,DVS_10P_SP,"Amplifier,Audio_,Cabinet,Power,Speaker"
Passive_Speaker,AI_41,"Audio_,Cabinet,Speaker"
Processor,Newton_16,"Audio,Connections,Control_Software,Dante,Firmware,Mechanics,Power"
```

### Storage Structure
```javascript
{
  id: 1,
  name: "Uploaded_2024-01-15T10-30-45",
  data: {
    categories: [...],
    categoryModels: {...},
    modelSymptomAreas: {...}
  },
  createdAt: "2024-01-15T10:30:45.123Z"
}
```

### Component Architecture
- **CsvDemoView.vue**: Main management interface
- **KanbanBuilder.vue**: Visual category builder component
- **ProductMappingCsvReader.vue**: CSV import component
- **storageUtils.js**: Local storage management utilities
- **csvUtils.js**: CSV processing utilities

## 🎯 Advanced Features

### Model Duplication
- Select any model in the Kanban interface
- Click "Duplicate Model" to create an exact copy
- The duplicated model includes all symptom areas
- Automatically named with "(Copy)" suffix

### Drag & Drop Operations
- **Visual Feedback**: Models highlight when dragged
- **Drop Zones**: Categories highlight when models can be dropped
- **Cross-Category**: Move models between different categories
- **Selection State**: Selected models are visually highlighted

### Real-time Updates
- **Live Preview**: See changes immediately in the mapping display
- **Auto-save**: All changes are automatically saved to localStorage
- **Storage Monitoring**: Real-time storage usage updates
- **Validation**: Immediate feedback on data integrity

## 🛠️ Development Notes

### Adding New Features
1. **New CSV Columns**: Update `csvUtils.js` parsing functions
2. **UI Enhancements**: Modify `KanbanBuilder.vue` component
3. **Storage Extensions**: Extend `storageUtils.js` functions
4. **Validation Rules**: Update validation in `csvUtils.js`

### Browser Compatibility
- **Modern Browsers**: Full support for all features
- **LocalStorage**: Required for file persistence
- **Drag & Drop API**: Required for Kanban functionality
- **File API**: Required for CSV processing

### Performance Considerations
- **Storage Limits**: 5MB localStorage limit enforced
- **Large Files**: CSV files are processed in chunks
- **Memory Usage**: Models are kept in memory for editing
- **Auto-save**: Debounced saving to prevent excessive writes

## 🎨 Customization

### Styling
- **Bootstrap Integration**: Uses Bootstrap 5 classes and components
- **Responsive Design**: Mobile-friendly interface
- **Custom CSS**: Component-specific styles in each Vue component
- **Theme Support**: Easy to customize colors and layout

### Configuration
- **Storage Limits**: Configurable in `storageUtils.js`
- **CSV Formats**: Extensible in `csvUtils.js`
- **Validation Rules**: Customizable validation logic
- **UI Elements**: Modular component structure for easy modification

This enhanced system provides a complete solution for managing product mapping data with an intuitive, visual interface and robust file management capabilities. 