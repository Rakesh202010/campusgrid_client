import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, Printer, Search, Filter, ChevronDown, Users, GraduationCap, 
  UserCog, Download, Eye, CheckSquare, Square, RefreshCw, X, FileText,
  QrCode, Image, Building2, Calendar, User, Phone, Mail, MapPin, Droplets,
  FileDown, Settings, Copy, LayoutGrid, Rows, FileImage
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { idCards, students, teachers, people, classConfig, academicSessions, auth } from '../services/api';
import { toast } from '../utils/toast';

const USER_TYPES = [
  { id: 'student', label: 'Students', icon: GraduationCap, color: 'blue' },
  { id: 'teacher', label: 'Teachers', icon: Users, color: 'green' },
  { id: 'staff', label: 'Non-Teaching Staff', icon: UserCog, color: 'orange' },
];

// Print layout options
const PRINT_LAYOUTS = [
  { id: 'single', label: 'Single', icon: Rows, cols: 1, description: '1 card per row' },
  { id: 'grid', label: '2 Column', icon: LayoutGrid, cols: 2, description: '2 cards per row' },
  { id: 'compact', label: '3 Column', icon: LayoutGrid, cols: 3, description: '3 cards per row' },
  { id: 'dense', label: '4 Column', icon: LayoutGrid, cols: 4, description: '4 cards per row' },
];

// Paper size options
const PAPER_SIZES = [
  { id: 'a4', label: 'A4', width: 210, height: 297 },
  { id: 'letter', label: 'Letter', width: 215.9, height: 279.4 },
  { id: 'legal', label: 'Legal', width: 215.9, height: 355.6 },
];

// Orientation options
const ORIENTATIONS = [
  { id: 'portrait', label: 'Portrait', description: 'Vertical layout' },
  { id: 'landscape', label: 'Landscape', description: 'Horizontal layout' },
];

// Generate barcode as data URL
const generateBarcodeDataURL = (value, options = {}) => {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value || 'N/A', {
      format: options.format || 'CODE128',
      width: options.width || 2,
      height: options.height || 40,
      displayValue: options.displayValue !== false,
      fontSize: options.fontSize || 12,
      margin: options.margin || 5,
      background: options.background || '#ffffff',
      lineColor: options.lineColor || '#000000',
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Barcode generation error:', error);
    return null;
  }
};

