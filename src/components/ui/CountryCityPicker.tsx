import { useState, useMemo } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Countries with their cities
const countriesData = [
  { 
    name: 'السعودية', 
    nameEn: 'Saudi Arabia', 
    flag: '🇸🇦',
    cities: ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'تبوك', 'أبها', 'الطائف', 'بريدة', 'خميس مشيط', 'حائل', 'الجبيل', 'ينبع', 'نجران']
  },
  { 
    name: 'الإمارات', 
    nameEn: 'UAE', 
    flag: '🇦🇪',
    cities: ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين', 'العين']
  },
  { 
    name: 'البحرين', 
    nameEn: 'Bahrain', 
    flag: '🇧🇭',
    cities: ['المنامة', 'المحرق', 'الرفاع', 'مدينة عيسى', 'مدينة حمد', 'سترة']
  },
  { 
    name: 'قطر', 
    nameEn: 'Qatar', 
    flag: '🇶🇦',
    cities: ['الدوحة', 'الوكرة', 'الخور', 'الريان', 'أم صلال', 'الشمال']
  },
  { 
    name: 'الكويت', 
    nameEn: 'Kuwait', 
    flag: '🇰🇼',
    cities: ['مدينة الكويت', 'الجهراء', 'حولي', 'الفروانية', 'الأحمدي', 'مبارك الكبير']
  },
  { 
    name: 'عمان', 
    nameEn: 'Oman', 
    flag: '🇴🇲',
    cities: ['مسقط', 'صلالة', 'صحار', 'نزوى', 'صور', 'البريمي', 'عبري', 'الرستاق']
  },
  { 
    name: 'مصر', 
    nameEn: 'Egypt', 
    flag: '🇪🇬',
    cities: ['القاهرة', 'الإسكندرية', 'الجيزة', 'شرم الشيخ', 'الغردقة', 'الأقصر', 'أسوان', 'بورسعيد', 'السويس', 'طنطا', 'المنصورة', 'الزقازيق']
  },
  { 
    name: 'الأردن', 
    nameEn: 'Jordan', 
    flag: '🇯🇴',
    cities: ['عمّان', 'إربد', 'الزرقاء', 'العقبة', 'السلط', 'المفرق', 'جرش', 'مادبا', 'الكرك']
  },
  { 
    name: 'لبنان', 
    nameEn: 'Lebanon', 
    flag: '🇱🇧',
    cities: ['بيروت', 'طرابلس', 'صيدا', 'صور', 'جبيل', 'زحلة', 'جونية', 'بعلبك']
  },
  { 
    name: 'سوريا', 
    nameEn: 'Syria', 
    flag: '🇸🇾',
    cities: ['دمشق', 'حلب', 'حمص', 'اللاذقية', 'حماة', 'طرطوس', 'دير الزور', 'الرقة']
  },
  { 
    name: 'العراق', 
    nameEn: 'Iraq', 
    flag: '🇮🇶',
    cities: ['بغداد', 'البصرة', 'الموصل', 'أربيل', 'النجف', 'كربلاء', 'السليمانية', 'كركوك']
  },
  { 
    name: 'اليمن', 
    nameEn: 'Yemen', 
    flag: '🇾🇪',
    cities: ['صنعاء', 'عدن', 'تعز', 'الحديدة', 'المكلا', 'إب', 'ذمار']
  },
  { 
    name: 'فلسطين', 
    nameEn: 'Palestine', 
    flag: '🇵🇸',
    cities: ['القدس', 'غزة', 'رام الله', 'نابلس', 'الخليل', 'بيت لحم', 'جنين', 'طولكرم']
  },
  { 
    name: 'المغرب', 
    nameEn: 'Morocco', 
    flag: '🇲🇦',
    cities: ['الرباط', 'الدار البيضاء', 'فاس', 'مراكش', 'طنجة', 'أكادير', 'مكناس', 'وجدة']
  },
  { 
    name: 'الجزائر', 
    nameEn: 'Algeria', 
    flag: '🇩🇿',
    cities: ['الجزائر العاصمة', 'وهران', 'قسنطينة', 'عنابة', 'باتنة', 'سطيف', 'تلمسان']
  },
  { 
    name: 'تونس', 
    nameEn: 'Tunisia', 
    flag: '🇹🇳',
    cities: ['تونس العاصمة', 'صفاقس', 'سوسة', 'القيروان', 'بنزرت', 'قابس', 'المنستير']
  },
  { 
    name: 'ليبيا', 
    nameEn: 'Libya', 
    flag: '🇱🇾',
    cities: ['طرابلس', 'بنغازي', 'مصراتة', 'الزاوية', 'البيضاء', 'سبها']
  },
  { 
    name: 'السودان', 
    nameEn: 'Sudan', 
    flag: '🇸🇩',
    cities: ['الخرطوم', 'أم درمان', 'بورتسودان', 'كسلا', 'الأبيض', 'ود مدني']
  },
  { 
    name: 'تركيا', 
    nameEn: 'Turkey', 
    flag: '🇹🇷',
    cities: ['إسطنبول', 'أنقرة', 'إزمير', 'أنطاليا', 'بورصة', 'أضنة', 'قونية', 'غازي عنتاب']
  },
  { 
    name: 'بريطانيا', 
    nameEn: 'UK', 
    flag: '🇬🇧',
    cities: ['لندن', 'مانشستر', 'برمنغهام', 'ليفربول', 'ليدز', 'غلاسكو', 'إدنبرة', 'بريستول']
  },
  { 
    name: 'أمريكا', 
    nameEn: 'USA', 
    flag: '🇺🇸',
    cities: ['نيويورك', 'لوس أنجلوس', 'شيكاغو', 'هيوستن', 'فينكس', 'فيلادلفيا', 'سان أنطونيو', 'سان دييغو', 'دالاس', 'سان فرانسيسكو']
  },
  { 
    name: 'فرنسا', 
    nameEn: 'France', 
    flag: '🇫🇷',
    cities: ['باريس', 'مارسيليا', 'ليون', 'تولوز', 'نيس', 'نانت', 'ستراسبورغ', 'بوردو']
  },
  { 
    name: 'ألمانيا', 
    nameEn: 'Germany', 
    flag: '🇩🇪',
    cities: ['برلين', 'هامبورغ', 'ميونخ', 'كولن', 'فرانكفورت', 'شتوتغارت', 'دوسلدورف', 'دورتموند']
  },
  { 
    name: 'الهند', 
    nameEn: 'India', 
    flag: '🇮🇳',
    cities: ['نيودلهي', 'مومباي', 'بنغالور', 'حيدر آباد', 'تشيناي', 'كولكاتا', 'أحمد آباد', 'بيون']
  },
  { 
    name: 'باكستان', 
    nameEn: 'Pakistan', 
    flag: '🇵🇰',
    cities: ['إسلام آباد', 'كراتشي', 'لاهور', 'فيصل آباد', 'راولبندي', 'ملتان', 'بيشاور']
  },
  { 
    name: 'ماليزيا', 
    nameEn: 'Malaysia', 
    flag: '🇲🇾',
    cities: ['كوالالمبور', 'جورج تاون', 'إيبوه', 'جوهور باهرو', 'ملقا', 'كوتا كينابالو', 'كوتشينغ']
  },
  { 
    name: 'إندونيسيا', 
    nameEn: 'Indonesia', 
    flag: '🇮🇩',
    cities: ['جاكرتا', 'سورابايا', 'باندونغ', 'ميدان', 'سيمارانغ', 'ماكاسار', 'باليمبانغ', 'دنباسار']
  },
  { 
    name: 'الصين', 
    nameEn: 'China', 
    flag: '🇨🇳',
    cities: ['بكين', 'شنغهاي', 'قوانغتشو', 'شنتشن', 'تشنغدو', 'هانغتشو', 'ووهان', 'شيآن']
  },
];

