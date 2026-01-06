import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, Plus, Edit, Trash2, Copy, Eye, Download, Printer, Search, 
  ChevronDown, ChevronUp, Settings, Image, Type, QrCode, LayoutGrid, 
  Users, GraduationCap, UserCog, Palette, Move, RotateCcw, Save,
  X, Check, AlertCircle, History, Maximize2, Minimize2, ArrowRight
} from 'lucide-react';
import { idCards, auth } from '../services/api';
import { toast } from '../utils/toast';

// User type configurations
const USER_TYPES = [
  { id: 'student', label: 'Students', icon: GraduationCap, color: 'blue' },
  { id: 'teacher', label: 'Teachers', icon: Users, color: 'green' },
  { id: 'staff', label: 'Non-Teaching Staff', icon: UserCog, color: 'orange' },
];

// Barcode type options
const BARCODE_TYPES = [
  { id: 'code128', label: 'Code 128', description: 'High density, alphanumeric' },
  { id: 'code39', label: 'Code 39', description: 'Alphanumeric, widely used' },
  { id: 'ean13', label: 'EAN-13', description: '13-digit numeric only' },
  { id: 'qrcode', label: 'QR Code', description: '2D, high capacity' },
];

// Photo shape options
const PHOTO_SHAPES = [
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'circle', label: 'Circle' },
];

// Position options
const POSITIONS = [
  { id: 'left', label: 'Left' },
  { id: 'center', label: 'Center' },
  { id: 'right', label: 'Right' },
];

// Font families
const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 
  'Courier New', 'Impact', 'Comic Sans MS', 'Trebuchet MS'
];

// Portrait layout options
const PORTRAIT_LAYOUTS = [
  { id: 'photo-top', label: 'Photo on Top', description: 'Photo above details' },
  { id: 'photo-left', label: 'Photo on Left', description: 'Traditional side layout' },
];

// Card orientation options
const CARD_ORIENTATIONS = [
  { id: 'landscape', label: 'Landscape', width: 85.6, height: 53.98 },
  { id: 'portrait', label: 'Portrait', width: 53.98, height: 85.6 },
];

// Name font size options
const NAME_FONT_SIZES = [
  { id: 'small', label: 'Small', size: 10 },
  { id: 'medium', label: 'Medium', size: 12 },
  { id: 'large', label: 'Large', size: 14 },
  { id: 'xlarge', label: 'X-Large', size: 16 },
];

// Default template configuration
const DEFAULT_TEMPLATE = {
  name: '',
  userType: 'student',
  widthMm: 85.6,
  heightMm: 53.98,
  orientation: 'landscape',
  portraitLayout: 'photo-top', // 'photo-top' or 'photo-left'
  backgroundColor: '#FFFFFF',
  backgroundImageUrl: '',
  showHeader: true,
  headerText: '',
  headerFontSize: 18,
  headerFontFamily: 'Arial',
  headerFontWeight: 'bold',
  headerTextColor: '#000000',
  headerBackgroundColor: '#E3F2FD',
  headerHeightMm: 12,
  showSchoolLogo: true,
  logoPosition: 'left',
  logoSizeMm: 12,
  showPhoto: true,
  photoPosition: 'left',
  photoSizeMm: 22,
  photoShape: 'rectangle',
  photoBorderColor: '#333333',
  photoBorderWidth: 1,
  // Name styling
  nameFontSize: 12,
  nameFontWeight: 'bold',
  nameTextColor: '#000000',
  nameAlignment: 'left',
  // Info fields styling
  infoFontSize: 9,
  labelFontWeight: 'bold',
  labelTextColor: '#666666',
  valueFontWeight: 'normal',
  valueTextColor: '#000000',
  showLabels: true,
  infoAlignment: 'left',
  // Fields config
  fieldsConfig: [],
  showBarcode: true,
  barcodeType: 'code128',
  barcodePosition: 'bottom',
  barcodeSizeMm: 35,
  barcodeHeightMm: 12,
  barcodeDataField: 'admissionNumber',
  showBarcodeText: true,
  showFooter: true,
  footerText: '',
  footerFontSize: 8,
  footerTextColor: '#666666',
  hasBackSide: false,
  backBackgroundColor: '#FFFFFF',
  backBackgroundImageUrl: '',
  backContent: {},
  showWatermark: false,
  watermarkText: '',
  watermarkOpacity: 0.1,
  showValidityDate: true,
  validityStartText: 'Valid From:',
  validityEndText: 'Valid Till:',
  validityDays: 365,
  showIssueDate: true,
  showEmergencyContact: false,
  showBloodGroup: true,
  showAddress: false,
  showFatherName: true,
  showMotherName: false,
  showContactNumber: true,
  showSignature: true,
  signatureLabel: 'Principal Signature',
  isActive: true,
  isDefault: false,
};

