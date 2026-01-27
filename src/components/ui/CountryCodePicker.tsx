import { useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const countries = [
  { code: '+966', name: 'السعودية', nameEn: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', name: 'الإمارات', nameEn: 'UAE', flag: '🇦🇪' },
  { code: '+973', name: 'البحرين', nameEn: 'Bahrain', flag: '🇧🇭' },
  { code: '+974', name: 'قطر', nameEn: 'Qatar', flag: '🇶🇦' },
  { code: '+965', name: 'الكويت', nameEn: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', name: 'عمان', nameEn: 'Oman', flag: '🇴🇲' },
  { code: '+20', name: 'مصر', nameEn: 'Egypt', flag: '🇪🇬' },
  { code: '+962', name: 'الأردن', nameEn: 'Jordan', flag: '🇯🇴' },
  { code: '+961', name: 'لبنان', nameEn: 'Lebanon', flag: '🇱🇧' },
  { code: '+963', name: 'سوريا', nameEn: 'Syria', flag: '🇸🇾' },
  { code: '+964', name: 'العراق', nameEn: 'Iraq', flag: '🇮🇶' },
  { code: '+967', name: 'اليمن', nameEn: 'Yemen', flag: '🇾🇪' },
  { code: '+970', name: 'فلسطين', nameEn: 'Palestine', flag: '🇵🇸' },
  { code: '+212', name: 'المغرب', nameEn: 'Morocco', flag: '🇲🇦' },
  { code: '+213', name: 'الجزائر', nameEn: 'Algeria', flag: '🇩🇿' },
  { code: '+216', name: 'تونس', nameEn: 'Tunisia', flag: '🇹🇳' },
  { code: '+218', name: 'ليبيا', nameEn: 'Libya', flag: '🇱🇾' },
  { code: '+249', name: 'السودان', nameEn: 'Sudan', flag: '🇸🇩' },
  { code: '+90', name: 'تركيا', nameEn: 'Turkey', flag: '🇹🇷' },
  { code: '+44', name: 'بريطانيا', nameEn: 'UK', flag: '🇬🇧' },
  { code: '+1', name: 'أمريكا', nameEn: 'USA', flag: '🇺🇸' },
  { code: '+33', name: 'فرنسا', nameEn: 'France', flag: '🇫🇷' },
  { code: '+49', name: 'ألمانيا', nameEn: 'Germany', flag: '🇩🇪' },
  { code: '+91', name: 'الهند', nameEn: 'India', flag: '🇮🇳' },
  { code: '+92', name: 'باكستان', nameEn: 'Pakistan', flag: '🇵🇰' },
  { code: '+60', name: 'ماليزيا', nameEn: 'Malaysia', flag: '🇲🇾' },
  { code: '+62', name: 'إندونيسيا', nameEn: 'Indonesia', flag: '🇮🇩' },
  { code: '+86', name: 'الصين', nameEn: 'China', flag: '🇨🇳' },
];

interface CountryCodePickerProps {
  value: string;
  onChange: (value: string) => void;
  isRTL?: boolean;
}

export default function CountryCodePicker({ value, onChange, isRTL = true }: CountryCodePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCountry = countries.find(c => c.code === value) || countries[0];

  const filteredCountries = countries.filter(country => 
    country.name.includes(search) || 
    country.nameEn.toLowerCase().includes(search.toLowerCase()) ||
    country.code.includes(search)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[100px] justify-between rounded-xl px-3 font-normal"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-base">{selectedCountry.flag}</span>
            <span className="text-sm">{selectedCountry.code}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 z-50 bg-popover" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRTL ? 'ابحث عن الدولة...' : 'Search country...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 rounded-lg"
              dir="auto"
            />
          </div>
        </div>
        <div className="max-h-[250px] overflow-y-auto p-1">
          {filteredCountries.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {isRTL ? 'لا توجد نتائج' : 'No results found'}
            </div>
          ) : (
            filteredCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => {
                  onChange(country.code);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent",
                  value === country.code && "bg-accent"
                )}
              >
                <span className="text-xl">{country.flag}</span>
                <span className="flex-1 text-right">{country.name}</span>
                <span className="text-muted-foreground" dir="ltr">{country.code}</span>
                {value === country.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
