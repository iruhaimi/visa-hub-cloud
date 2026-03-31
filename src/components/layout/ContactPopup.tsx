import { useState, useEffect } from 'react';
import { X, MessageCircle, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getWhatsAppUrl, buildWhatsAppMessage } from './FloatingWhatsApp';

const POPUP_DELAY_MS = 18000; // 18 seconds
const STORAGE_KEY = 'contact_popup_dismissed';

export default function ContactPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed in this session
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setVisible(true), POPUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, '1');
  };

  const whatsappUrl = getWhatsAppUrl(buildWhatsAppMessage());

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-[60] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />

          {/* Popup */}
          <motion.div
            className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-card rounded-2xl shadow-2xl border p-6 text-center"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            dir="rtl"
          >
            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-3 left-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Icon */}
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Phone className="h-8 w-8 text-primary" />
            </div>

            <h3 className="text-lg font-bold text-foreground mb-2">
              تبي مساعدة سريعة؟
            </h3>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              فريقنا جاهز يساعدك الحين! تواصل مباشرة وخلنا نخلص لك كل شيء
            </p>

            {/* WhatsApp CTA */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium py-3 rounded-xl transition-colors mb-3"
            >
              <MessageCircle className="h-5 w-5" />
              تواصل عبر واتساب
            </a>

            {/* Skip */}
            <Button variant="ghost" size="sm" onClick={dismiss} className="text-muted-foreground">
              لا، أكمل بنفسي
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
