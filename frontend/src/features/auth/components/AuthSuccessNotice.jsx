import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthSuccessNotice({ message, destination }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => navigate(destination), 2000);
    return () => window.clearTimeout(timer);
  }, [destination, navigate]);

  return (
    <div
      className="alert alert-success shadow-sm position-fixed top-0 start-50 translate-middle-x mt-3 text-center"
      style={{ zIndex: 2000, width: 'min(460px, calc(100vw - 2rem))' }}
      role="status"
    >
      {message}
    </div>
  );
}
