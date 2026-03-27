// Schengen countries configuration
// Countries are now managed dynamically via is_schengen flag in DB

export const SCHENGEN_INFO = {
  id: 'schengen',
  name: 'شنغن (الاتحاد الأوروبي)',
  nameEn: 'Schengen (EU)',
  code: 'SCHENGEN',
  flag_url: 'https://flagcdn.com/w80/eu.png',
  is_active: true,
};

export function isSchengenCountry(country: { is_schengen?: boolean; code?: string }): boolean {
  return country.is_schengen === true;
}

export function filterOutSchengenCountries<T extends { is_schengen?: boolean }>(countries: T[]): T[] {
  return countries.filter(country => !country.is_schengen);
}

export function getSchengenCountries<T extends { is_schengen?: boolean }>(countries: T[]): T[] {
  return countries.filter(country => country.is_schengen);
}
