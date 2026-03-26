import { useState } from 'react';
import { useAllSiteContent } from '@/hooks/useSiteContent';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Building2, HelpCircle, Phone, Scale, Shield, RotateCcw,
  Edit, Save, Plus, Trash2, Loader2, GripVertical, ImageIcon
} from 'lucide-react';

import { Home, Smartphone, FileX, CreditCard, Globe, MapPin, Plane } from 'lucide-react';

const PAGES = [
  { key: 'home', label: 'الصفحة الرئيسية', icon: Home },
  { key: 'about', label: 'من نحن', icon: Building2 },
  { key: 'faq', label: 'الأسئلة الشائعة', icon: HelpCircle },
  { key: 'contact', label: 'تواصل معنا', icon: Phone },
  { key: 'terms', label: 'الشروط والأحكام', icon: Scale },
  { key: 'privacy', label: 'سياسة الخصوصية', icon: Shield },
  { key: 'refund', label: 'سياسة الاسترداد', icon: RotateCcw },
  { key: 'install', label: 'تثبيت التطبيق', icon: Smartphone },
  { key: 'not_found', label: 'صفحة 404', icon: FileX },
  { key: 'payment_success', label: 'نجاح الدفع', icon: CreditCard },
  { key: 'payment_failed', label: 'فشل الدفع', icon: CreditCard },
  { key: 'schengen', label: 'تفاصيل شنغن', icon: Globe },
  { key: 'visa_services', label: 'خدمات التأشيرات', icon: Plane },
  { key: 'visa_detail', label: 'تفاصيل التأشيرة', icon: Plane },
  { key: 'country_detail', label: 'تفاصيل الدولة', icon: MapPin },
];

interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'image';
  bilingual?: boolean;
}

interface SectionDef {
  key: string;
  label: string;
  fields?: FieldDef[];
  arrayKey?: string;
  arrayLabel?: string;
  arrayFields?: FieldDef[];
  simpleArray?: boolean;
}

