import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "رحلات للتأشيرات"

interface TaskAssignmentProps {
  agentName?: string
  countryName?: string
  visaType?: string
  applicantName?: string
  applicationId?: string
}

const TaskAssignmentEmail = ({ agentName, countryName, visaType, applicantName, applicationId }: TaskAssignmentProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>تم تعيين طلب جديد لك - {countryName || 'طلب تأشيرة'}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Heading style={headerTitle}>📋 مهمة جديدة</Heading>
          <Text style={headerSubtitle}>{SITE_NAME}</Text>
        </Section>

        {/* Content */}
        <Section style={content}>
          <Text style={greeting}>
            مرحباً {agentName || 'الموظف/ة'}،
          </Text>
          
          <Text style={text}>
            تم تعيين طلب تأشيرة جديد لك للمتابعة. يرجى مراجعة تفاصيل الطلب والبدء في المعالجة.
          </Text>

          {/* Details Box */}
          <Section style={detailsBox}>
            <Text style={detailRow}>
              <strong>الدولة:</strong> {countryName || 'غير محدد'}
            </Text>
            {visaType && (
              <Text style={detailRow}>
                <strong>نوع التأشيرة:</strong> {visaType}
              </Text>
            )}
            {applicantName && (
              <Text style={detailRow}>
                <strong>مقدم الطلب:</strong> {applicantName}
              </Text>
            )}
          </Section>

          <Hr style={divider} />

          <Text style={noteText}>
            ⚠️ يرجى تسجيل الدخول إلى لوحة التحكم لمراجعة الطلب والبدء في معالجته في أقرب وقت.
          </Text>

          <Text style={footer}>
            مع أطيب التحيات،<br/>
            <strong>فريق {SITE_NAME}</strong>
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={footerText}>
            هذا البريد تم إرساله تلقائياً - يرجى عدم الرد عليه
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TaskAssignmentEmail,
  subject: (data: Record<string, any>) => `📋 مهمة جديدة: طلب تأشيرة ${data.countryName || ''}`,
  displayName: 'تعيين مهمة للموظف',
  previewData: {
    agentName: 'أحمد',
    countryName: 'تركيا',
    visaType: 'تأشيرة سياحية',
    applicantName: 'محمد العلي',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden' as const, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
const header = { background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)', padding: '30px', textAlign: 'center' as const }
const headerTitle = { color: '#ffffff', margin: '0', fontSize: '24px', fontWeight: 'bold' as const }
const headerSubtitle = { color: '#dbeafe', margin: '10px 0 0 0', fontSize: '14px' }
const content = { padding: '30px' }
const greeting = { color: '#374151', fontSize: '16px', lineHeight: '1.8', marginBottom: '20px' }
const text = { color: '#374151', fontSize: '16px', lineHeight: '1.8', marginBottom: '20px' }
const detailsBox = { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '20px', margin: '25px 0' }
const detailRow = { color: '#1f2937', fontSize: '14px', margin: '8px 0', lineHeight: '1.6' }
const divider = { borderColor: '#e5e7eb', margin: '25px 0' }
const noteText = { backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '15px', color: '#92400e', fontSize: '14px', lineHeight: '1.6' }
const footer = { color: '#374151', fontSize: '14px', lineHeight: '1.8', marginTop: '25px' }
const footerSection = { backgroundColor: '#f9fafb', padding: '20px', textAlign: 'center' as const, borderTop: '1px solid #e5e7eb' }
const footerText = { color: '#9ca3af', fontSize: '12px', margin: '0' }
