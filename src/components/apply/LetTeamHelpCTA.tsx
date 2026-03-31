import { MessageCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApplication } from '@/contexts/ApplicationContext';
import { getWhatsAppUrl, buildWhatsAppMessage } from '@/components/layout/FloatingWhatsApp';

/**
 * A CTA button that appears inside the visa application form.
 * Sends the customer's current application context (country, visa type, step)
 * directly to an agent via WhatsApp.
 */
export default function LetTeamHelpCTA() {
  const { applicationData, currentStep } = useApplication();

  const message = buildWhatsAppMessage({
    countryName: applicationData.countryName,
    visaTypeName: applicationData.visaTypeName,
    currentStep,
  });

  // Add draft info if available
  const fullMessage = [
    message,
    applicationData.fullName ? `الاسم: ${applicationData.fullName}` : '',
    applicationData.phone ? `الجوال: ${applicationData.countryCode}${applicationData.phone}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const whatsappUrl = getWhatsAppUrl(fullMessage);

  // Show only after step 1
  if (currentStep < 2) return null;

  return (
    <motion.div
      className="mt-6 p-4 rounded-xl bg-accent/50 border border-accent text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <p className="text-sm text-muted-foreground mb-3">
        تحتاج مساعدة؟ خل فريقنا يكمل لك الطلب
      </p>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
      >
        <MessageCircle className="h-4 w-4" />
        خلّ فريقنا يساعدك
        <ArrowLeft className="h-4 w-4" />
      </a>
    </motion.div>
  );
}