const SECTION_CONFIG: Record<string, SectionDef[]> = {
  home: [
    { key: 'stats', label: 'الإحصائيات', fields: [
      { key: 'title', label: 'العنوان' },
    ], arrayKey: 'items', arrayLabel: 'إحصائية', arrayFields: [
      { key: 'value', label: 'القيمة', bilingual: false },
      { key: 'suffix', label: 'اللاحقة', bilingual: false },
      { key: 'label', label: 'التسمية' },
      { key: 'icon', label: 'الأيقونة (Users/Globe/Award/Headphones)', bilingual: false },
    ]},
    { key: 'testimonials', label: 'آراء العملاء', fields: [
      { key: 'title', label: 'العنوان' },
      { key: 'subtitle', label: 'العنوان الفرعي' },
    ], arrayKey: 'items', arrayLabel: 'تقييم', arrayFields: [
      { key: 'name', label: 'الاسم' },
      { key: 'role', label: 'الوظيفة' },
      { key: 'content', label: 'المحتوى', type: 'textarea' },
      { key: 'avatar', label: 'الحرف الأول', bilingual: false },
      { key: 'country', label: 'علم الدولة', bilingual: false },
      { key: 'visa', label: 'نوع التأشيرة' },
      { key: 'rating', label: 'التقييم (1-5)', bilingual: false },
    ]},
    { key: 'partners', label: 'الشركاء', fields: [
      { key: 'title', label: 'العنوان' },
      { key: 'subtitle', label: 'العنوان الفرعي' },
    ], arrayKey: 'items', arrayLabel: 'شريك', arrayFields: [
      { key: 'name', label: 'الاسم' },
      { key: 'icon', label: 'الأيقونة (Plane/Landmark/Factory/Building2/Smartphone/Wifi)', bilingual: false },
    ]},
    { key: 'features', label: 'المميزات', fields: [
      { key: 'title', label: 'العنوان' },
      { key: 'subtitle', label: 'العنوان الفرعي' },
    ], arrayKey: 'items', arrayLabel: 'ميزة', arrayFields: [
      { key: 'title', label: 'العنوان' },
      { key: 'description', label: 'الوصف', type: 'textarea' },
      { key: 'icon', label: 'الأيقونة (Headphones/Clock/Users/Shield)', bilingual: false },
    ]},
    { key: 'how_it_works', label: 'كيف نعمل', fields: [
      { key: 'title', label: 'العنوان' },
      { key: 'subtitle', label: 'العنوان الفرعي' },
      { key: 'badge', label: 'الشارة' },
    ], arrayKey: 'items', arrayLabel: 'خطوة', arrayFields: [
      { key: 'title', label: 'العنوان' },
      { key: 'description', label: 'الوصف' },
      { key: 'icon', label: 'الأيقونة (Globe/FileText/CreditCard/Plane)', bilingual: false },
    ]},
    { key: 'cta', label: 'دعوة للعمل', fields: [
      { key: 'title', label: 'العنوان' },
      { key: 'description', label: 'الوصف', type: 'textarea' },
      { key: 'primary_button', label: 'الزر الأساسي' },
      { key: 'secondary_button', label: 'الزر الثانوي' },
    ]},
  ],
  about: [
    { key: 'hero', label: 'القسم الرئيسي', fields: [
      { key: 'badge', label: 'الشارة' },
      { key: 'title', label: 'العنوان' },
      { key: 'description', label: 'الوصف', type: 'textarea' },
    ]},
    { key: 'stats', label: 'الإحصائيات', arrayKey: 'items', arrayLabel: 'إحصائية', arrayFields: [
      { key: 'value', label: 'القيمة', bilingual: false },
      { key: 'label', label: 'التسمية' },
    ]},
    { key: 'story', label: 'قصتنا', fields: [
      { key: 'badge', label: 'الشارة' },
      { key: 'title', label: 'العنوان' },
      { key: 'image', label: 'صورة القسم', type: 'image', bilingual: false },
      { key: 'years_value', label: 'رقم سنوات الخبرة', bilingual: false },
      { key: 'years_label', label: 'نص سنوات الخبرة' },
    ], arrayKey: 'paragraphs', arrayLabel: 'فقرة', simpleArray: true },
    { key: 'values', label: 'قيمنا', fields: [
      { key: 'badge', label: 'الشارة' },
      { key: 'title', label: 'العنوان' },
    ], arrayKey: 'items', arrayLabel: 'قيمة', arrayFields: [
      { key: 'title', label: 'العنوان' },
      { key: 'description', label: 'الوصف', type: 'textarea' },
    ]},
    { key: 'team', label: 'فريق القيادة', fields: [
      { key: 'badge', label: 'الشارة' },
      { key: 'title', label: 'العنوان' },
    ], arrayKey: 'members', arrayLabel: 'عضو', arrayFields: [
      { key: 'name', label: 'الاسم' },
      { key: 'role', label: 'المسمى الوظيفي' },
      { key: 'image', label: 'صورة', type: 'image', bilingual: false },
    ]},
    { key: 'cta', label: 'دعوة للعمل', fields: [
      { key: 'title', label: 'العنوان' },
      { key: 'description', label: 'الوصف', type: 'textarea' },
      { key: 'primary_button', label: 'الزر الأساسي' },
      { key: 'secondary_button', label: 'الزر الثانوي' },
    ]},
  ],
  faq: [
    { key: 'hero', label: 'القسم الرئيسي', fields: [
      { key: 'title', label: 'العنوان' },
      { key: 'description', label: 'الوصف', type: 'textarea' },
    ]},
    { key: 'categories', label: 'الفئات والأسئلة', arrayKey: 'items', arrayLabel: 'فئة', arrayFields: [
      { key: 'title', label: 'اسم الفئة' },
    ]},
  ],
  contact: [
    { key: 'hero', label: 'القسم الرئيسي', fields: [
      { key: 'title', label: 'العنوان' },
      { key: 'description', label: 'الوصف', type: 'textarea' },
    ]},
    { key: 'info', label: 'معلومات التواصل', arrayKey: 'items', arrayLabel: 'معلومة', arrayFields: [
      { key: 'title', label: 'العنوان' },
      { key: 'value', label: 'القيمة' },
      { key: 'link', label: 'الرابط', bilingual: false },
    ]},
    { key: 'whatsapp', label: 'واتساب', fields: [
      { key: 'number', label: 'الرقم', bilingual: false },
      { key: 'message', label: 'رسالة ترحيب', bilingual: false },
      { key: 'button_text', label: 'نص الزر' },
    ]},
  ],
  terms: [
    { key: 'hero', label: 'القسم الرئيسي', fields: [
      { key: 'title', label: 'العنوان' },
      { key: 'last_updated', label: 'آخر تحديث' },
    ]},
    { key: 'sections', label: 'أقسام الشروط', arrayKey: 'items', arrayLabel: 'قسم', arrayFields: [
      { key: 'title', label: 'العنوان' },
      { key: 'content', label: 'المحتوى', type: 'textarea' },
    ]},
  ],
  privacy: [
    { key: 'hero', label: 'القسم الرئيسي', fields: [
      { key: 'title', label: 'العنوان' },
      { key: 'last_updated', label: 'آخر تحديث' },
    ]},
    { key: 'sections', label: 'أقسام الخصوصية', arrayKey: 'items', arrayLabel: 'قسم', arrayFields: [
      { key: 'title', label: 'العنوان' },
      { key: 'content', label: 'المحتوى', type: 'textarea' },
    ]},
  ],
  refund: [
    { key: 'hero', label: 'القسم الرئيسي', fields: [
      { key: 'title', label: 'العنوان' },
      { key: 'description', label: 'الوصف', type: 'textarea' },
    ]},
    { key: 'scenarios', label: 'حالات الاسترداد', arrayKey: 'items', arrayLabel: 'حالة', arrayFields: [
      { key: 'title', label: 'العنوان' },
      { key: 'description', label: 'الوصف', type: 'textarea' },
    ]},
    { key: 'process_steps', label: 'خطوات الاسترداد', arrayKey: 'items', arrayLabel: 'خطوة', arrayFields: [
      { key: 'title', label: 'العنوان' },
      { key: 'description', label: 'الوصف' },
    ]},
    { key: 'fee_types', label: 'أنواع الرسوم', arrayKey: 'items', arrayLabel: 'نوع رسوم', arrayFields: [
      { key: 'title', label: 'العنوان' },
      { key: 'description', label: 'الوصف' },
      { key: 'refundable', label: 'حالة الاسترداد' },
    ]},
    { key: 'faqs', label: 'الأسئلة الشائعة', arrayKey: 'items', arrayLabel: 'سؤال', arrayFields: [
      { key: 'question', label: 'السؤال' },
      { key: 'answer', label: 'الإجابة', type: 'textarea' },
    ]},
  ],
};

