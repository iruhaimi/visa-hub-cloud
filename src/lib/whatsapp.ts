export const DEFAULT_WHATSAPP_NUMBER = '966562525665';

const LEGACY_WHATSAPP_NUMBERS = new Set(['920034158', '966920034158']);
const MOBILE_DEVICE_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const WHATSAPP_LAUNCH_PATH = '/whatsapp-launch.html';

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

function unwrapWhatsAppLaunchUrl(url: string) {
  if (!url || typeof window === 'undefined') return url;

  try {
    const parsedUrl = new URL(url, window.location.origin);
    if (parsedUrl.pathname !== WHATSAPP_LAUNCH_PATH) {
      return url;
    }

    return parsedUrl.searchParams.get('target') || url;
  } catch {
    return url;
  }
}

function getWhatsAppLaunchUrl(url: string) {
  if (!url || typeof window === 'undefined') return url;

  const targetUrl = unwrapWhatsAppLaunchUrl(url);
  const launchUrl = new URL(WHATSAPP_LAUNCH_PATH, window.location.origin);
  launchUrl.searchParams.set('target', targetUrl);
  return launchUrl.toString();
}

export function getWhatsAppWebUrl(message: string, phoneNumber?: string) {
  const normalizedPhoneNumber = normalizeWhatsAppNumber(phoneNumber);
  return `https://wa.me/${normalizedPhoneNumber}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppDesktopUrl(message: string, phoneNumber?: string) {
  const normalizedPhoneNumber = normalizeWhatsAppNumber(phoneNumber);
  return `https://api.whatsapp.com/send/?phone=${normalizedPhoneNumber}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
}

export function getWhatsAppUrl(message: string, phoneNumber?: string) {
  return isMobileDevice()
    ? getWhatsAppWebUrl(message, phoneNumber)
    : getWhatsAppDesktopUrl(message, phoneNumber);
}

export function prepareWhatsAppWindow(initialUrl?: string) {
  if (typeof window === 'undefined' || isMobileDevice()) return null;

  const launchUrl = initialUrl ? getWhatsAppLaunchUrl(initialUrl) : '';

  const popup = window.open(launchUrl || '', '_blank');
  if (!popup) return null;

  try {
    popup.opener = null;
  } catch {
    // Ignore opener access issues.
  }

  if (launchUrl) {
    return popup;
  }

  try {
    popup.document.title = 'Opening WhatsApp';
    popup.document.body.innerHTML = '<p style="font-family: system-ui, sans-serif; padding: 24px; text-align: center;">Opening WhatsApp…</p>';
  } catch {
    // Ignore document access issues and continue with the blank tab.
  }

  return popup;
}

export function openWhatsAppUrl(url: string, popup?: Window | null) {
  if (typeof window === 'undefined') return;

  const targetUrl = unwrapWhatsAppLaunchUrl(url);
  const launchUrl = getWhatsAppLaunchUrl(targetUrl);

  const openLaunchPopup = () => {
    const nextPopup = window.open('', '_blank');
    if (!nextPopup) return false;

    try {
      nextPopup.opener = null;
    } catch {
      // Ignore opener access issues.
    }

    try {
      nextPopup.location.replace(launchUrl);
    } catch {
      try {
        nextPopup.location.href = launchUrl;
      } catch {
        nextPopup.close();
        return false;
      }
    }

    return true;
  };

  if (isInIframe()) {
    if (openLaunchPopup()) {
      return;
    }
  }

  if (popup && !popup.closed) {
    try {
      popup.location.replace(launchUrl);
      return;
    } catch {
      // Fallback to standard navigation logic below.
    }
  }

  if (isMobileDevice()) {
    if (isInIframe()) {
      try {
        window.top?.location.assign(launchUrl);
        return;
      } catch {
        // Fallback to same-window navigation below.
      }
    }

    window.location.assign(targetUrl);
    return;
  }

  if (openLaunchPopup()) {
    return;
  }

  if (isInIframe()) {
    try {
      window.top?.location.assign(launchUrl);
      return;
    } catch {
      window.location.assign(launchUrl);
      return;
    }
  }

  window.location.assign(launchUrl);
}