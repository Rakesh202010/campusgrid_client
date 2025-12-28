import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer, Download, Loader2, CheckCircle } from 'lucide-react';
import { feeManagement, feeSettings } from '../services/api';
import html2pdf from 'html2pdf.js';

// Number to words converter (Indian format)
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
};

const FeeReceipt = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState(null);
  const [template, setTemplate] = useState(null);
  const [generating, setGenerating] = useState(false);
  const receiptRef = useRef(null);

  useEffect(() => {
    if (paymentId) {
      fetchReceiptData();
    }
  }, [paymentId]);

  const fetchReceiptData = async () => {
    setLoading(true);
    try {
      const [receiptRes, templateRes] = await Promise.all([
        feeManagement.getReceipt(paymentId),
        feeSettings.getDefaultTemplate()
      ]);
      
      if (receiptRes?.success) {
        setReceiptData(receiptRes.data);
      }
      if (templateRes?.success) {
        setTemplate(templateRes.data);
      }
    } catch (error) {
      console.error('Error fetching receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    
    setGenerating(true);
    try {
      const element = receiptRef.current;
      const opt = {
        margin: 10,
        filename: `Receipt_${receiptData?.payment?.receiptNumber || 'fee'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { 
          unit: 'mm', 
          format: template?.paperSize === 'a5' ? 'a5' : template?.paperSize === 'letter' ? 'letter' : 'a4',
          orientation: template?.orientation || 'portrait'
        }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try printing instead.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl">Receipt not found</p>
          <button onClick={() => window.close()} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  const t = template || {
    paperSize: 'a4',
    orientation: 'portrait',
    showLogo: true,
    logoPosition: 'center',
    schoolNameSize: 'large',
    showAddress: true,
    showContact: true,
    headerColor: '#1f2937',
    receiptTitle: 'Fee Receipt',
    showReceiptNumber: true,
    showFatherName: true,
    showMotherName: false,
    showPhone: true,
    showRollNumber: false,
    showPeriodColumn: true,
    showCategoryColumn: false,
    tableHeaderColor: '#f3f4f6',
    showAmountInWords: true,
    currencySymbol: '₹',
    footerText: 'This is a computer generated receipt. Thank you for your payment!',
    showSignatureLine: true,
    signatureLabel: 'Authorized Signature',
    showDateTime: true,
    showCollectedBy: true,
    primaryColor: '#059669',
    fontFamily: 'Arial',
    borderStyle: 'solid',
    showTerms: false,
    termsText: ''
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Action Bar - Hidden when printing */}
      <div className="no-print bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="w-6 h-6" />
            <span className="font-semibold">Payment Successful!</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {generating ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div 
          ref={receiptRef}
          className={`bg-white shadow-lg mx-auto ${
            t.paperSize === 'a5' ? 'max-w-md' : t.paperSize === 'thermal' ? 'max-w-xs' : 'max-w-2xl'
          }`}
          style={{ 
            fontFamily: t.fontFamily,
            border: t.borderStyle !== 'none' ? `2px ${t.borderStyle} ${t.primaryColor}20` : 'none'
          }}
        >
          {/* Header */}
          <div 
            className="p-6 text-center"
            style={{ 
              backgroundColor: `${t.headerColor}08`,
              borderBottom: `3px solid ${t.primaryColor}`
            }}
          >
            <div className={`flex items-center gap-4 mb-3 ${
              t.logoPosition === 'left' ? 'justify-start' : 
              t.logoPosition === 'right' ? 'justify-end' : 'justify-center'
            }`}>
              {t.showLogo && receiptData.school?.logo && (
                <img src={receiptData.school.logo} alt="Logo" className="w-16 h-16 object-contain" />
              )}
              {t.showLogo && !receiptData.school?.logo && (
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                  style={{ backgroundColor: t.primaryColor }}
                >
                  {receiptData.school?.name?.charAt(0) || 'S'}
                </div>
              )}
              <h1 
                className={`font-bold ${
                  t.schoolNameSize === 'large' ? 'text-3xl' : 
                  t.schoolNameSize === 'medium' ? 'text-2xl' : 'text-xl'
                }`}
                style={{ color: t.headerColor }}
              >
                {receiptData.school?.name || 'School Name'}
              </h1>
            </div>
            {t.showAddress && receiptData.school?.address && (
              <p className="text-gray-600">{receiptData.school.address}</p>
            )}
            {t.showContact && (receiptData.school?.phone || receiptData.school?.email) && (
              <p className="text-gray-500 text-sm mt-1">
                {[receiptData.school?.phone, receiptData.school?.email].filter(Boolean).join(' | ')}
              </p>
            )}
          </div>

          {/* Receipt Title */}
          <div className="py-4 text-center border-b-2 border-dashed border-gray-200">
            <h2 
              className="text-2xl font-bold uppercase tracking-widest"
              style={{ color: t.primaryColor }}
            >
              {t.receiptTitle}
            </h2>
            {t.showReceiptNumber && (
              <p 
                className="text-xl font-mono mt-2 font-bold"
                style={{ color: t.headerColor }}
              >
                {receiptData.payment?.receiptNumber}
              </p>
            )}
          </div>

          {/* Student Info */}
          <div className="p-6 bg-gray-50 grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Student Name</p>
                <p className="font-bold text-gray-800 text-lg">{receiptData.student?.name}</p>
              </div>
              {t.showFatherName && receiptData.student?.fatherName && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Father's Name</p>
                  <p className="font-semibold text-gray-700">{receiptData.student.fatherName}</p>
                </div>
              )}
              {t.showMotherName && receiptData.student?.motherName && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Mother's Name</p>
                  <p className="font-semibold text-gray-700">{receiptData.student.motherName}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Admission No.</p>
                <p className="font-semibold text-gray-700">{receiptData.student?.admissionNumber}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Class</p>
                <p className="font-semibold text-gray-700">{receiptData.student?.className}</p>
              </div>
              {t.showRollNumber && receiptData.student?.rollNumber && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Roll No.</p>
                  <p className="font-semibold text-gray-700">{receiptData.student.rollNumber}</p>
                </div>
              )}
            </div>
            <div className="text-right space-y-3">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Date</p>
                <p className="font-bold text-gray-800 text-lg">
                  {new Date(receiptData.payment?.paymentDate).toLocaleDateString('en-IN', { 
                    day: '2-digit', month: 'long', year: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Payment Mode</p>
                <p className="font-semibold text-gray-700 uppercase">{receiptData.payment?.paymentMode}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Academic Session</p>
                <p className="font-semibold text-gray-700">{receiptData.payment?.sessionName}</p>
              </div>
              {t.showPhone && receiptData.student?.phone && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Phone</p>
                  <p className="font-semibold text-gray-700">{receiptData.student.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Fee Table */}
          <div className="p-6">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: t.tableHeaderColor }}>
                  <th className="text-left py-3 px-4 font-bold text-gray-700 border-b-2 border-gray-300">
                    Fee Description
                  </th>
                  {t.showPeriodColumn && (
                    <th className="text-center py-3 px-4 font-bold text-gray-700 border-b-2 border-gray-300">
                      Period
                    </th>
                  )}
                  {t.showCategoryColumn && (
                    <th className="text-center py-3 px-4 font-bold text-gray-700 border-b-2 border-gray-300">
                      Category
                    </th>
                  )}
                  <th className="text-right py-3 px-4 font-bold text-gray-700 border-b-2 border-gray-300">
                    Amount ({t.currencySymbol})
                  </th>
                </tr>
              </thead>
              <tbody>
                {receiptData.items?.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-3 px-4 text-gray-800">{item.feeTypeName}</td>
                    {t.showPeriodColumn && (
                      <td className="py-3 px-4 text-center text-gray-600">{item.feeMonth || '-'}</td>
                    )}
                    {t.showCategoryColumn && (
                      <td className="py-3 px-4 text-center text-gray-600">{item.category || '-'}</td>
                    )}
                    <td className="py-3 px-4 text-right font-medium text-gray-800">
                      {t.currencySymbol}{parseFloat(item.amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <td 
                    colSpan={(t.showPeriodColumn ? 1 : 0) + (t.showCategoryColumn ? 1 : 0) + 1} 
                    className="py-3 px-4 text-right font-bold text-gray-700"
                  >
                    Sub Total:
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-800">
                    {t.currencySymbol}{parseFloat(receiptData.payment?.totalAmount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                {parseFloat(receiptData.payment?.discountAmount) > 0 && (
                  <tr className="text-green-600">
                    <td 
                      colSpan={(t.showPeriodColumn ? 1 : 0) + (t.showCategoryColumn ? 1 : 0) + 1} 
                      className="py-2 px-4 text-right"
                    >
                      Discount:
                    </td>
                    <td className="py-2 px-4 text-right font-medium">
                      - {t.currencySymbol}{parseFloat(receiptData.payment.discountAmount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                {parseFloat(receiptData.payment?.fineAmount) > 0 && (
                  <tr className="text-red-600">
                    <td 
                      colSpan={(t.showPeriodColumn ? 1 : 0) + (t.showCategoryColumn ? 1 : 0) + 1} 
                      className="py-2 px-4 text-right"
                    >
                      Late Fee:
                    </td>
                    <td className="py-2 px-4 text-right font-medium">
                      + {t.currencySymbol}{parseFloat(receiptData.payment.fineAmount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                <tr 
                  className="text-lg"
                  style={{ backgroundColor: `${t.primaryColor}15` }}
                >
                  <td 
                    colSpan={(t.showPeriodColumn ? 1 : 0) + (t.showCategoryColumn ? 1 : 0) + 1} 
                    className="py-4 px-4 text-right font-bold"
                    style={{ color: t.headerColor }}
                  >
                    NET AMOUNT PAID:
                  </td>
                  <td 
                    className="py-4 px-4 text-right font-bold text-2xl"
                    style={{ color: t.primaryColor }}
                  >
                    {t.currencySymbol}{parseFloat(receiptData.payment?.netAmount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Amount in Words */}
            {t.showAmountInWords && (
              <div 
                className="mt-4 p-3 rounded-lg border"
                style={{ borderColor: `${t.primaryColor}40`, backgroundColor: `${t.primaryColor}05` }}
              >
                <p className="text-sm">
                  <span className="text-gray-500">Amount in Words: </span>
                  <span className="font-semibold text-gray-800">
                    {numberToWords(Math.round(parseFloat(receiptData.payment?.netAmount) || 0))} Rupees Only
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t-2 border-dashed border-gray-200 text-center text-sm text-gray-500">
            {t.showDateTime && (
              <p>
                Printed on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} at {new Date().toLocaleTimeString('en-IN')}
              </p>
            )}
            {t.showCollectedBy && (
              <p className="mt-1">Collected by: {receiptData.payment?.collectedBy || 'School Admin'}</p>
            )}
            
            {t.footerText && (
              <p className="mt-3 font-medium text-gray-600">{t.footerText}</p>
            )}
            
            {t.showSignatureLine && (
              <div className="mt-8 flex justify-end px-8">
                <div className="text-center">
                  <div className="w-48 border-t-2 border-gray-400"></div>
                  <p className="mt-2 text-gray-600 font-medium">{t.signatureLabel}</p>
                </div>
              </div>
            )}
            
            {t.showTerms && t.termsText && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left text-xs border border-gray-200">
                <p className="font-bold text-gray-700 mb-1">Terms & Conditions:</p>
                <p className="text-gray-500 whitespace-pre-line">{t.termsText}</p>
              </div>
            )}
            
            {/* Decorative Footer */}
            <div 
              className="mt-6 h-2 rounded-full"
              style={{ background: `linear-gradient(to right, ${t.primaryColor}, ${t.primaryColor}80, ${t.primaryColor}40)` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { 
            display: none !important; 
          }
          .max-w-4xl {
            max-width: none !important;
            padding: 0 !important;
          }
          @page {
            size: ${t.paperSize === 'a5' ? 'A5' : t.paperSize === 'letter' ? 'letter' : 'A4'} ${t.orientation};
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};

export default FeeReceipt;