interface CountryPickerProps {
  value: string;
  onChange: (value: string) => void;
  isRTL?: boolean;
  placeholder?: string;
}

export function CountryPicker({ value, onChange, isRTL = true, placeholder }: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCountry = countriesData.find(c => c.name === value);

  const filteredCountries = countriesData.filter(country => 
    country.name.includes(search) || 
    country.nameEn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between rounded-md px-3 font-normal h-10"
        >
          <span className="flex items-center gap-2">
            {selectedCountry ? (
              <>
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder || (isRTL ? 'اختر الدولة' : 'Select country')}</span>
            )}
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
                key={country.name}
                onClick={() => {
                  onChange(country.name);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent",
                  value === country.name && "bg-accent"
                )}
              >
                <span className="text-xl">{country.flag}</span>
                <span className="flex-1 text-right">{country.name}</span>
                {value === country.name && (
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

interface CityPickerProps {
  country: string;
  value: string;
  onChange: (value: string) => void;
  isRTL?: boolean;
  placeholder?: string;
}

export function CityPicker({ country, value, onChange, isRTL = true, placeholder }: CityPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const countryData = countriesData.find(c => c.name === country);
  const cities = countryData?.cities || [];

  const filteredCities = cities.filter(city => 
    city.includes(search)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between rounded-md px-3 font-normal h-10"
          disabled={!country}
        >
          <span className="flex items-center gap-2">
            {value ? (
              <span className="text-sm">{value}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder || (isRTL ? 'اختر المدينة' : 'Select city')}</span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 z-50 bg-popover" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRTL ? 'ابحث عن المدينة...' : 'Search city...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 rounded-lg"
              dir="auto"
            />
          </div>
        </div>
        <div className="max-h-[250px] overflow-y-auto p-1">
          {filteredCities.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {isRTL ? 'لا توجد نتائج' : 'No results found'}
            </div>
          ) : (
            filteredCities.map((city) => (
              <button
                key={city}
                onClick={() => {
                  onChange(city);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent",
                  value === city && "bg-accent"
                )}
              >
                <span className="text-right">{city}</span>
                {value === city && (
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

export { countriesData };