const IdCardConfiguration = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedUserType, setSelectedUserType] = useState('student');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ ...DEFAULT_TEMPLATE });
  const [availableFields, setAvailableFields] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [printHistory, setPrintHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    layout: true,
    header: true,
    photo: true,
    fields: true,
    barcode: true,
    footer: true,
    security: false,
    backSide: false,
  });
  
  useEffect(() => {
    fetchTemplates();
    fetchSchoolInfo();
  }, [selectedUserType]);

  useEffect(() => {
    if (templateForm.userType) {
      fetchAvailableFields(templateForm.userType);
    }
  }, [templateForm.userType]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await idCards.getTemplates({ user_type: selectedUserType });
      if (response.success) {
        setTemplates(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolInfo = async () => {
    try {
      const response = await auth.getSchool();
      if (response.success) {
        setSchoolInfo(response.school);
      }
    } catch (error) {
      console.error('Error fetching school info:', error);
    }
  };

  const fetchAvailableFields = async (userType) => {
    try {
      const response = await idCards.getAvailableFields(userType);
      if (response.success) {
        setAvailableFields(response.data || []);
        // Set default fields if creating new template
        if (!editingTemplate && templateForm.fieldsConfig.length === 0) {
          setTemplateForm(prev => ({
            ...prev,
            fieldsConfig: response.data.filter(f => f.show),
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching available fields:', error);
    }
  };

  const fetchPrintHistory = async () => {
    try {
      const response = await idCards.getPrintHistory({ user_type: selectedUserType });
      if (response.success) {
        setPrintHistory(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching print history:', error);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      ...DEFAULT_TEMPLATE,
      userType: selectedUserType,
      headerText: schoolInfo?.name || '',
    });
    fetchAvailableFields(selectedUserType);
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    // Map snake_case keys from API to camelCase for the form
    setTemplateForm({
      ...DEFAULT_TEMPLATE,
      name: template.name || '',
      userType: template.user_type || template.userType || 'student',
      widthMm: template.width_mm ?? template.widthMm ?? 85.6,
      heightMm: template.height_mm ?? template.heightMm ?? 53.98,
      orientation: template.orientation || 'landscape',
      portraitLayout: template.portrait_layout || template.portraitLayout || 'photo-top',
      backgroundColor: template.background_color || template.backgroundColor || '#FFFFFF',
      backgroundImageUrl: template.background_image_url || template.backgroundImageUrl || '',
      showHeader: template.show_header ?? template.showHeader ?? true,
      headerText: template.header_text || template.headerText || '',
      headerFontSize: template.header_font_size ?? template.headerFontSize ?? 18,
      headerFontFamily: template.header_font_family || template.headerFontFamily || 'Arial',
      headerFontWeight: template.header_font_weight || template.headerFontWeight || 'bold',
      headerTextColor: template.header_text_color || template.headerTextColor || '#000000',
      headerBackgroundColor: template.header_background_color || template.headerBackgroundColor || '#E3F2FD',
      headerHeightMm: template.header_height_mm ?? template.headerHeightMm ?? 12,
      showSchoolLogo: template.show_school_logo ?? template.showSchoolLogo ?? true,
      logoPosition: template.logo_position || template.logoPosition || 'left',
      logoSizeMm: template.logo_size_mm ?? template.logoSizeMm ?? 12,
      showPhoto: template.show_photo ?? template.showPhoto ?? true,
      photoPosition: template.photo_position || template.photoPosition || 'left',
      photoSizeMm: template.photo_size_mm ?? template.photoSizeMm ?? 22,
      photoShape: template.photo_shape || template.photoShape || 'rectangle',
      photoBorderColor: template.photo_border_color || template.photoBorderColor || '#333333',
      photoBorderWidth: template.photo_border_width ?? template.photoBorderWidth ?? 1,
      // Name & Info Styling
      nameFontSize: template.name_font_size ?? template.nameFontSize ?? 12,
      nameFontWeight: template.name_font_weight || template.nameFontWeight || 'bold',
      nameTextColor: template.name_text_color || template.nameTextColor || '#000000',
      nameAlignment: template.name_alignment || template.nameAlignment || 'left',
      infoFontSize: template.info_font_size ?? template.infoFontSize ?? 9,
      labelFontWeight: template.label_font_weight || template.labelFontWeight || 'bold',
      labelTextColor: template.label_text_color || template.labelTextColor || '#666666',
      valueFontWeight: template.value_font_weight || template.valueFontWeight || 'normal',
      valueTextColor: template.value_text_color || template.valueTextColor || '#000000',
      showLabels: template.show_labels ?? template.showLabels ?? true,
      infoAlignment: template.info_alignment || template.infoAlignment || 'left',
      fieldsConfig: template.fields_config || template.fieldsConfig || [],
      showBarcode: template.show_barcode ?? template.showBarcode ?? true,
      barcodeType: template.barcode_type || template.barcodeType || 'code128',
      barcodePosition: template.barcode_position || template.barcodePosition || 'bottom',
      barcodeSizeMm: template.barcode_size_mm ?? template.barcodeSizeMm ?? 35,
      barcodeHeightMm: template.barcode_height_mm ?? template.barcodeHeightMm ?? 12,
      barcodeDataField: template.barcode_data_field || template.barcodeDataField || 'admissionNumber',
      showBarcodeText: template.show_barcode_text ?? template.showBarcodeText ?? true,
      showFooter: template.show_footer ?? template.showFooter ?? true,
      footerText: template.footer_text || template.footerText || '',
      footerFontSize: template.footer_font_size ?? template.footerFontSize ?? 8,
      footerTextColor: template.footer_text_color || template.footerTextColor || '#666666',
      hasBackSide: template.has_back_side ?? template.hasBackSide ?? false,
      backBackgroundColor: template.back_background_color || template.backBackgroundColor || '#FFFFFF',
      backBackgroundImageUrl: template.back_background_image_url || template.backBackgroundImageUrl || '',
      backContent: template.back_content || template.backContent || {},
      showWatermark: template.show_watermark ?? template.showWatermark ?? false,
      watermarkText: template.watermark_text || template.watermarkText || '',
      watermarkOpacity: template.watermark_opacity ?? template.watermarkOpacity ?? 0.1,
      showValidityDate: template.show_validity_date ?? template.showValidityDate ?? true,
      validityStartText: template.validity_start_text || template.validityStartText || 'Valid From:',
      validityEndText: template.validity_end_text || template.validityEndText || 'Valid Till:',
      validityDays: template.validity_days ?? template.validityDays ?? 365,
      showIssueDate: template.show_issue_date ?? template.showIssueDate ?? true,
      showEmergencyContact: template.show_emergency_contact ?? template.showEmergencyContact ?? false,
      showBloodGroup: template.show_blood_group ?? template.showBloodGroup ?? true,
      showAddress: template.show_address ?? template.showAddress ?? false,
      showFatherName: template.show_father_name ?? template.showFatherName ?? true,
      showMotherName: template.show_mother_name ?? template.showMotherName ?? false,
      showContactNumber: template.show_contact_number ?? template.showContactNumber ?? true,
      showSignature: template.show_signature ?? template.showSignature ?? true,
      signatureLabel: template.signature_label || template.signatureLabel || 'Principal Signature',
      isActive: template.is_active ?? template.isActive ?? true,
      isDefault: template.is_default ?? template.isDefault ?? false,
    });
    setShowTemplateModal(true);
  };

  const handleDuplicateTemplate = async (template) => {
    try {
      const response = await idCards.duplicateTemplate(template.id, {
        name: `${template.name} (Copy)`,
      });
      if (response.success) {
        toast.success('Template duplicated successfully');
        fetchTemplates();
      } else {
        toast.error(response.message || 'Failed to duplicate template');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;
    
    try {
      const response = await idCards.deleteTemplate(template.id);
      if (response.success) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      } else {
        toast.error(response.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      let response;
      if (editingTemplate) {
        response = await idCards.updateTemplate(editingTemplate.id, templateForm);
      } else {
        response = await idCards.createTemplate(templateForm);
      }

      if (response.success) {
        toast.success(editingTemplate ? 'Template updated successfully' : 'Template created successfully');
        setShowTemplateModal(false);
        fetchTemplates();
      } else {
        toast.error(response.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFieldToggle = (fieldName, checked) => {
    setTemplateForm(prev => {
      const existingField = prev.fieldsConfig.find(f => f.field === fieldName);
      if (checked && !existingField) {
        const fieldConfig = availableFields.find(f => f.field === fieldName);
        return {
          ...prev,
          fieldsConfig: [...prev.fieldsConfig, { ...fieldConfig, show: true }],
        };
      } else if (!checked && existingField) {
        return {
          ...prev,
          fieldsConfig: prev.fieldsConfig.filter(f => f.field !== fieldName),
        };
      }
      return prev;
    });
  };

  const handleFieldConfigChange = (fieldName, key, value) => {
    setTemplateForm(prev => ({
      ...prev,
      fieldsConfig: prev.fieldsConfig.map(f =>
        f.field === fieldName ? { ...f, [key]: value } : f
      ),
    }));
  };

  // ID Card Preview Component
  const IdCardPreview = ({ template, scale = 1 }) => {
    const mmToPx = 3.78;
    const isPortrait = template.orientation === 'portrait';
    
    // For portrait: width should be smaller, height should be larger
    // For landscape: width should be larger, height should be smaller
    const cardWidthMm = isPortrait 
      ? Math.min(template.widthMm || 53.98, template.heightMm || 85.6) 
      : Math.max(template.widthMm || 85.6, template.heightMm || 53.98);
    const cardHeightMm = isPortrait 
      ? Math.max(template.widthMm || 53.98, template.heightMm || 85.6) 
      : Math.min(template.widthMm || 85.6, template.heightMm || 53.98);
    
    const cardStyle = {
      width: `${cardWidthMm * mmToPx * scale}px`,
      height: `${cardHeightMm * mmToPx * scale}px`,
      backgroundColor: template.backgroundColor,
      border: '1px solid #ccc',
      borderRadius: '8px',
      overflow: 'hidden',
      fontFamily: template.headerFontFamily,
      position: 'relative',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    };

    return (
      <div style={cardStyle} className="id-card-preview">
        {/* Header */}
        {template.showHeader && (
          <div 
            style={{
              backgroundColor: template.headerBackgroundColor,
              padding: `${4 * scale}px ${8 * scale}px`,
              display: 'flex',
              alignItems: 'center',
              gap: `${6 * scale}px`,
              borderBottom: '1px solid #ddd',
            }}
          >
            {template.showSchoolLogo && (
              <div 
                style={{
                  width: `${template.logoSizeMm * 3.78 * scale}px`,
                  height: `${template.logoSizeMm * 3.78 * scale}px`,
                  backgroundColor: '#E0E0E0',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${8 * scale}px`,
                  color: '#666',
                  flexShrink: 0,
                }}
              >
                LOGO
              </div>
            )}
            <div style={{ flex: 1, textAlign: template.logoPosition === 'left' ? 'left' : 'center' }}>
              <div 
                style={{
                  fontSize: `${template.headerFontSize * scale * 0.6}px`,
                  fontWeight: template.headerFontWeight,
                  color: template.headerTextColor,
                  lineHeight: 1.2,
                }}
              >
                {template.headerText || schoolInfo?.name || 'SCHOOL NAME'}
              </div>
              <div style={{ fontSize: `${7 * scale}px`, color: '#666' }}>
                IDENTITY CARD - {template.userType.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{ 
          display: 'flex', 
          flexDirection: (isPortrait && template.portraitLayout !== 'photo-left') ? 'column' : 'row',
          alignItems: (isPortrait && template.portraitLayout !== 'photo-left') ? 'center' : 'flex-start',
          padding: `${6 * scale}px`, 
          gap: `${8 * scale}px`, 
          flex: 1 
        }}>
          {/* Photo */}
          {template.showPhoto && (
            <div 
              style={{
                width: `${template.photoSizeMm * 3.78 * scale}px`,
                height: `${template.photoSizeMm * 3.78 * scale * 1.2}px`,
                backgroundColor: '#F5F5F5',
                border: `${template.photoBorderWidth}px solid ${template.photoBorderColor}`,
                borderRadius: template.photoShape === 'circle' ? '50%' : template.photoShape === 'rounded' ? '8px' : '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Image size={20 * scale} className="text-gray-400" />
            </div>
          )}

          {/* Fields */}
          <div style={{ 
            flex: 1, 
            fontSize: `${(template.infoFontSize || 9) * scale}px`,
            textAlign: (isPortrait && template.portraitLayout !== 'photo-left') ? 'center' : (template.infoAlignment || 'left'),
            width: (isPortrait && template.portraitLayout !== 'photo-left') ? '100%' : 'auto',
          }}>
            {/* Name */}
            <div style={{ 
              fontSize: `${(template.nameFontSize || 12) * scale}px`, 
              fontWeight: template.nameFontWeight || 'bold',
              color: template.nameTextColor || '#333',
              textAlign: (isPortrait && template.portraitLayout !== 'photo-left') ? 'center' : (template.nameAlignment || 'left'),
              marginBottom: `${4 * scale}px`,
              borderBottom: '1px solid #ddd',
              paddingBottom: `${2 * scale}px`,
            }}>
              John Doe
            </div>
            {/* Info Fields - Use default sample fields if no config */}
            {(() => {
              const sampleFields = template.userType === 'student' ? [
                { label: 'Adm No', value: 'ADM2025001' },
                { label: 'Class', value: 'Class X - A' },
                { label: 'Roll No', value: '15' },
                { label: 'DOB', value: '15/05/2010' },
                { label: 'Father', value: 'Robert Doe' },
                { label: 'Contact', value: '9876543210' },
              ] : [
                { label: 'Emp ID', value: 'EMP001' },
                { label: 'Designation', value: 'Teacher' },
                { label: 'Department', value: 'Mathematics' },
                { label: 'DOB', value: '15/05/1985' },
                { label: 'Contact', value: '9876543210' },
                { label: 'Joined', value: '01/04/2020' },
              ];
              
              const showLabels = template.showLabels !== false;
              const fieldsToShow = sampleFields.slice(0, isPortrait ? 4 : 6);
              
              return fieldsToShow.map((field, idx) => (
                <div key={idx} style={{ 
                  marginBottom: `${2 * scale}px`, 
                  display: 'flex', 
                  gap: '4px', 
                  justifyContent: (isPortrait && template.portraitLayout !== 'photo-left') ? 'center' : 'flex-start' 
                }}>
                  {showLabels && (
                    <span style={{ 
                      color: template.labelTextColor || '#666', 
                      fontWeight: template.labelFontWeight || 'normal',
                      minWidth: (isPortrait && template.portraitLayout !== 'photo-left') ? 'auto' : `${50 * scale}px` 
                    }}>
                      {field.label}:
                    </span>
                  )}
                  <span style={{ 
                    fontWeight: template.valueFontWeight || 'normal',
                    color: template.valueTextColor || '#000',
                  }}>
                    {field.value}
                  </span>
                </div>
              ));
            })()}
            
            {/* Blood Group Badge */}
            {template.showBloodGroup && (
              <div style={{
                display: 'inline-block',
                backgroundColor: '#EF5350',
                color: '#fff',
                padding: `${2 * scale}px ${6 * scale}px`,
                borderRadius: '4px',
                fontSize: `${8 * scale}px`,
                fontWeight: 'bold',
                marginTop: `${4 * scale}px`,
              }}>
                A+
              </div>
            )}
          </div>
        </div>

        {/* Barcode */}
        {template.showBarcode && (
          <div 
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: `${4 * scale}px`,
              borderTop: '1px solid #eee',
              backgroundColor: '#FAFAFA',
            }}
          >
            <div style={{ fontSize: `${8 * scale}px`, color: '#333' }}>
              {template.barcodeType === 'qrcode' ? (
                <div style={{ width: `${30 * scale}px`, height: `${30 * scale}px`, backgroundColor: '#000', padding: '2px' }}>
                  <QrCode size={26 * scale} className="text-white" />
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    height: `${12 * scale}px`, 
                    background: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px)',
                    width: `${60 * scale}px`,
                    margin: '0 auto',
                  }} />
                  {template.showBarcodeText && (
                    <div style={{ fontSize: `${6 * scale}px`, marginTop: '2px' }}>ADM2025001</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {template.showFooter && template.footerText && (
          <div 
            style={{
              textAlign: 'center',
              fontSize: `${template.footerFontSize * scale * 0.8}px`,
              color: template.footerTextColor,
              padding: `${2 * scale}px`,
              borderTop: '1px solid #eee',
            }}
          >
            {template.footerText}
          </div>
        )}

        {/* Watermark */}
        {template.showWatermark && template.watermarkText && (
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-30deg)',
              fontSize: `${20 * scale}px`,
              color: '#000',
              opacity: template.watermarkOpacity,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {template.watermarkText}
          </div>
        )}
      </div>
    );
  };

  // Section Header Component
  const SectionHeader = ({ title, section, icon: Icon }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-gray-600" />
        <span className="font-medium text-gray-700">{title}</span>
      </div>
      {expandedSections[section] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
              <CreditCard className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ID Card Configuration</h1>
              <p className="text-sm text-gray-500">Design and manage ID cards for students, teachers, and staff</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/id-cards/print')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Printer size={18} />
            Print ID Cards
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {[
            { id: 'templates', label: 'Templates', icon: LayoutGrid },
            { id: 'history', label: 'Print History', icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'history') fetchPrintHistory();
              }}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-violet-600 border-violet-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* User Type Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-gray-600">Select User Type:</span>
            {USER_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedUserType(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  selectedUserType === type.id
                    ? `bg-${type.color}-100 text-${type.color}-700 ring-2 ring-${type.color}-500`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <type.icon size={18} />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            {/* Actions Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <button
                onClick={handleCreateTemplate}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
              >
                <Plus size={18} />
                Create Template
              </button>
            </div>

            {/* Templates Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Templates Found</h3>
                <p className="text-gray-500 mb-6">
                  Create your first ID card template for {selectedUserType}s
                </p>
                <button
                  onClick={handleCreateTemplate}
                  className="inline-flex items-center gap-2 bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700"
                >
                  <Plus size={18} />
                  Create Template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates
                  .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((template) => (
                    <div
                      key={template.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Preview Area */}
                      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-center">
                        <IdCardPreview template={template} scale={0.7} />
                      </div>
                      
                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800">{template.name}</h3>
                            <p className="text-sm text-gray-500 capitalize">{template.user_type} ID Card</p>
                          </div>
                          {template.is_default && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                          <span>{template.orientation}</span>
                          <span>•</span>
                          <span>{template.width_mm}×{template.height_mm}mm</span>
                          <span>•</span>
                          <span>{template.barcode_type?.toUpperCase()}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicateTemplate(template)}
                            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            title="Duplicate"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Print History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Print History</h3>
              <p className="text-sm text-gray-500">Track all ID card prints</p>
            </div>
            
            {printHistory.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No print history found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">User</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Template</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Printed At</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {printHistory.map((print) => (
                      <tr key={print.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{print.user_id}</td>
                        <td className="px-4 py-3 text-sm">{print.template_name}</td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(print.printed_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            print.status === 'active' ? 'bg-green-100 text-green-700' :
                            print.status === 'void' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {print.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-violet-600 hover:text-violet-800 text-sm">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h2>
                <p className="text-sm text-gray-500">Design your ID card template</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    previewMode ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Eye size={18} />
                  Preview
                </button>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex h-[calc(100vh-200px)]">
              {/* Configuration Panel */}
              <div className="w-1/2 overflow-y-auto p-4 border-r border-gray-200">
                {/* Template Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="e.g., Student ID Card 2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* User Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                  <select
                    value={templateForm.userType}
                    onChange={(e) => setTemplateForm({ ...templateForm, userType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    disabled={editingTemplate}
                  >
                    {USER_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Layout Section */}
                <div className="mb-4">
                  <SectionHeader title="Layout & Size" section="layout" icon={LayoutGrid} />
                  {expandedSections.layout && (
                    <div className="p-4 space-y-4 bg-gray-50 rounded-b-lg mt-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Width (mm)</label>
                          <input
                            type="number"
                            value={templateForm.widthMm}
                            onChange={(e) => setTemplateForm({ ...templateForm, widthMm: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Height (mm)</label>
                          <input
                            type="number"
                            value={templateForm.heightMm}
                            onChange={(e) => setTemplateForm({ ...templateForm, heightMm: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Orientation</label>
                          <select
                            value={templateForm.orientation}
                            onChange={(e) => {
                              const newOrientation = e.target.value;
                              // Auto-swap dimensions based on orientation
                              const dims = CARD_ORIENTATIONS.find(o => o.id === newOrientation);
                              setTemplateForm({ 
                                ...templateForm, 
                                orientation: newOrientation,
                                widthMm: dims?.width || templateForm.widthMm,
                                heightMm: dims?.height || templateForm.heightMm
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            {CARD_ORIENTATIONS.map(o => (
                              <option key={o.id} value={o.id}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Background Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={templateForm.backgroundColor}
                              onChange={(e) => setTemplateForm({ ...templateForm, backgroundColor: e.target.value })}
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={templateForm.backgroundColor}
                              onChange={(e) => setTemplateForm({ ...templateForm, backgroundColor: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Portrait Layout Options */}
                      {templateForm.orientation === 'portrait' && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <label className="block text-xs text-blue-700 font-medium mb-2">Portrait Layout Style</label>
                          <div className="flex gap-3">
                            {PORTRAIT_LAYOUTS.map(layout => (
                              <button
                                key={layout.id}
                                type="button"
                                onClick={() => setTemplateForm({ ...templateForm, portraitLayout: layout.id })}
                                className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                                  templateForm.portraitLayout === layout.id
                                    ? 'border-blue-500 bg-blue-100'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="text-sm font-medium">{layout.label}</div>
                                <div className="text-xs text-gray-500 mt-1">{layout.description}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Name & Info Styling */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Name & Info Styling</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Name Font Size</label>
                            <select
                              value={templateForm.nameFontSize}
                              onChange={(e) => setTemplateForm({ ...templateForm, nameFontSize: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              {NAME_FONT_SIZES.map(s => (
                                <option key={s.id} value={s.size}>{s.label} ({s.size}pt)</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Name Color</label>
                            <input
                              type="color"
                              value={templateForm.nameTextColor || '#000000'}
                              onChange={(e) => setTemplateForm({ ...templateForm, nameTextColor: e.target.value })}
                              className="w-full h-10 rounded cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Name Alignment</label>
                            <select
                              value={templateForm.nameAlignment || 'left'}
                              onChange={(e) => setTemplateForm({ ...templateForm, nameAlignment: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Info Font Size</label>
                            <input
                              type="number"
                              value={templateForm.infoFontSize || 9}
                              onChange={(e) => setTemplateForm({ ...templateForm, infoFontSize: parseInt(e.target.value) })}
                              min={6}
                              max={14}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Info Alignment</label>
                            <select
                              value={templateForm.infoAlignment || 'left'}
                              onChange={(e) => setTemplateForm({ ...templateForm, infoAlignment: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                        </div>
                        <label className="flex items-center gap-2 mt-3">
                          <input
                            type="checkbox"
                            checked={templateForm.showLabels !== false}
                            onChange={(e) => setTemplateForm({ ...templateForm, showLabels: e.target.checked })}
                            className="rounded text-violet-600"
                          />
                          <span className="text-sm text-gray-700">Show Field Labels (e.g., "Adm No:", "Class:")</span>
                        </label>
                      </div>
                      
                      {/* Student-specific fields */}
                      {templateForm.userType === 'student' && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Student Fields to Display</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={templateForm.showFatherName !== false}
                                onChange={(e) => setTemplateForm({ ...templateForm, showFatherName: e.target.checked })}
                                className="rounded text-violet-600"
                              />
                              <span className="text-sm text-gray-700">Father's Name</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={templateForm.showMotherName}
                                onChange={(e) => setTemplateForm({ ...templateForm, showMotherName: e.target.checked })}
                                className="rounded text-violet-600"
                              />
                              <span className="text-sm text-gray-700">Mother's Name</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={templateForm.showContactNumber !== false}
                                onChange={(e) => setTemplateForm({ ...templateForm, showContactNumber: e.target.checked })}
                                className="rounded text-violet-600"
                              />
                              <span className="text-sm text-gray-700">Contact Number</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={templateForm.showAddress}
                                onChange={(e) => setTemplateForm({ ...templateForm, showAddress: e.target.checked })}
                                className="rounded text-violet-600"
                              />
                              <span className="text-sm text-gray-700">Address</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Header Section */}
                <div className="mb-4">
                  <SectionHeader title="Header Configuration" section="header" icon={Type} />
                  {expandedSections.header && (
                    <div className="p-4 space-y-4 bg-gray-50 rounded-b-lg mt-1">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={templateForm.showHeader}
                          onChange={(e) => setTemplateForm({ ...templateForm, showHeader: e.target.checked })}
                          className="rounded text-violet-600"
                        />
                        <span className="text-sm">Show Header</span>
                      </label>
                      
                      {templateForm.showHeader && (
                        <>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Header Text (School Name)</label>
                            <input
                              type="text"
                              value={templateForm.headerText}
                              onChange={(e) => setTemplateForm({ ...templateForm, headerText: e.target.value })}
                              placeholder="School Name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                              <input
                                type="number"
                                value={templateForm.headerFontSize}
                                onChange={(e) => setTemplateForm({ ...templateForm, headerFontSize: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Font Family</label>
                              <select
                                value={templateForm.headerFontFamily}
                                onChange={(e) => setTemplateForm({ ...templateForm, headerFontFamily: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                {FONT_FAMILIES.map((font) => (
                                  <option key={font} value={font}>{font}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Font Weight</label>
                              <select
                                value={templateForm.headerFontWeight}
                                onChange={(e) => setTemplateForm({ ...templateForm, headerFontWeight: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="normal">Normal</option>
                                <option value="bold">Bold</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={templateForm.headerTextColor}
                                  onChange={(e) => setTemplateForm({ ...templateForm, headerTextColor: e.target.value })}
                                  className="w-10 h-10 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={templateForm.headerTextColor}
                                  onChange={(e) => setTemplateForm({ ...templateForm, headerTextColor: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Background Color</label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={templateForm.headerBackgroundColor || '#FFFFFF'}
                                  onChange={(e) => setTemplateForm({ ...templateForm, headerBackgroundColor: e.target.value })}
                                  className="w-10 h-10 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={templateForm.headerBackgroundColor || ''}
                                  onChange={(e) => setTemplateForm({ ...templateForm, headerBackgroundColor: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                          </div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={templateForm.showSchoolLogo}
                              onChange={(e) => setTemplateForm({ ...templateForm, showSchoolLogo: e.target.checked })}
                              className="rounded text-violet-600"
                            />
                            <span className="text-sm">Show School Logo</span>
                          </label>
                          {templateForm.showSchoolLogo && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Logo Position</label>
                                <select
                                  value={templateForm.logoPosition}
                                  onChange={(e) => setTemplateForm({ ...templateForm, logoPosition: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                  {POSITIONS.map((pos) => (
                                    <option key={pos.id} value={pos.id}>{pos.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Logo Size (mm)</label>
                                <input
                                  type="number"
                                  value={templateForm.logoSizeMm}
                                  onChange={(e) => setTemplateForm({ ...templateForm, logoSizeMm: parseFloat(e.target.value) })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Photo Section */}
                <div className="mb-4">
                  <SectionHeader title="Photo Configuration" section="photo" icon={Image} />
                  {expandedSections.photo && (
                    <div className="p-4 space-y-4 bg-gray-50 rounded-b-lg mt-1">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={templateForm.showPhoto}
                          onChange={(e) => setTemplateForm({ ...templateForm, showPhoto: e.target.checked })}
                          className="rounded text-violet-600"
                        />
                        <span className="text-sm">Show Photo</span>
                      </label>
                      
                      {templateForm.showPhoto && (
                        <>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Position</label>
                              <select
                                value={templateForm.photoPosition}
                                onChange={(e) => setTemplateForm({ ...templateForm, photoPosition: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                {POSITIONS.map((pos) => (
                                  <option key={pos.id} value={pos.id}>{pos.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Size (mm)</label>
                              <input
                                type="number"
                                value={templateForm.photoSizeMm}
                                onChange={(e) => setTemplateForm({ ...templateForm, photoSizeMm: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Shape</label>
                              <select
                                value={templateForm.photoShape}
                                onChange={(e) => setTemplateForm({ ...templateForm, photoShape: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                {PHOTO_SHAPES.map((shape) => (
                                  <option key={shape.id} value={shape.id}>{shape.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Border Color</label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={templateForm.photoBorderColor}
                                  onChange={(e) => setTemplateForm({ ...templateForm, photoBorderColor: e.target.value })}
                                  className="w-10 h-10 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={templateForm.photoBorderColor}
                                  onChange={(e) => setTemplateForm({ ...templateForm, photoBorderColor: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Border Width (px)</label>
                              <input
                                type="number"
                                value={templateForm.photoBorderWidth}
                                onChange={(e) => setTemplateForm({ ...templateForm, photoBorderWidth: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Fields Section */}
                <div className="mb-4">
                  <SectionHeader title="Fields to Display" section="fields" icon={Type} />
                  {expandedSections.fields && (
                    <div className="p-4 bg-gray-50 rounded-b-lg mt-1">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableFields.map((field) => {
                          const isEnabled = templateForm.fieldsConfig.some(f => f.field === field.field);
                          const fieldConfig = templateForm.fieldsConfig.find(f => f.field === field.field) || field;
                          
                          return (
                            <div 
                              key={field.field}
                              className={`p-3 rounded-lg border ${isEnabled ? 'border-violet-200 bg-violet-50' : 'border-gray-200 bg-white'}`}
                            >
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={(e) => handleFieldToggle(field.field, e.target.checked)}
                                    className="rounded text-violet-600"
                                  />
                                  <span className="text-sm font-medium">{field.label}</span>
                                </label>
                                {isEnabled && (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={fieldConfig.fontSize || 12}
                                      onChange={(e) => handleFieldConfigChange(field.field, 'fontSize', parseInt(e.target.value))}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                                      placeholder="Size"
                                    />
                                    <select
                                      value={fieldConfig.fontWeight || 'normal'}
                                      onChange={(e) => handleFieldConfigChange(field.field, 'fontWeight', e.target.value)}
                                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                                    >
                                      <option value="normal">Normal</option>
                                      <option value="bold">Bold</option>
                                    </select>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Barcode Section */}
                <div className="mb-4">
                  <SectionHeader title="Barcode / QR Code" section="barcode" icon={QrCode} />
                  {expandedSections.barcode && (
                    <div className="p-4 space-y-4 bg-gray-50 rounded-b-lg mt-1">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={templateForm.showBarcode}
                          onChange={(e) => setTemplateForm({ ...templateForm, showBarcode: e.target.checked })}
                          className="rounded text-violet-600"
                        />
                        <span className="text-sm">Show Barcode/QR Code</span>
                      </label>
                      
                      {templateForm.showBarcode && (
                        <>
                          <div>
                            <label className="block text-xs text-gray-600 mb-2">Barcode Type</label>
                            <div className="grid grid-cols-2 gap-2">
                              {BARCODE_TYPES.map((type) => (
                                <button
                                  key={type.id}
                                  type="button"
                                  onClick={() => setTemplateForm({ ...templateForm, barcodeType: type.id })}
                                  className={`p-3 rounded-lg border text-left transition-all ${
                                    templateForm.barcodeType === type.id
                                      ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="font-medium text-sm">{type.label}</div>
                                  <div className="text-xs text-gray-500">{type.description}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Data Field</label>
                              <select
                                value={templateForm.barcodeDataField}
                                onChange={(e) => setTemplateForm({ ...templateForm, barcodeDataField: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                {templateForm.userType === 'student' ? (
                                  <>
                                    <option value="admissionNumber">Admission Number</option>
                                    <option value="rollNumber">Roll Number</option>
                                  </>
                                ) : (
                                  <option value="employeeId">Employee ID</option>
                                )}
                                <option value="id">System ID</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Position</label>
                              <select
                                value={templateForm.barcodePosition}
                                onChange={(e) => setTemplateForm({ ...templateForm, barcodePosition: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="bottom">Bottom</option>
                                <option value="top">Top</option>
                                <option value="right">Right Side</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Width (mm)</label>
                              <input
                                type="number"
                                value={templateForm.barcodeSizeMm}
                                onChange={(e) => setTemplateForm({ ...templateForm, barcodeSizeMm: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Height (mm)</label>
                              <input
                                type="number"
                                value={templateForm.barcodeHeightMm}
                                onChange={(e) => setTemplateForm({ ...templateForm, barcodeHeightMm: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                          </div>
                          
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={templateForm.showBarcodeText}
                              onChange={(e) => setTemplateForm({ ...templateForm, showBarcodeText: e.target.checked })}
                              className="rounded text-violet-600"
                            />
                            <span className="text-sm">Show text below barcode</span>
                          </label>

                          {/* Barcode Preview */}
                          <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-500 mb-2">Barcode Preview:</div>
                            <div className="flex justify-center">
                              {templateForm.barcodeType === 'qrcode' ? (
                                <div className="w-20 h-20 bg-white border border-gray-300 rounded flex items-center justify-center">
                                  <QrCode size={60} className="text-gray-800" />
                                </div>
                              ) : (
                                <div className="text-center">
                                  <div className="h-10 bg-gradient-to-r from-black via-white to-black w-32"
                                    style={{
                                      background: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px)',
                                    }}
                                  />
                                  {templateForm.showBarcodeText && (
                                    <div className="text-xs text-gray-700 mt-1 font-mono">
                                      {templateForm.barcodeDataField === 'admissionNumber' ? 'ADM2025001' : 'EMP001'}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Section */}
                <div className="mb-4">
                  <SectionHeader title="Footer Configuration" section="footer" icon={Type} />
                  {expandedSections.footer && (
                    <div className="p-4 space-y-4 bg-gray-50 rounded-b-lg mt-1">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={templateForm.showFooter}
                          onChange={(e) => setTemplateForm({ ...templateForm, showFooter: e.target.checked })}
                          className="rounded text-violet-600"
                        />
                        <span className="text-sm">Show Footer</span>
                      </label>
                      
                      {templateForm.showFooter && (
                        <>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Footer Text</label>
                            <input
                              type="text"
                              value={templateForm.footerText}
                              onChange={(e) => setTemplateForm({ ...templateForm, footerText: e.target.value })}
                              placeholder="e.g., If found, please return to school office"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                              <input
                                type="number"
                                value={templateForm.footerFontSize}
                                onChange={(e) => setTemplateForm({ ...templateForm, footerFontSize: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={templateForm.footerTextColor}
                                  onChange={(e) => setTemplateForm({ ...templateForm, footerTextColor: e.target.value })}
                                  className="w-10 h-10 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={templateForm.footerTextColor}
                                  onChange={(e) => setTemplateForm({ ...templateForm, footerTextColor: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Security Section */}
                <div className="mb-4">
                  <SectionHeader title="Security & Validity" section="security" icon={Settings} />
                  {expandedSections.security && (
                    <div className="p-4 space-y-4 bg-gray-50 rounded-b-lg mt-1">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={templateForm.showWatermark}
                          onChange={(e) => setTemplateForm({ ...templateForm, showWatermark: e.target.checked })}
                          className="rounded text-violet-600"
                        />
                        <span className="text-sm">Show Watermark</span>
                      </label>
                      
                      {templateForm.showWatermark && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Watermark Text</label>
                            <input
                              type="text"
                              value={templateForm.watermarkText}
                              onChange={(e) => setTemplateForm({ ...templateForm, watermarkText: e.target.value })}
                              placeholder="e.g., OFFICIAL"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Opacity</label>
                            <input
                              type="range"
                              min="0.05"
                              max="0.3"
                              step="0.01"
                              value={templateForm.watermarkOpacity}
                              onChange={(e) => setTemplateForm({ ...templateForm, watermarkOpacity: parseFloat(e.target.value) })}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={templateForm.showValidityDate}
                          onChange={(e) => setTemplateForm({ ...templateForm, showValidityDate: e.target.checked })}
                          className="rounded text-violet-600"
                        />
                        <span className="text-sm">Show Validity Dates</span>
                      </label>
                      
                      {templateForm.showValidityDate && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Valid From Label</label>
                              <input
                                type="text"
                                value={templateForm.validityStartText}
                                onChange={(e) => setTemplateForm({ ...templateForm, validityStartText: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Valid Till Label</label>
                              <input
                                type="text"
                                value={templateForm.validityEndText}
                                onChange={(e) => setTemplateForm({ ...templateForm, validityEndText: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Validity Period (days)</label>
                            <input
                              type="number"
                              value={templateForm.validityDays}
                              onChange={(e) => setTemplateForm({ ...templateForm, validityDays: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </>
                      )}
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={templateForm.showIssueDate}
                          onChange={(e) => setTemplateForm({ ...templateForm, showIssueDate: e.target.checked })}
                          className="rounded text-violet-600"
                        />
                        <span className="text-sm">Show Issue Date</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={templateForm.showSignature}
                          onChange={(e) => setTemplateForm({ ...templateForm, showSignature: e.target.checked })}
                          className="rounded text-violet-600"
                        />
                        <span className="text-sm">Show Signature Area</span>
                      </label>
                      
                      {templateForm.showSignature && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Signature Label</label>
                          <input
                            type="text"
                            value={templateForm.signatureLabel}
                            onChange={(e) => setTemplateForm({ ...templateForm, signatureLabel: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Additional Options */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <h4 className="font-medium text-gray-700 mb-2">Additional Options</h4>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={templateForm.showBloodGroup}
                      onChange={(e) => setTemplateForm({ ...templateForm, showBloodGroup: e.target.checked })}
                      className="rounded text-violet-600"
                    />
                    <span className="text-sm">Show Blood Group prominently</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={templateForm.showEmergencyContact}
                      onChange={(e) => setTemplateForm({ ...templateForm, showEmergencyContact: e.target.checked })}
                      className="rounded text-violet-600"
                    />
                    <span className="text-sm">Show Emergency Contact</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={templateForm.showAddress}
                      onChange={(e) => setTemplateForm({ ...templateForm, showAddress: e.target.checked })}
                      className="rounded text-violet-600"
                    />
                    <span className="text-sm">Show Address</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={templateForm.isDefault}
                      onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                      className="rounded text-violet-600"
                    />
                    <span className="text-sm">Set as default template for {templateForm.userType}s</span>
                  </label>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="w-1/2 bg-gray-100 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">Live Preview</h3>
                  <button
                    onClick={() => setFullscreenPreview(!fullscreenPreview)}
                    className="p-2 hover:bg-gray-200 rounded-lg"
                  >
                    {fullscreenPreview ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                </div>
                
                <div className="flex-1 flex items-center justify-center">
                  <div className="transform scale-110">
                    <IdCardPreview template={templateForm} scale={1.2} />
                  </div>
                </div>
                
                <div className="mt-4 text-center text-sm text-gray-500">
                  Actual size: {templateForm.widthMm}mm × {templateForm.heightMm}mm
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:shadow-lg"
              >
                <Save size={18} />
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdCardConfiguration;

