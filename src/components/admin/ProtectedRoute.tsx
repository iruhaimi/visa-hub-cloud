import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'agent' | 'customer' | 'tour_operator')[];
  requireSuperAdmin?: boolean;
}

export default function ProtectedRoute({ children, allowedRoles, requireSuperAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, isAgent, isCustomer, roles } = useAuth();
  const { isSuperAdmin, loading: permissionsLoading } = usePermissions();
  const location = useLocation();

  if (isLoading || (requireSuperAdmin && permissionsLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const hasAccess = allowedRoles.some(role => {
    if (role === 'admin') return isAdmin;
    if (role === 'agent') return isAgent;
    if (role === 'customer') return isCustomer;
    if (role === 'tour_operator') return roles.includes('tour_operator');
    return false;
  });

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
