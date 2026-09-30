import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AccessErrorHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const onForbidden = () => navigate('/forbidden', { replace: true });
    window.addEventListener('auth:forbidden', onForbidden);
    return () => window.removeEventListener('auth:forbidden', onForbidden);
  }, [navigate]);

  return null;
}