// Generate QR code as data URL
const generateQRCodeDataURL = async (value, options = {}) => {
  try {
    const dataUrl = await QRCode.toDataURL(value || 'N/A', {
      width: options.width || 100,
      margin: options.margin || 1,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#ffffff',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    });
    return dataUrl;
  } catch (error) {
    console.error('QR code generation error:', error);
    return null;
  }
};

const IdCardPrint = () => {
  const [selectedUserType, setSelectedUserType] = useState('student');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolInfo, setSchoolInfo] = useState(null);
  
  // Filters for students
  const [classSections, setClassSections] = useState([]);
  const [selectedClassSection, setSelectedClassSection] = useState('');
  const [academicSession, setAcademicSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  
  // Filters for teachers/staff
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  
  // Preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewUser, setPreviewUser] = useState(null);
  
  // Print modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printing, setPrinting] = useState(false);
  
  // Print options
  const [printOptions, setPrintOptions] = useState({
    layout: 'grid',
    paperSize: 'a4',
    orientation: 'portrait',
    copies: 1,
    includeBackSide: false,
    showBorder: true,
    marginMm: 10,
  });
  
  // Export options
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Preview barcode
  const [previewBarcodeUrl, setPreviewBarcodeUrl] = useState(null);
  
  // Refs for PDF generation
  const printContainerRef = useRef(null);

  useEffect(() => {
    fetchSchoolInfo();
    fetchAcademicSessions();
    fetchDepartments();
  }, []);

  // Fetch class sections when session changes
  useEffect(() => {
    const sessionId = selectedSession || academicSession?.id;
    fetchClassSections(sessionId);
    setSelectedClassSection(''); // Reset class filter when session changes
  }, [selectedSession, academicSession]);

  useEffect(() => {
    if (academicSession || selectedSession) {
      fetchTemplates();
      fetchUsers();
      setSelectedUsers([]);
    }
  }, [selectedUserType, academicSession, selectedSession, selectedClassSection, selectedDepartment, statusFilter]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

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

  const fetchAcademicSessions = async () => {
    try {
      const response = await academicSessions.getAll();
      if (response.success) {
        setSessions(response.data || []);
        // Get current session
        const currentResponse = await academicSessions.getCurrent();
        if (currentResponse.success && currentResponse.data) {
          setAcademicSession(currentResponse.data);
          setSelectedSession(currentResponse.data.id);
        }
      }
    } catch (error) {
      console.error('Error fetching academic sessions:', error);
    }
  };

  const fetchClassSections = async (sessionId = null) => {
    try {
      const params = {};
      // Filter by academic session if provided
      if (sessionId) {
        params.academic_session_id = sessionId;
      }
      const response = await classConfig.getClassSections(params);
      if (response.success) {
        // Remove duplicates based on displayName
        const uniqueSections = [];
        const seen = new Set();
        for (const cs of (response.data || [])) {
          const key = cs.displayName || cs.display_name || 
                     `${cs.gradeDisplayName || cs.gradeName || ''}-${cs.sectionDisplayName || cs.sectionName || ''}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueSections.push(cs);
          }
        }
        setClassSections(uniqueSections);
      }
    } catch (error) {
      console.error('Error fetching class sections:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await people.getDepartments();
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await idCards.getTemplates({ user_type: selectedUserType, is_active: 'true' });
      if (response.success) {
        setTemplates(response.data || []);
        const defaultTemplate = response.data?.find(t => t.is_default) || response.data?.[0];
        setSelectedTemplate(defaultTemplate || null);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let response;
      const sessionId = selectedSession || academicSession?.id;
      
      switch (selectedUserType) {
        case 'student':
          const studentParams = {
            limit: 500,
            status: statusFilter || 'active',
          };
          if (sessionId) studentParams.academic_session_id = sessionId;
          if (selectedClassSection) studentParams.class_section_id = selectedClassSection;
          
          response = await students.getAll(studentParams);
          if (response.success) {
            setUsers(response.data || []);
          }
          break;
          
        case 'teacher':
          const teacherParams = { limit: 500 };
          if (sessionId) teacherParams.academic_session_id = sessionId;
          if (selectedDepartment) teacherParams.department_id = selectedDepartment;
          if (statusFilter) teacherParams.status = statusFilter;
          
          response = await teachers.getAll(teacherParams);
          if (response.success) {
            setUsers(response.data || []);
          }
          break;
          
        case 'staff':
          const staffParams = {};
          if (selectedDepartment) staffParams.department = selectedDepartment;
          if (statusFilter) staffParams.status = statusFilter;
          
          response = await people.getStaff(staffParams);
          if (response.success) {
            setUsers(response.data || []);
          }
          break;
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        // Handle both camelCase and snake_case field names
        const firstName = user.firstName || user.first_name || '';
        const lastName = user.lastName || user.last_name || '';
        const name = `${firstName} ${lastName}`.toLowerCase();
        const admissionNum = (user.admissionNumber || user.admission_number || '').toLowerCase();
        const employeeId = (user.employeeId || user.employee_id || '').toLowerCase();
        const phone = (user.phone || user.contactNumber || user.contact_number || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        
        return name.includes(term) || 
               admissionNum.includes(term) || 
               employeeId.includes(term) ||
               phone.includes(term) ||
               email.includes(term);
      });
    }
    
    setFilteredUsers(filtered);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const selectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handlePreview = async (user) => {
    setPreviewUser(user);
    setShowPreview(true);
    
    // Generate barcode for preview
    if (selectedTemplate) {
      const admissionNumber = user.admissionNumber || user.admission_number || '';
      const employeeId = user.employeeId || user.employee_id || '';
      const barcodeValue = admissionNumber || employeeId || user.id?.substring(0, 12) || 'N/A';
      const barcodeType = selectedTemplate.barcode_type || selectedTemplate.barcodeType || 'code128';
      
      try {
        if (barcodeType === 'qrcode') {
          const qrData = JSON.stringify({
            id: barcodeValue,
            name: user.fullName || `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim(),
            type: selectedUserType,
          });
          const qrUrl = await generateQRCodeDataURL(qrData, { width: 150 });
          setPreviewBarcodeUrl(qrUrl);
        } else {
          const format = barcodeType === 'code39' ? 'CODE39' : 
                        barcodeType === 'ean13' ? 'EAN13' : 'CODE128';
          const barcodeUrl = generateBarcodeDataURL(barcodeValue, { 
            format,
            height: 50,
            width: 2,
            fontSize: 14,
            displayValue: selectedTemplate.show_barcode_text !== false && selectedTemplate.showBarcodeText !== false,
          });
          setPreviewBarcodeUrl(barcodeUrl);
        }
      } catch (error) {
        console.error('Error generating preview barcode:', error);
        setPreviewBarcodeUrl(null);
      }
    }
  };

  const handlePrint = () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    setShowPrintModal(true);
  };

  const handleExportPDF = () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    setShowExportModal(true);
  };

  // Pre-generate barcodes/QR codes for all users
  const generateBarcodesForUsers = async (usersData, template) => {
    const barcodeMap = {};
    const barcodeType = template.barcode_type || template.barcodeType || 'code128';
    
    for (const user of usersData) {
      const admissionNumber = user.admissionNumber || user.admission_number || '';
      const employeeId = user.employeeId || user.employee_id || '';
      const barcodeValue = admissionNumber || employeeId || user.id?.substring(0, 12) || 'N/A';
      
      try {
        if (barcodeType === 'qrcode') {
          // Generate QR code with user info
          const qrData = JSON.stringify({
            id: barcodeValue,
            name: user.fullName || `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim(),
            type: selectedUserType,
          });
          barcodeMap[user.id] = await generateQRCodeDataURL(qrData, { width: 120 });
        } else {
          // Generate barcode
          const format = barcodeType === 'code39' ? 'CODE39' : 
                        barcodeType === 'ean13' ? 'EAN13' : 'CODE128';
          barcodeMap[user.id] = generateBarcodeDataURL(barcodeValue, { 
            format,
            height: 35,
            width: 1.5,
            fontSize: 10,
            displayValue: template.show_barcode_text !== false && template.showBarcodeText !== false,
          });
        }
      } catch (error) {
        console.error(`Error generating barcode for user ${user.id}:`, error);
        barcodeMap[user.id] = null;
      }
    }
    
    return barcodeMap;
  };

  const executePrint = async () => {
    setPrinting(true);
    try {
      const selectedUserData = filteredUsers.filter(u => selectedUsers.includes(u.id));
      
      // Pre-generate all barcodes
      const barcodeMap = await generateBarcodesForUsers(selectedUserData, selectedTemplate);
      
      const printContent = generatePrintHTML(selectedUserData, selectedTemplate, printOptions, barcodeMap);
      
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-10000px';
      printFrame.style.left = '-10000px';
      document.body.appendChild(printFrame);
      
      const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(printContent);
      frameDoc.close();
      
      printFrame.onload = () => {
        setTimeout(() => {
          printFrame.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(printFrame);
            setPrinting(false);
            setShowPrintModal(false);
            recordPrintHistory(selectedUserData);
            toast.success(`Printed ${selectedUserData.length} ID card(s)`);
          }, 1000);
        }, 500);
      };
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print ID cards');
      setPrinting(false);
    }
  };

  const executeExportPDF = async () => {
    setExporting(true);
    try {
      const selectedUserData = filteredUsers.filter(u => selectedUsers.includes(u.id));
      const paperSize = PAPER_SIZES.find(p => p.id === printOptions.paperSize) || PAPER_SIZES[0];
      
      // Pre-generate all barcodes
      const barcodeMap = await generateBarcodesForUsers(selectedUserData, selectedTemplate);
      
      // Create a container for PDF generation
      const container = document.createElement('div');
      container.innerHTML = generatePrintHTML(selectedUserData, selectedTemplate, printOptions, barcodeMap);
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);
      
      const element = container.querySelector('.cards-container') || container;
      
      const opt = {
        margin: printOptions.marginMm,
        filename: `ID_Cards_${selectedUserType}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
        },
        jsPDF: { 
          unit: 'mm', 
          format: printOptions.paperSize === 'letter' ? 'letter' : printOptions.paperSize === 'legal' ? 'legal' : 'a4',
          orientation: printOptions.orientation || 'portrait',
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };
      
      await html2pdf().set(opt).from(element).save();
      
      document.body.removeChild(container);
      setExporting(false);
      setShowExportModal(false);
      recordPrintHistory(selectedUserData);
      toast.success(`Exported ${selectedUserData.length} ID card(s) to PDF`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
      setExporting(false);
    }
  };

  const recordPrintHistory = async (usersData) => {
    try {
      for (const user of usersData) {
        const barcodeValue = user.admissionNumber || user.admission_number || 
                            user.employeeId || user.employee_id || user.id;
        await idCards.recordPrint({
          templateId: selectedTemplate.id,
          userId: user.id,
          userType: selectedUserType,
          barcodeValue: barcodeValue,
          validityStart: new Date().toISOString().split('T')[0],
          validityEnd: new Date(Date.now() + (selectedTemplate.validity_days || 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          academicSessionId: selectedSession || academicSession?.id,
        });
      }
    } catch (error) {
      console.error('Error recording print history:', error);
    }
  };

  // Helper function to get user field value (handles both camelCase and snake_case)
  const getUserField = (user, ...fieldNames) => {
    for (const field of fieldNames) {
      if (user[field]) return user[field];
    }
    return '';
  };

  const generatePrintHTML = (usersData, template, options = printOptions, barcodeMap = {}) => {
    // For portrait: width should be smaller, height should be larger
    // For landscape: width should be larger, height should be smaller
    const isPortrait = template.orientation === 'portrait';
    const cardWidth = isPortrait ? Math.min(template.width_mm || 53.98, template.height_mm || 85.6) : Math.max(template.width_mm || 85.6, template.height_mm || 53.98);
    const cardHeight = isPortrait ? Math.max(template.width_mm || 53.98, template.height_mm || 85.6) : Math.min(template.width_mm || 85.6, template.height_mm || 53.98);
    
    // Get layout configuration
    const layout = PRINT_LAYOUTS.find(l => l.id === options.layout) || PRINT_LAYOUTS[0];
    const paperSize = PAPER_SIZES.find(p => p.id === options.paperSize) || PAPER_SIZES[0];
    const orientation = options.orientation || 'portrait';
    const margin = options.marginMm || 10;
    const gap = 5; // Gap between cards in mm
    
    // Calculate effective paper dimensions based on orientation
    const effectivePaperWidth = orientation === 'landscape' ? paperSize.height : paperSize.width;
    const effectivePaperHeight = orientation === 'landscape' ? paperSize.width : paperSize.height;
    
    // Calculate cards per row based on layout and paper size
    const availableWidth = effectivePaperWidth - (margin * 2);
    const cardsPerRow = layout.cols;
    
    const cards = usersData.map(user => generateCardHTML(user, template, options, barcodeMap[user.id])).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ID Cards - ${schoolInfo?.name || 'School'}</title>
        <style>
          @page {
            size: ${paperSize.id === 'a4' ? 'A4' : paperSize.id === 'letter' ? 'letter' : 'legal'} ${orientation};
            margin: ${margin}mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: ${template.header_font_family || 'Arial'}, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-header {
            text-align: center;
            margin-bottom: 5mm;
            padding-bottom: 3mm;
            border-bottom: 1px solid #ddd;
            display: none;
          }
          .print-header h2 {
            font-size: 14pt;
            color: #333;
          }
          .print-header p {
            font-size: 9pt;
            color: #666;
          }
          .cards-container {
            display: grid;
            grid-template-columns: repeat(${cardsPerRow}, 1fr);
            gap: ${gap}mm;
            justify-items: center;
          }
          .id-card {
            width: ${cardWidth}mm;
            height: ${cardHeight}mm;
            border: ${options.showBorder ? '1px solid #333' : 'none'};
            border-radius: 3mm;
            overflow: hidden;
            background-color: ${template.background_color || '#FFFFFF'};
            page-break-inside: avoid;
            position: relative;
            box-shadow: ${options.showBorder ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};
          }
          .card-header {
            background: ${template.header_background_color || 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)'};
            color: ${template.header_text_color || '#FFFFFF'};
            padding: 2mm 3mm;
            display: flex;
            align-items: center;
            gap: 2mm;
          }
          .school-logo {
            width: ${template.logo_size_mm || 10}mm;
            height: ${template.logo_size_mm || 10}mm;
            background: #fff;
            border-radius: 1mm;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 5pt;
            color: #666;
            overflow: hidden;
          }
          .school-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .header-text {
            flex: 1;
          }
          .school-name {
            font-size: ${(template.header_font_size || 14) * 0.5}pt;
            font-weight: ${template.header_font_weight || 'bold'};
            line-height: 1.2;
          }
          .card-type {
            font-size: 6pt;
            text-transform: uppercase;
            opacity: 0.9;
            margin-top: 0.5mm;
          }
          .card-body {
            display: flex;
            flex-direction: ${(template.orientation === 'portrait' && template.portrait_layout !== 'photo-left') ? 'column' : 'row'};
            padding: 2mm;
            gap: 2mm;
            height: calc(100% - 15mm);
            ${(template.orientation === 'portrait' && template.portrait_layout !== 'photo-left') ? 'align-items: center;' : ''}
          }
          .photo-section {
            width: ${template.photo_size_mm || 20}mm;
            height: ${(template.photo_size_mm || 20) * 1.25}mm;
            border: ${template.photo_border_width || 1}px solid ${template.photo_border_color || '#333'};
            border-radius: ${template.photo_shape === 'circle' ? '50%' : template.photo_shape === 'rounded' ? '2mm' : '1mm'};
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            flex-shrink: 0;
            ${(template.orientation === 'portrait' && template.portrait_layout !== 'photo-left') ? 'margin: 0 auto;' : ''}
          }
          .photo-section img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .photo-placeholder {
            font-size: 6pt;
            color: #999;
          }
          .info-section {
            flex: 1;
            font-size: ${template.info_font_size || 7}pt;
            line-height: 1.5;
            overflow: hidden;
            text-align: ${template.info_alignment || 'left'};
            ${(template.orientation === 'portrait' && template.portrait_layout !== 'photo-left') ? 'width: 100%;' : ''}
          }
          .student-name {
            font-size: ${template.name_font_size || 9}pt;
            font-weight: ${template.name_font_weight || 'bold'};
            color: ${template.name_text_color || '#333'};
            text-align: ${template.name_alignment || 'left'};
            margin-bottom: 1mm;
            border-bottom: 0.5px solid #ddd;
            padding-bottom: 1mm;
          }
          .info-row {
            display: flex;
            margin-bottom: 0.3mm;
          }
          .info-label {
            color: #666;
            min-width: 15mm;
            font-size: 6pt;
          }
          .info-value {
            font-weight: 500;
            color: #333;
            font-size: 7pt;
          }
          .blood-group {
            display: inline-block;
            background: #FFEBEE;
            color: #C62828;
            padding: 0.5mm 1.5mm;
            border-radius: 1mm;
            font-weight: bold;
            font-size: 7pt;
            margin-top: 1mm;
          }
          .barcode-section {
            background: #fafafa;
            padding: 1.5mm;
            text-align: center;
            border-top: 0.5px solid #ddd;
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
          }
          .barcode {
            height: ${template.barcode_height_mm || 8}mm;
            background: repeating-linear-gradient(90deg, #000 0px, #000 1px, #fff 1px, #fff 2.5px);
            width: ${template.barcode_size_mm || 30}mm;
            margin: 0 auto;
          }
          .barcode-text {
            font-size: 6pt;
            font-family: 'Courier New', monospace;
            margin-top: 0.5mm;
            letter-spacing: 0.5px;
          }
          .qr-code {
            width: ${template.barcode_size_mm || 12}mm;
            height: ${template.barcode_size_mm || 12}mm;
            background: #000;
            margin: 0 auto;
          }
          .validity {
            font-size: 5pt;
            color: #666;
            display: flex;
            justify-content: space-between;
            padding: 0 2mm;
            margin-top: 0.5mm;
          }
          .card-footer {
            font-size: 5pt;
            color: ${template.footer_text_color || '#666'};
            text-align: center;
            padding: 1mm;
            border-top: 0.5px solid #eee;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 14pt;
            color: rgba(0,0,0,${template.watermark_opacity || 0.08});
            pointer-events: none;
            white-space: nowrap;
          }
          @media print {
            .cards-container {
              gap: 5mm;
            }
            .id-card {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="cards-container">
          ${cards}
        </div>
      </body>
      </html>
    `;
  };

  const generateCardHTML = (user, template, options = {}, barcodeDataUrl = null) => {
    // Handle both camelCase and snake_case field names
    const firstName = user.firstName || user.first_name || '';
    const middleName = user.middleName || user.middle_name || '';
    const lastName = user.lastName || user.last_name || '';
    const fullName = user.fullName || `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
    
    const admissionNumber = user.admissionNumber || user.admission_number || '';
    const employeeId = user.employeeId || user.employee_id || '';
    const idNumber = admissionNumber || employeeId || user.id?.substring(0, 8);
    
    const rollNumber = user.rollNumber || user.roll_number || '';
    // Handle class name with multiple possible field names
    const className = user.className || user.class_name || user.gradeName || user.grade_name || 
                     user.gradeDisplayName || user.grade_display_name || '';
    const sectionName = user.sectionName || user.section_name || 
                       user.sectionDisplayName || user.section_display_name || '';
    // Create proper class display - check if className already contains section info
    const classDisplay = className.includes('-') ? className : (className || '');
    
    const dateOfBirth = user.dateOfBirth || user.date_of_birth;
    const dobFormatted = dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('en-IN') : '';
    
    const bloodGroup = user.bloodGroup || user.blood_group || '';
    const phone = user.phone || user.contactNumber || user.contact_number || '';
    const email = user.email || '';
    const photoUrl = user.photoUrl || user.photo_url || '';
    
    // For teachers/staff
    const designation = user.designation || '';
    const department = user.departmentName || user.department_name || user.department || '';
    const qualification = user.qualification || '';
    const joiningDate = user.dateOfJoining || user.date_of_joining || user.joiningDate;
    const joiningDateFormatted = joiningDate ? new Date(joiningDate).toLocaleDateString('en-IN') : '';
    
    // Address
    const address = user.address?.line1 || user.address_line1 || user.address || '';
    const city = user.address?.city || user.city || '';
    
    // Parent info (for students)
    const fatherName = user.fatherName || user.father_name || '';
    const motherName = user.motherName || user.mother_name || '';
    
    const validityStart = new Date().toLocaleDateString('en-IN');
    const validityEnd = new Date(Date.now() + (template.validity_days || 365) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');

    // Check template settings for showing fields
    const showLabels = template.show_labels !== false;
    const showFatherName = template.show_father_name !== false;
    const showMotherName = template.show_mother_name === true;
    const showContactNumber = template.show_contact_number !== false;
    const showAddress = template.show_address === true;

    // Build info rows based on user type
    let infoRows = '';
    
    const formatRow = (label, value) => {
      if (!value) return '';
      return `<div class="info-row">${showLabels ? `<span class="info-label">${label}:</span>` : ''}<span class="info-value">${value}</span></div>`;
    };
    
    if (selectedUserType === 'student') {
      infoRows = `
        ${formatRow('Adm No', admissionNumber)}
        ${formatRow('Class', classDisplay ? `${classDisplay}${sectionName ? ` - ${sectionName}` : ''}` : '')}
        ${formatRow('Roll No', rollNumber)}
        ${formatRow('DOB', dobFormatted)}
        ${showFatherName ? formatRow('Father', fatherName) : ''}
        ${showMotherName ? formatRow('Mother', motherName) : ''}
        ${showContactNumber ? formatRow('Contact', phone) : ''}
        ${showAddress ? formatRow('Address', `${address}${city ? `, ${city}` : ''}`) : ''}
      `;
    } else {
      infoRows = `
        ${formatRow('Emp ID', employeeId)}
        ${formatRow('Designation', designation)}
        ${formatRow('Department', department)}
        ${formatRow('DOB', dobFormatted)}
        ${showContactNumber ? formatRow('Contact', phone) : ''}
        ${formatRow('Joined', joiningDateFormatted)}
      `;
    }

    return `
      <div class="id-card">
        ${template.show_watermark && template.watermark_text ? `<div class="watermark">${template.watermark_text}</div>` : ''}
        
        ${template.show_header !== false ? `
          <div class="card-header">
            ${template.show_school_logo !== false ? `
              <div class="school-logo">
                ${schoolInfo?.logo_url ? `<img src="${schoolInfo.logo_url}" alt="Logo">` : 'LOGO'}
              </div>
            ` : ''}
            <div class="header-text">
              <div class="school-name">${template.header_text || schoolInfo?.name || 'School Name'}</div>
              <div class="card-type">${selectedUserType === 'student' ? 'Student' : selectedUserType === 'teacher' ? 'Teacher' : 'Staff'} Identity Card</div>
            </div>
          </div>
        ` : ''}
        
        <div class="card-body">
          ${template.show_photo !== false ? `
            <div class="photo-section">
              ${photoUrl ? `<img src="${photoUrl}" alt="Photo">` : '<span class="photo-placeholder">PHOTO</span>'}
            </div>
          ` : ''}
          
          <div class="info-section">
            <div class="student-name">${fullName}</div>
            ${infoRows}
            ${template.show_blood_group !== false && bloodGroup ? `<span class="blood-group">${bloodGroup}</span>` : ''}
          </div>
        </div>
        
        ${template.show_barcode !== false ? `
          <div class="barcode-section">
            ${barcodeDataUrl ? `
              <img src="${barcodeDataUrl}" alt="Barcode" class="barcode-image" style="max-width: 100%; height: auto; ${(template.barcode_type || template.barcodeType) === 'qrcode' ? 'width: 20mm; height: 20mm;' : 'height: 12mm;'}" />
            ` : (template.barcode_type || template.barcodeType) === 'qrcode' ? `
              <div class="qr-code" style="width: 15mm; height: 15mm; background: #333;"></div>
            ` : `
              <div class="barcode" style="height: 10mm;"></div>
              ${(template.show_barcode_text !== false && template.showBarcodeText !== false) ? `<div class="barcode-text">${idNumber}</div>` : ''}
            `}
            ${template.show_validity_date !== false ? `
              <div class="validity">
                <span>${template.validity_start_text || template.validityStartText || 'Valid From:'} ${validityStart}</span>
                <span>${template.validity_end_text || template.validityEndText || 'Valid Till:'} ${validityEnd}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        ${template.show_footer && template.footer_text ? `
          <div class="card-footer">${template.footer_text}</div>
        ` : ''}
      </div>
    `;
  };

  // Get display values for user card
  const getUserDisplayInfo = (user) => {
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    const fullName = user.fullName || `${firstName} ${lastName}`.trim();
    const admissionNumber = user.admissionNumber || user.admission_number || '';
    const employeeId = user.employeeId || user.employee_id || '';
    const idNumber = admissionNumber || employeeId || 'No ID';
    // Handle class name with multiple possible field names
    const className = user.className || user.class_name || user.gradeName || user.grade_name || 
                     user.gradeDisplayName || user.grade_display_name || '';
    const sectionName = user.sectionName || user.section_name || 
                       user.sectionDisplayName || user.section_display_name || '';
    const designation = user.designation || '';
    const department = user.departmentName || user.department_name || user.department || '';
    const photoUrl = user.photoUrl || user.photo_url || '';
    const phone = user.phone || user.contactNumber || '';
    const bloodGroup = user.bloodGroup || user.blood_group || '';
    
    return { fullName, firstName, lastName, idNumber, className, sectionName, designation, department, photoUrl, phone, bloodGroup };
  };

  // Render ID Card Preview Component
  const renderIdCardPreview = (user, template, scale = 1.8) => {
    if (!user || !template) return null;
    
    // Get user data
    const firstName = user.firstName || user.first_name || '';
    const middleName = user.middleName || user.middle_name || '';
    const lastName = user.lastName || user.last_name || '';
    const fullName = user.fullName || `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
    
    const admissionNumber = user.admissionNumber || user.admission_number || '';
    const employeeId = user.employeeId || user.employee_id || '';
    const idNumber = admissionNumber || employeeId || user.id?.substring(0, 8);
    
    const rollNumber = user.rollNumber || user.roll_number || '';
    // Handle class name with multiple possible field names
    const className = user.className || user.class_name || user.gradeName || user.grade_name || 
                     user.gradeDisplayName || user.grade_display_name || '';
    const sectionName = user.sectionName || user.section_name || 
                       user.sectionDisplayName || user.section_display_name || '';
    
    const dateOfBirth = user.dateOfBirth || user.date_of_birth;
    const dobFormatted = dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('en-IN') : '';
    
    const bloodGroup = user.bloodGroup || user.blood_group || '';
    const phone = user.phone || user.contactNumber || user.contact_number || '';
    const photoUrl = user.photoUrl || user.photo_url || '';
    
    const designation = user.designation || '';
    const department = user.departmentName || user.department_name || user.department || '';
    const joiningDate = user.dateOfJoining || user.date_of_joining || user.joiningDate;
    const joiningDateFormatted = joiningDate ? new Date(joiningDate).toLocaleDateString('en-IN') : '';
    
    const fatherName = user.fatherName || user.father_name || '';
    
    const validityStart = new Date().toLocaleDateString('en-IN');
    const validityEnd = new Date(Date.now() + (template.validity_days || 365) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');
    
    // Convert mm to px (1mm ≈ 3.78px at 96dpi)
    const mmToPx = 3.78;
    const isPortrait = template.orientation === 'portrait';
    // For portrait: width should be smaller, height should be larger
    // For landscape: width should be larger, height should be smaller
    const cardWidthMm = isPortrait ? Math.min(template.width_mm || 53.98, template.height_mm || 85.6) : Math.max(template.width_mm || 85.6, template.height_mm || 53.98);
    const cardHeightMm = isPortrait ? Math.max(template.width_mm || 53.98, template.height_mm || 85.6) : Math.min(template.width_mm || 85.6, template.height_mm || 53.98);
    const cardWidth = cardWidthMm * mmToPx * scale;
    const cardHeight = cardHeightMm * mmToPx * scale;
    const photoSize = (template.photo_size_mm || 22) * mmToPx * scale;
    const logoSize = (template.logo_size_mm || 12) * mmToPx * scale;
    
    return (
      <div 
        style={{
          width: cardWidth,
          height: cardHeight,
          backgroundColor: template.background_color || '#FFFFFF',
          borderRadius: 12 * scale,
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          position: 'relative',
          fontFamily: template.header_font_family || 'Arial, sans-serif',
          border: '1px solid #ccc',
        }}
      >
        {/* Watermark */}
        {template.show_watermark && template.watermark_text && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontSize: 16 * scale,
            color: `rgba(0,0,0,${template.watermark_opacity || 0.08})`,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1,
          }}>
            {template.watermark_text}
          </div>
        )}
        
        {/* Header */}
        {template.show_header !== false && (
          <div style={{
            background: template.header_background_color || 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
            color: template.header_text_color || '#FFFFFF',
            padding: `${8 * scale}px ${12 * scale}px`,
            display: 'flex',
            alignItems: 'center',
            gap: 8 * scale,
          }}>
            {template.show_school_logo !== false && (
              <div style={{
                width: logoSize,
                height: logoSize,
                backgroundColor: '#fff',
                borderRadius: 4 * scale,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                {schoolInfo?.logo_url ? (
                  <img src={schoolInfo.logo_url} alt="Logo" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 8 * scale, color: '#666' }}>LOGO</span>
                )}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: (template.header_font_size || 14) * 0.7 * scale,
                fontWeight: template.header_font_weight || 'bold',
                lineHeight: 1.2,
              }}>
                {template.header_text || schoolInfo?.name || 'School Name'}
              </div>
              <div style={{
                fontSize: 8 * scale,
                textTransform: 'uppercase',
                opacity: 0.9,
                marginTop: 2 * scale,
              }}>
                {selectedUserType === 'student' ? 'Student' : selectedUserType === 'teacher' ? 'Teacher' : 'Staff'} Identity Card
              </div>
            </div>
          </div>
        )}
        
        {/* Body */}
        <div style={{
          display: 'flex',
          flexDirection: (template.orientation === 'portrait' && template.portrait_layout !== 'photo-left') ? 'column' : 'row',
          alignItems: (template.orientation === 'portrait' && template.portrait_layout !== 'photo-left') ? 'center' : 'flex-start',
          padding: 10 * scale,
          gap: 8 * scale,
          flex: 1,
        }}>
          {/* Photo */}
          {template.show_photo !== false && (
            <div style={{
              width: photoSize,
              height: photoSize * 1.25,
              border: `${(template.photo_border_width || 2) * scale}px solid ${template.photo_border_color || '#333'}`,
              borderRadius: template.photo_shape === 'circle' ? '50%' : template.photo_shape === 'rounded' ? 8 * scale : 4 * scale,
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {photoUrl ? (
                <img src={photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 10 * scale, color: '#999' }}>PHOTO</span>
              )}
            </div>
          )}
          
          {/* Info */}
          <div style={{ 
            flex: 1, 
            fontSize: (template.info_font_size || 9) * scale, 
            lineHeight: 1.6,
            width: (template.orientation === 'portrait' && template.portrait_layout !== 'photo-left') ? '100%' : 'auto',
            textAlign: template.info_alignment || 'left',
          }}>
            <div style={{
              fontSize: (template.name_font_size || 12) * scale,
              fontWeight: template.name_font_weight || 'bold',
              color: template.name_text_color || '#333',
              textAlign: template.name_alignment || 'left',
              marginBottom: 6 * scale,
              borderBottom: '1px solid #ddd',
              paddingBottom: 4 * scale,
            }}>
              {fullName}
            </div>
            
            {selectedUserType === 'student' ? (
              <>
                {admissionNumber && <InfoRow label="Adm No" value={admissionNumber} scale={scale} />}
                {className && <InfoRow label="Class" value={`${className}${sectionName ? ` - ${sectionName}` : ''}`} scale={scale} />}
                {rollNumber && <InfoRow label="Roll No" value={rollNumber} scale={scale} />}
                {dobFormatted && <InfoRow label="DOB" value={dobFormatted} scale={scale} />}
                {fatherName && <InfoRow label="Father" value={fatherName} scale={scale} />}
                {phone && <InfoRow label="Contact" value={phone} scale={scale} />}
              </>
            ) : (
              <>
                {employeeId && <InfoRow label="Emp ID" value={employeeId} scale={scale} />}
                {designation && <InfoRow label="Designation" value={designation} scale={scale} />}
                {department && <InfoRow label="Dept" value={department} scale={scale} />}
                {dobFormatted && <InfoRow label="DOB" value={dobFormatted} scale={scale} />}
                {phone && <InfoRow label="Contact" value={phone} scale={scale} />}
                {joiningDateFormatted && <InfoRow label="Joined" value={joiningDateFormatted} scale={scale} />}
              </>
            )}
            
            {template.show_blood_group !== false && bloodGroup && (
              <span style={{
                display: 'inline-block',
                backgroundColor: '#FFEBEE',
                color: '#C62828',
                padding: `${2 * scale}px ${6 * scale}px`,
                borderRadius: 4 * scale,
                fontWeight: 'bold',
                fontSize: 9 * scale,
                marginTop: 4 * scale,
              }}>
                {bloodGroup}
              </span>
            )}
          </div>
        </div>
        
        {/* Barcode Section */}
        {template.show_barcode !== false && (
          <div style={{
            backgroundColor: '#fafafa',
            padding: `${6 * scale}px`,
            textAlign: 'center',
            borderTop: '1px solid #ddd',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }}>
            {previewBarcodeUrl ? (
              <img 
                src={previewBarcodeUrl} 
                alt="Barcode" 
                style={{ 
                  maxWidth: '90%',
                  height: (template.barcode_type || template.barcodeType) === 'qrcode' ? 50 * scale : 'auto',
                  maxHeight: 50 * scale,
                }} 
              />
            ) : (template.barcode_type || template.barcodeType) === 'qrcode' ? (
              <div style={{
                width: 40 * scale,
                height: 40 * scale,
                backgroundColor: '#333',
                margin: '0 auto',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <QrCode size={30 * scale} className="text-white" />
              </div>
            ) : (
              <>
                <div style={{
                  height: 28 * scale,
                  background: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px)',
                  width: 100 * scale,
                  margin: '0 auto',
                }} />
                {(template.show_barcode_text !== false && template.showBarcodeText !== false) && (
                  <div style={{
                    fontSize: 8 * scale,
                    fontFamily: 'Courier New, monospace',
                    marginTop: 2 * scale,
                    letterSpacing: 1,
                  }}>
                    {idNumber}
                  </div>
                )}
              </>
            )}
            
            {template.show_validity_date !== false && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 6 * scale,
                color: '#666',
                marginTop: 4 * scale,
                padding: `0 ${8 * scale}px`,
              }}>
                <span>{template.validity_start_text || template.validityStartText || 'Valid From:'} {validityStart}</span>
                <span>{template.validity_end_text || template.validityEndText || 'Valid Till:'} {validityEnd}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Footer */}
        {template.show_footer && template.footer_text && (
          <div style={{
            fontSize: 6 * scale,
            color: template.footer_text_color || '#666',
            textAlign: 'center',
            padding: 4 * scale,
            borderTop: '1px solid #eee',
            position: 'absolute',
            bottom: template.show_barcode !== false ? 55 * scale : 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
          }}>
            {template.footer_text}
          </div>
        )}
      </div>
    );
  };

  // Info Row component for preview
  const InfoRow = ({ label, value, scale }) => (
    <div style={{ display: 'flex', marginBottom: 2 * scale }}>
      <span style={{ color: '#666', minWidth: 55 * scale, fontSize: 8 * scale }}>{label}:</span>
      <span style={{ fontWeight: 500, color: '#333', fontSize: 9 * scale }}>{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <Printer className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Print ID Cards</h1>
              <p className="text-sm text-gray-500">Select users and print their ID cards</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              disabled={selectedUsers.length === 0 || !selectedTemplate}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                selectedUsers.length > 0 && selectedTemplate
                  ? 'bg-white border-2 border-red-500 text-red-600 hover:bg-red-50'
                  : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FileDown size={18} />
              Export PDF
            </button>
            <button
              onClick={handlePrint}
              disabled={selectedUsers.length === 0 || !selectedTemplate}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                selectedUsers.length > 0 && selectedTemplate
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Printer size={18} />
              Print ({selectedUsers.length})
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* User Type & Template Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Type Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Select User Type</h3>
            <div className="flex gap-3">
              {USER_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedUserType(type.id);
                    setSelectedClassSection('');
                    setSelectedDepartment('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    selectedUserType === type.id
                      ? type.id === 'student' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' :
                        type.id === 'teacher' ? 'bg-green-100 text-green-700 ring-2 ring-green-500' :
                        'bg-orange-100 text-orange-700 ring-2 ring-orange-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <type.icon size={20} />
                  <span className="font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Select Template</h3>
            {templates.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No templates found for {selectedUserType}s</p>
                <a href="/settings/id-cards" className="text-sm text-emerald-600 hover:underline">
                  Create a template →
                </a>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all min-w-[140px] text-left ${
                      selectedTemplate?.id === template.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard size={16} className={selectedTemplate?.id === template.id ? 'text-emerald-600' : 'text-gray-400'} />
                      <span className="font-medium text-sm truncate">{template.name}</span>
                    </div>
                    {template.is_default && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Default</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={`Search by name, ID, phone, email...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            {/* Academic Session */}
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-w-[180px]"
              >
                <option value="">All Sessions</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} {session.is_current ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Class/Section Filter (Students only) */}
            {selectedUserType === 'student' && (
              <select
                value={selectedClassSection}
                onChange={(e) => setSelectedClassSection(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-w-[200px]"
              >
                <option value="">All Classes</option>
                {classSections.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.displayName || cs.display_name || `${cs.gradeDisplayName || cs.grade_display_name || cs.gradeName || cs.grade_name || 'Class'} - ${cs.sectionDisplayName || cs.section_display_name || cs.sectionName || cs.section_name || 'Section'}`}
                  </option>
                ))}
              </select>
            )}
            
            {/* Department Filter (Teachers/Staff) */}
            {selectedUserType !== 'student' && (
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-w-[180px]"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            )}
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="active">Active Only</option>
              <option value="all">All Status</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedClassSection('');
                setSelectedDepartment('');
                setStatusFilter('active');
                setSelectedSession(academicSession?.id || '');
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300"
            >
              <RefreshCw size={16} />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-4">
            <button
              onClick={selectAll}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-emerald-600"
            >
              {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? (
                <CheckSquare size={18} className="text-emerald-600" />
              ) : (
                <Square size={18} />
              )}
              Select All
            </button>
            <span className="text-sm text-gray-500">
              Showing <strong>{filteredUsers.length}</strong> {selectedUserType}(s)
            </span>
          </div>
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                {selectedUsers.length} selected
              </span>
              <button
                onClick={() => setSelectedUsers([])}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Users Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Loading {selectedUserType}s...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No {selectedUserType}s found</h3>
              <p className="text-gray-500">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {filteredUsers.map((user) => {
                const isSelected = selectedUsers.includes(user.id);
                const info = getUserDisplayInfo(user);
                
                return (
                  <div
                    key={user.id}
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                    }`}
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-3 right-3">
                      {isSelected ? (
                        <CheckSquare size={22} className="text-emerald-600" />
                      ) : (
                        <Square size={22} className="text-gray-300" />
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                        {info.photoUrl ? (
                          <img src={info.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-gray-400">
                            {(info.firstName?.[0] || '') + (info.lastName?.[0] || '')}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="font-semibold text-gray-800 truncate text-base">
                          {info.fullName || 'Unknown'}
                        </p>
                        <p className="text-sm text-emerald-600 font-medium truncate">
                          {info.idNumber}
                        </p>
                        {selectedUserType === 'student' ? (
                          <p className="text-xs text-gray-500 mt-1">
                            {info.className && info.className.includes('-') 
                              ? info.className 
                              : `${info.className || ''}${info.sectionName ? ` - ${info.sectionName}` : ''}`
                            }
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {info.designation || info.department || 'No designation'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        {info.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} />
                            {info.phone}
                          </span>
                        )}
                        {info.bloodGroup && (
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-medium">
                            {info.bloodGroup}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Preview Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(user);
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                    >
                      <Eye size={16} />
                      Preview ID Card
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewUser && selectedTemplate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">ID Card Preview</h3>
                <p className="text-sm text-gray-500">{getUserDisplayInfo(previewUser).fullName}</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 flex justify-center items-center min-h-[350px]" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}>
              {renderIdCardPreview(previewUser, selectedTemplate, 1.8)}
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm text-gray-500">
                  Template: <strong className="text-gray-700">{selectedTemplate.name}</strong>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-200 rounded">
                    {selectedTemplate.width_mm || 85.6}mm × {selectedTemplate.height_mm || 53.98}mm
                  </span>
                  <span className="px-2 py-1 bg-gray-200 rounded capitalize">
                    {selectedTemplate.orientation || 'landscape'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium border border-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedUsers([previewUser.id]);
                    setShowPreview(false);
                    setShowPrintModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg font-medium"
                >
                  <Printer size={18} />
                  Print This Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Options Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Printer size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Print ID Cards</h3>
                    <p className="text-sm text-gray-500">{selectedUsers.length} card(s) selected</p>
                  </div>
                </div>
                <button onClick={() => setShowPrintModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Layout Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Card Layout</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRINT_LAYOUTS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setPrintOptions(prev => ({ ...prev, layout: layout.id }))}
                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                        printOptions.layout === layout.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <layout.icon size={20} className={`mx-auto mb-1 ${printOptions.layout === layout.id ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <span className="text-xs font-medium block">{layout.label}</span>
                      <span className="text-[10px] text-gray-500">{layout.description}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Paper Size & Orientation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size</label>
                  <div className="flex flex-col gap-2">
                    {PAPER_SIZES.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setPrintOptions(prev => ({ ...prev, paperSize: size.id }))}
                        className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                          printOptions.paperSize === size.id
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
                  <div className="flex flex-col gap-2">
                    {ORIENTATIONS.map((orient) => (
                      <button
                        key={orient.id}
                        onClick={() => setPrintOptions(prev => ({ ...prev, orientation: orient.id }))}
                        className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                          printOptions.orientation === orient.id
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {orient.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Additional Options */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={printOptions.showBorder}
                    onChange={(e) => setPrintOptions(prev => ({ ...prev, showBorder: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-medium text-gray-700">Show Card Border</span>
                    <p className="text-xs text-gray-500">Add visible border around each card</p>
                  </div>
                </label>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <label className="flex-1">
                    <span className="font-medium text-gray-700">Page Margin</span>
                    <p className="text-xs text-gray-500">Space around the page edges</p>
                  </label>
                  <select
                    value={printOptions.marginMm}
                    onChange={(e) => setPrintOptions(prev => ({ ...prev, marginMm: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={5}>5mm</option>
                    <option value={10}>10mm</option>
                    <option value={15}>15mm</option>
                    <option value={20}>20mm</option>
                  </select>
                </div>
              </div>
              
              {/* Summary */}
              <div className="bg-emerald-50 rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-emerald-800 mb-2">Print Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Template:</span>
                  <span className="font-medium text-gray-800">{selectedTemplate?.name}</span>
                  <span className="text-gray-600">User Type:</span>
                  <span className="font-medium text-gray-800 capitalize">{selectedUserType}s</span>
                  <span className="text-gray-600">Total Cards:</span>
                  <span className="font-bold text-emerald-600">{selectedUsers.length}</span>
                  <span className="text-gray-600">Layout:</span>
                  <span className="font-medium text-gray-800">{PRINT_LAYOUTS.find(l => l.id === printOptions.layout)?.label}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowPrintModal(false)}
                disabled={printing}
                className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={executePrint}
                disabled={printing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg font-medium disabled:opacity-50 transition-all"
              >
                {printing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer size={20} />
                    Print Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export PDF Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FileDown size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Export to PDF</h3>
                    <p className="text-sm text-gray-500">{selectedUsers.length} card(s) selected</p>
                  </div>
                </div>
                <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Layout Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Card Layout</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRINT_LAYOUTS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setPrintOptions(prev => ({ ...prev, layout: layout.id }))}
                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                        printOptions.layout === layout.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <layout.icon size={20} className={`mx-auto mb-1 ${printOptions.layout === layout.id ? 'text-red-600' : 'text-gray-400'}`} />
                      <span className="text-xs font-medium block">{layout.label}</span>
                      <span className="text-[10px] text-gray-500">{layout.description}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Paper Size & Orientation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size</label>
                  <div className="flex flex-col gap-2">
                    {PAPER_SIZES.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setPrintOptions(prev => ({ ...prev, paperSize: size.id }))}
                        className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                          printOptions.paperSize === size.id
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
                  <div className="flex flex-col gap-2">
                    {ORIENTATIONS.map((orient) => (
                      <button
                        key={orient.id}
                        onClick={() => setPrintOptions(prev => ({ ...prev, orientation: orient.id }))}
                        className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                          printOptions.orientation === orient.id
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {orient.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* PDF Quality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PDF Quality</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">High quality (recommended for printing)</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Optimal</span>
                  </div>
                </div>
              </div>
              
              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={printOptions.showBorder}
                    onChange={(e) => setPrintOptions(prev => ({ ...prev, showBorder: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="font-medium text-gray-700">Include Card Borders</span>
                    <p className="text-xs text-gray-500">Add visible border around each card</p>
                  </div>
                </label>
              </div>
              
              {/* File Info */}
              <div className="bg-red-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FileImage size={20} className="text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-1">Output File</h4>
                    <p className="text-sm text-red-700">
                      ID_Cards_{selectedUserType}_{new Date().toISOString().split('T')[0]}.pdf
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      {selectedUsers.length} cards • {PAPER_SIZES.find(p => p.id === printOptions.paperSize)?.label} ({ORIENTATIONS.find(o => o.id === printOptions.orientation)?.label}) • {PRINT_LAYOUTS.find(l => l.id === printOptions.layout)?.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                disabled={exporting}
                className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={executeExportPDF}
                disabled={exporting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg font-medium disabled:opacity-50 transition-all"
              >
                {exporting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdCardPrint;