function BilField({ field, content, onChange }: {
  field: FieldDef;
  content: Record<string, any>;
  onChange: (key: string, value: string) => void;
}) {
  const bilingual = field.bilingual !== false;
  const InputComp = field.type === 'textarea' ? Textarea : Input;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{field.label}</Label>
      <div className={bilingual ? 'grid grid-cols-2 gap-2' : ''}>
        <div>
          {bilingual && <span className="text-xs text-muted-foreground mb-1 block">عربي</span>}
          <InputComp
            value={content[field.key] || ''}
            onChange={(e: any) => onChange(field.key, e.target.value)}
            dir="rtl"
            className="text-sm"
          />
        </div>
        {bilingual && (
          <div>
            <span className="text-xs text-muted-foreground mb-1 block">English</span>
            <InputComp
              value={content[field.key + '_en'] || ''}
              onChange={(e: any) => onChange(field.key + '_en', e.target.value)}
              dir="ltr"
              className="text-sm"
            />
          </div>
        )}
      </div>
      {field.type === 'image' && content[field.key] && (
        <img src={content[field.key]} alt="" className="h-20 w-auto rounded-lg object-cover" />
      )}
    </div>
  );
}

export default function ContentManagement() {
  const [activePage, setActivePage] = useState('about');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const { data: allContent, isLoading } = useAllSiteContent();
  const queryClient = useQueryClient();

  const getContent = (page: string, section: string) => {
    const row = allContent?.find((r: any) => r.page === page && r.section === section);
    return row?.content || {};
  };

  const openEditor = (page: string, sectionKey: string) => {
    setEditContent(JSON.parse(JSON.stringify(getContent(page, sectionKey))));
    setEditingSection(`${page}:${sectionKey}`);
  };

  const updateField = (key: string, value: string) => {
    setEditContent(prev => ({ ...prev, [key]: value }));
  };

  const updateArrayItem = (arrayKey: string, index: number, field: string, value: string) => {
    setEditContent(prev => {
      const arr = [...(prev[arrayKey] || [])];
      if (typeof arr[index] === 'string') {
        arr[index] = value;
      } else {
        arr[index] = { ...arr[index], [field]: value };
      }
      return { ...prev, [arrayKey]: arr };
    });
  };

  const addArrayItem = (arrayKey: string, sectionDef: SectionDef) => {
    setEditContent(prev => {
      const arr = [...(prev[arrayKey] || [])];
      if (sectionDef.simpleArray) {
        arr.push('');
      } else {
        const newItem: Record<string, string> = {};
        sectionDef.arrayFields?.forEach(f => { newItem[f.key] = ''; if (f.bilingual !== false) newItem[f.key + '_en'] = ''; });
        arr.push(newItem);
      }
      return { ...prev, [arrayKey]: arr };
    });
  };

  const removeArrayItem = (arrayKey: string, index: number) => {
    setEditContent(prev => {
      const arr = [...(prev[arrayKey] || [])];
      arr.splice(index, 1);
      return { ...prev, [arrayKey]: arr };
    });
  };

  const handleSave = async () => {
    if (!editingSection) return;
    const [page, section] = editingSection.split(':');
    setSaving(true);
    try {
      const existing = allContent?.find((r: any) => r.page === page && r.section === section);
      if (existing) {
        const { error } = await (supabase as any)
          .from('site_content')
          .update({ content: editContent })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const sectionDefs = SECTION_CONFIG[page] || [];
        const sectionDef = sectionDefs.find(s => s.key === section);
        const displayOrder = sectionDef ? sectionDefs.indexOf(sectionDef) + 1 : 1;
        const { error } = await (supabase as any)
          .from('site_content')
          .insert({ page, section, content: editContent, display_order: displayOrder });
        if (error) throw error;
      }
      toast.success('تم الحفظ بنجاح');
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      queryClient.invalidateQueries({ queryKey: ['site-content-all'] });
      setEditingSection(null);
    } catch (err: any) {
      toast.error('خطأ في الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentSectionDef = editingSection
    ? SECTION_CONFIG[editingSection.split(':')[0]]?.find(s => s.key === editingSection.split(':')[1])
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b">
        <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
          <Edit className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">إدارة محتوى الموقع</h2>
          <p className="text-muted-foreground text-sm">تعديل جميع محتويات الصفحات العامة</p>
        </div>
      </div>

      <Tabs value={activePage} onValueChange={setActivePage}>
        <TabsList className="w-full flex-wrap h-auto gap-1">
          {PAGES.map(p => {
            const Icon = p.icon;
            return (
              <TabsTrigger key={p.key} value={p.key} className="gap-2">
                <Icon className="h-4 w-4" />
                {p.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {PAGES.map(p => (
          <TabsContent key={p.key} value={p.key} className="space-y-4 mt-4">
            {(SECTION_CONFIG[p.key] || []).map(sectionDef => {
              const content = getContent(p.key, sectionDef.key);
              const hasContent = Object.keys(content).length > 0;

              return (
                <Card key={sectionDef.key}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        {sectionDef.label}
                        {hasContent ? (
                          <Badge variant="secondary" className="text-xs">محتوى موجود</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">فارغ</Badge>
                        )}
                      </CardTitle>
                      <Button size="sm" onClick={() => openEditor(p.key, sectionDef.key)}>
                        <Edit className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                    </div>
                  </CardHeader>
                  {hasContent && (
                    <CardContent className="pt-0">
                      <div className="text-sm text-muted-foreground space-y-1">
                        {sectionDef.fields?.slice(0, 2).map(f => (
                          <p key={f.key} className="truncate">
                            <span className="font-medium">{f.label}:</span> {content[f.key] || '—'}
                          </p>
                        ))}
                        {sectionDef.arrayKey && (
                          <p>
                            <span className="font-medium">{sectionDef.arrayLabel}:</span>{' '}
                            {(content[sectionDef.arrayKey] || []).length} عنصر
                          </p>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              تعديل: {currentSectionDef?.label}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pl-1">
            <div className="space-y-4 p-1">
              {/* Regular fields */}
              {currentSectionDef?.fields?.map(field => (
                <BilField
                  key={field.key}
                  field={field}
                  content={editContent}
                  onChange={updateField}
                />
              ))}

              {/* Simple array (paragraphs) */}
              {currentSectionDef?.simpleArray && currentSectionDef.arrayKey && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">الفقرات</Label>
                    <Button size="sm" variant="outline" onClick={() => addArrayItem(currentSectionDef.arrayKey!, currentSectionDef)}>
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة فقرة
                    </Button>
                  </div>
                  {(editContent[currentSectionDef.arrayKey] || []).map((_: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">فقرة {i + 1}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeArrayItem(currentSectionDef.arrayKey!, i)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs text-muted-foreground">عربي</span>
                          <Textarea value={editContent[currentSectionDef.arrayKey!]?.[i] || ''} onChange={e => updateArrayItem(currentSectionDef.arrayKey!, i, '', e.target.value)} dir="rtl" className="text-sm" rows={3} />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">English</span>
                          <Textarea value={editContent[currentSectionDef.arrayKey! + '_en']?.[i] || ''} onChange={e => {
                            setEditContent(prev => {
                              const arr = [...(prev[currentSectionDef.arrayKey! + '_en'] || [])];
                              arr[i] = e.target.value;
                              return { ...prev, [currentSectionDef.arrayKey! + '_en']: arr };
                            });
                          }} dir="ltr" className="text-sm" rows={3} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Object array */}
              {!currentSectionDef?.simpleArray && currentSectionDef?.arrayKey && currentSectionDef.arrayFields && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">{currentSectionDef.arrayLabel || 'العناصر'}</Label>
                    <Button size="sm" variant="outline" onClick={() => addArrayItem(currentSectionDef.arrayKey!, currentSectionDef)}>
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة {currentSectionDef.arrayLabel}
                    </Button>
                  </div>
                  {(editContent[currentSectionDef.arrayKey] || []).map((item: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{currentSectionDef.arrayLabel} {i + 1}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeArrayItem(currentSectionDef.arrayKey!, i)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {currentSectionDef.arrayFields!.map(field => {
                        const bilingual = field.bilingual !== false;
                        const InputComp = field.type === 'textarea' ? Textarea : Input;
                        return (
                          <div key={field.key} className="space-y-1">
                            <Label className="text-xs">{field.label}</Label>
                            <div className={bilingual ? 'grid grid-cols-2 gap-2' : ''}>
                              <div>
                                {bilingual && <span className="text-[10px] text-muted-foreground">عربي</span>}
                                <InputComp value={item[field.key] || ''} onChange={(e: any) => updateArrayItem(currentSectionDef.arrayKey!, i, field.key, e.target.value)} dir="rtl" className="text-sm" />
                              </div>
                              {bilingual && (
                                <div>
                                  <span className="text-[10px] text-muted-foreground">English</span>
                                  <InputComp value={item[field.key + '_en'] || ''} onChange={(e: any) => updateArrayItem(currentSectionDef.arrayKey!, i, field.key + '_en', e.target.value)} dir="ltr" className="text-sm" />
                                </div>
                              )}
                            </div>
                            {field.type === 'image' && item[field.key] && (
                              <img src={item[field.key]} alt="" className="h-16 w-16 rounded-lg object-cover" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setEditingSection(null)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
              حفظ التغييرات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
