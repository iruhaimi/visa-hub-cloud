import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield, Loader2, Lock, Mail } from 'lucide-react';
import { filterArabicChars } from '@/lib/inputFilters';
import logo from '@/assets/logo.jpeg';

export default function StaffAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('بيانات الدخول غير صحيحة');
        } else {
          setError('حدث خطأ في تسجيل الدخول');
        }
        return;
      }

      if (data.user) {
        // Check if user has admin or agent role
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        if (rolesError) {
          setError('حدث خطأ في التحقق من الصلاحيات');
          await supabase.auth.signOut();
          return;
        }

        const userRoles = roles?.map(r => r.role) || [];
        const isAdmin = userRoles.includes('admin');
        const isAgent = userRoles.includes('agent');

        if (!isAdmin && !isAgent) {
          setError('ليس لديك صلاحية الوصول لهذه اللوحة');
          await supabase.auth.signOut();
          return;
        }

        toast.success('تم تسجيل الدخول بنجاح');
        
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/agent');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <Card className="w-full max-w-md relative z-10 border-slate-700 bg-slate-800/90 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <img
                src={logo}
                alt="عطلات رحلاتكم"
                className="h-20 w-20 rounded-full object-cover relative z-10 border-2 border-slate-600"
              />
            </div>
          </div>
          
          {/* Shield icon */}
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>

          <div>
            <CardTitle className="text-2xl font-bold text-white">
              بوابة الموظفين
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              تسجيل الدخول للمشرفين والوكلاء فقط
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-5" dir="rtl">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(filterArabicChars(e.target.value))}
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement;
                    input.value = filterArabicChars(input.value);
                  }}
                  placeholder="admin@example.com"
                  className="pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary"
                  dir="ltr"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(filterArabicChars(e.target.value))}
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement;
                    input.value = filterArabicChars(input.value);
                  }}
                  placeholder="••••••••"
                  className="pr-10 pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary"
                  dir="ltr"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-5"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري التحقق...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 ml-2" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>

          {/* Security notice */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              🔒 هذه البوابة مخصصة للموظفين المعتمدين فقط. جميع محاولات الدخول مسجلة.
            </p>
          </div>

          {/* Back to main site link */}
          <div className="mt-4 text-center">
            <a
              href="/"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              العودة للموقع الرئيسي ←
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
