import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const PHONE_NUMBER = '966920034158';

/**
 * Build a context-aware WhatsApp message based on the current page.
 */
export function buildWhatsAppMessage(context?: {
  countryName?: string;
  visaTypeName?: string;
  currentStep?: number;
}) {
  const parts: string[] = ['مرحباً، أرغب في الاستفسار عن خدمات التأشيرات'];

  if (context?.countryName) {
    parts.push(`الدولة: ${context.countryName}`);
  }
  if (context?.visaTypeName) {
    parts.push(`نوع التأشيرة: ${context.visaTypeName}`);
  }
  if (context?.currentStep) {
    parts.push(`أنا الآن في الخطوة ${context.currentStep} من التقديم`);
  }

  return parts.join('\n');
}

export function getWhatsAppUrl(message: string) {
  return `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function FloatingWhatsApp() {
  const location = useLocation();

  // Don't show on apply page (has its own help CTA)
  const isApplyPage = location.pathname.startsWith('/apply');
  if (isApplyPage) return null;

  const message = buildWhatsAppMessage();
  const whatsappUrl = getWhatsAppUrl(message);

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#20BD5A] transition-all hover:scale-105 group"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="تواصل معنا عبر واتساب"
    >
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />

      <MessageCircle className="h-6 w-6 relative z-10" />
      <span className="hidden sm:inline-block font-medium relative z-10">
        تواصل معنا
      </span>
    </motion.a>
  );
}
