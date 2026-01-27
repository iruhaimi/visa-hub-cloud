/**
 * Input filtering utilities for form validation
 * Ensures English-only for email and numbers-only for phone fields
 */

// Filter Arabic characters from input (for email fields)
export const filterArabicChars = (value: string): string => {
  return value.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
};

// Filter non-numeric characters (for phone fields)
export const filterNonNumeric = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};

// Handle email input event - filter Arabic characters in real-time
export const handleEmailInputFilter = (e: React.FormEvent<HTMLInputElement>): string => {
  const input = e.currentTarget;
  const filtered = filterArabicChars(input.value);
  if (filtered !== input.value) {
    input.value = filtered;
  }
  return filtered;
};

// Handle phone input event - allow only digits
export const handlePhoneInputFilter = (e: React.FormEvent<HTMLInputElement>): string => {
  const input = e.currentTarget;
  const filtered = filterNonNumeric(input.value);
  if (filtered !== input.value) {
    input.value = filtered;
  }
  return filtered;
};
