export const DEFAULT_WHATSAPP_NUMBER = '966562525665';

const LEGACY_WHATSAPP_NUMBERS = new Set(['920034158', '966920034158']);
const MOBILE_DEVICE_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

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

export function normalizeWhatsAppNumber(phoneNumber?: string) {
  const digitsOnly = (phoneNumber || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, '');

  if (!digitsOnly || LEGACY_WHATSAPP_NUMBERS.has(digitsOnly)) {
    return DEFAULT_WHATSAPP_NUMBER;
  }

  return digitsOnly;
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return MOBILE_DEVICE_REGEX.test(navigator.userAgent);
}

function isInIframe() {
  if (typeof window === 'undefined') return false;

  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function getWhatsAppWebUrl(message: string, phoneNumber?: string) {
  const normalizedPhoneNumber = normalizeWhatsAppNumber(phoneNumber);
  return `https://wa.me/${normalizedPhoneNumber}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppDesktopUrl(message: string, phoneNumber?: string) {
  const normalizedPhoneNumber = normalizeWhatsAppNumber(phoneNumber);
  return `https://web.whatsapp.com/send?phone=${normalizedPhoneNumber}&text=${encodeURIComponent(message)}`;
}

export function getWhatsAppUrl(message: string, phoneNumber?: string) {
  return isMobileDevice()
    ? getWhatsAppWebUrl(message, phoneNumber)
    : getWhatsAppDesktopUrl(message, phoneNumber);
}

export function openWhatsAppUrl(url: string) {
  if (typeof window === 'undefined') return;

  if (isMobileDevice()) {
    if (isInIframe()) {
      try {
        window.top?.location.assign(url);
        return;
      } catch {
        // Fallback to same-window navigation below.
      }
    }

    window.location.assign(url);
    return;
  }

  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (popup) {
    popup.opener = null;
    return;
  }

  if (isInIframe()) {
    try {
      window.top?.location.assign(url);
      return;
    } catch {
      // Fallback to same-window navigation below.
    }
  }

  window.location.assign(url);
}