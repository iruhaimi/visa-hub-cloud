import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Phone, CreditCard, Wallet, Save, Loader2, Camera, Upload, FileText, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { direction } = useLanguage();
  const { toast } = useToast();
  const isRTL = direction === 'rtl';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    nationality: '',
    passport_number: '',
    passport_expiry: '',
    address: '',
    city: '',
    country: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        nationality: profile.nationality || '',
        passport_number: profile.passport_number || '',
        passport_expiry: profile.passport_expiry || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || '',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى اختيار ملف صورة' : 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت' : 'Image size must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await refreshProfile();

      toast({
        title: isRTL ? 'تم الرفع' : 'Uploaded',
        description: isRTL ? 'تم تحديث صورتك الشخصية بنجاح' : 'Your profile picture has been updated',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء رفع الصورة' : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          nationality: formData.nationality || null,
          passport_number: formData.passport_number || null,
          passport_expiry: formData.passport_expiry || null,
          address: formData.address || null,
          city: formData.city || null,
          country: formData.country || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      
      toast({
        title: isRTL ? 'تم الحفظ' : 'Saved',
        description: isRTL ? 'تم تحديث بياناتك بنجاح' : 'Your profile has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء تحديث البيانات' : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const labels = {
    pageTitle: isRTL ? 'الملف الشخصي' : 'Profile',
    personalInfo: isRTL ? 'المعلومات الشخصية' : 'Personal Information',
    contactInfo: isRTL ? 'معلومات الاتصال' : 'Contact Information',
    passportInfo: isRTL ? 'معلومات جواز السفر' : 'Passport Information',
    walletBalance: isRTL ? 'رصيد المحفظة' : 'Wallet Balance',
    fullName: isRTL ? 'الاسم الكامل' : 'Full Name',
    email: isRTL ? 'البريد الإلكتروني' : 'Email',
    phone: isRTL ? 'رقم الهاتف' : 'Phone Number',
    dateOfBirth: isRTL ? 'تاريخ الميلاد' : 'Date of Birth',
    nationality: isRTL ? 'الجنسية' : 'Nationality',
    passportNumber: isRTL ? 'رقم جواز السفر' : 'Passport Number',
    passportExpiry: isRTL ? 'تاريخ انتهاء الجواز' : 'Passport Expiry',
    address: isRTL ? 'العنوان' : 'Address',
    city: isRTL ? 'المدينة' : 'City',
    country: isRTL ? 'الدولة' : 'Country',
    save: isRTL ? 'حفظ التغييرات' : 'Save Changes',
    saving: isRTL ? 'جاري الحفظ...' : 'Saving...',
    changePhoto: isRTL ? 'تغيير الصورة' : 'Change Photo',
    uploading: isRTL ? 'جاري الرفع...' : 'Uploading...',
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="container mx-auto py-8 px-4" dir={direction}>
      <div className="max-w-4xl mx-auto">
        {/* Header with Avatar Upload */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            
            {/* Upload Overlay */}
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{profile?.full_name || labels.pageTitle}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {labels.uploading}
                </>
              ) : (
                <>
                  <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {labels.changePhoto}
                </>
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {labels.personalInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">{labels.fullName}</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder={labels.fullName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">{labels.dateOfBirth}</Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">{labels.nationality}</Label>
                <Input
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  placeholder={labels.nationality}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                {labels.contactInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">{labels.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{labels.phone}</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={isRTL ? '+966 5XX XXX XXXX' : '+966 5XX XXX XXXX'}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">{labels.address}</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder={labels.address}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{labels.city}</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder={labels.city}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{labels.country}</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder={labels.country}
                />
              </div>
            </CardContent>
          </Card>

          {/* Passport Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {labels.passportInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="passport_number">{labels.passportNumber}</Label>
                <Input
                  id="passport_number"
                  name="passport_number"
                  value={formData.passport_number}
                  onChange={handleInputChange}
                  placeholder={labels.passportNumber}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passport_expiry">{labels.passportExpiry}</Label>
                <Input
                  id="passport_expiry"
                  name="passport_expiry"
                  type="date"
                  value={formData.passport_expiry}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Wallet Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {labels.walletBalance}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {profile?.wallet_balance || 0} {isRTL ? 'ر.س' : 'SAR'}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isRTL ? 'روابط سريعة' : 'Quick Links'}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link 
                to="/my-applications" 
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="font-medium">
                    {isRTL ? 'طلباتي' : 'My Applications'}
                  </span>
                </div>
                {isRTL ? (
                  <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </Link>
              
              <Link 
                to="/track-refund" 
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-500/10 text-orange-500">
                    <RotateCcw className="h-5 w-5" />
                  </div>
                  <span className="font-medium">
                    {isRTL ? 'تتبع حالة الاسترداد' : 'Track Refund Status'}
                  </span>
                </div>
                {isRTL ? (
                  <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </Link>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {labels.saving}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {labels.save}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
