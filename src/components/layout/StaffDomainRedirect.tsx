import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const STAFF_DOMAINS = ['daleltravel.com', 'www.daleltravel.com'];

export default function StaffDomainRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hostname = window.location.hostname;
    const isStaffDomain = STAFF_DOMAINS.includes(hostname);
    
    if (isStaffDomain && location.pathname === '/') {
      navigate('/portal-x7k9m2', { replace: true });
    }
  }, [navigate, location.pathname]);

  return null;
}
