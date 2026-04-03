import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ApplicationData {
  id: string;
  status: string;
  created_at: string;
  travel_date: string | null;
  return_date: string | null;
  purpose_of_travel: string | null;
  accommodation_details: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  approved_at: string | null;
  visa_type: {
    name: string;
    price: number;
    processing_days: number;
    country: {
      name: string;
      code: string;
    };
  };
  profile: {
    full_name: string;
    phone: string;
    nationality: string;
    passport_number: string;
    passport_expiry: string;
    date_of_birth: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  pending_payment: 'بانتظار الدفع',
  submitted: 'مقدم',
  under_review: 'قيد المراجعة',
  documents_required: 'مستندات مطلوبة',
  processing: 'قيد المعالجة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  cancelled: 'ملغي',
};

export function generateApplicationPDF(application: ApplicationData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set RTL direction
  doc.setR2L(true);

  // Add Arabic font support - using built-in helvetica for now
  // For full Arabic support, you'd need to add an Arabic font
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(41, 128, 185);
  doc.text('عطلات رحلاتكم', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('تقرير طلب التأشيرة', pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;

  // Application Status Badge
  const statusLabel = STATUS_LABELS[application.status] || application.status;
  doc.setFontSize(14);
  doc.setTextColor(39, 174, 96);
  doc.text(`الحالة: ${statusLabel}`, pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;

  // Application Info Table
  doc.autoTable({
    startY: yPos,
    head: [['معلومات الطلب', '']],
    body: [
      ['رقم الطلب', application.id],
      ['تاريخ التقديم', format(new Date(application.created_at), 'yyyy/MM/dd')],
      ['تاريخ الموافقة', application.approved_at ? format(new Date(application.approved_at), 'yyyy/MM/dd') : '-'],
    ],
    theme: 'grid',
    styles: { 
      font: 'helvetica',
      halign: 'right',
      fontSize: 10,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 90 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Applicant Info Table
  doc.autoTable({
    startY: yPos,
    head: [['معلومات مقدم الطلب', '']],
    body: [
      ['الاسم الكامل', application.profile?.full_name || '-'],
      ['رقم الجوال', application.profile?.phone || '-'],
      ['الجنسية', application.profile?.nationality || '-'],
      ['تاريخ الميلاد', application.profile?.date_of_birth ? format(new Date(application.profile.date_of_birth), 'yyyy/MM/dd') : '-'],
      ['رقم الجواز', application.profile?.passport_number || '-'],
      ['تاريخ انتهاء الجواز', application.profile?.passport_expiry ? format(new Date(application.profile.passport_expiry), 'yyyy/MM/dd') : '-'],
    ],
    theme: 'grid',
    styles: { 
      font: 'helvetica',
      halign: 'right',
      fontSize: 10,
    },
    headStyles: {
      fillColor: [46, 204, 113],
      textColor: 255,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 90 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Travel Info Table
  doc.autoTable({
    startY: yPos,
    head: [['معلومات السفر', '']],
    body: [
      ['الوجهة', application.visa_type?.country?.name || '-'],
      ['نوع التأشيرة', application.visa_type?.name || '-'],
      ['سعر التأشيرة', `${application.visa_type?.price || 0} ر.س`],
      ['مدة المعالجة', `${application.visa_type?.processing_days || 0} أيام عمل`],
      ['تاريخ السفر المتوقع', application.travel_date ? format(new Date(application.travel_date), 'yyyy/MM/dd') : '-'],
      ['تاريخ العودة', application.return_date ? format(new Date(application.return_date), 'yyyy/MM/dd') : '-'],
      ['الغرض من السفر', application.purpose_of_travel || '-'],
    ],
    theme: 'grid',
    styles: { 
      font: 'helvetica',
      halign: 'right',
      fontSize: 10,
    },
    headStyles: {
      fillColor: [155, 89, 182],
      textColor: 255,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 90 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Emergency Contact Table
  if (application.emergency_contact_name || application.emergency_contact_phone) {
    doc.autoTable({
      startY: yPos,
      head: [['جهة الاتصال للطوارئ', '']],
      body: [
        ['الاسم', application.emergency_contact_name || '-'],
        ['رقم الهاتف', application.emergency_contact_phone || '-'],
      ],
      theme: 'grid',
      styles: { 
        font: 'helvetica',
        halign: 'right',
        fontSize: 10,
      },
      headStyles: {
        fillColor: [231, 76, 60],
        textColor: 255,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 90 },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `تم إنشاء هذا التقرير بتاريخ ${format(new Date(), 'yyyy/MM/dd HH:mm')}`,
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );
  doc.text(
    'عطلات رحلاتكم - خدمات التأشيرات',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save the PDF
  const fileName = `visa-application-${application.id.slice(0, 8)}.pdf`;
  doc.save(fileName);
}
