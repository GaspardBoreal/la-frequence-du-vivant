import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useAdminInitialization } from '@/hooks/useAdminInitialization';
import AdminAuth from '@/components/AdminAuth';

const AdminLogin: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const { isInitialized, isLoading: initLoading } = useAdminInitialization();

  if (isLoading || initLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  // If system is not initialized, redirect to setup
  if (!isInitialized) {
    return <Navigate to="/admin/setup" replace />;
  }

  // If user is already authenticated and is admin, redirect to admin
  if (user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <AdminAuth>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accès Administrateur</h1>
          <p className="text-muted-foreground">Vous êtes maintenant connecté en tant qu'administrateur.</p>
        </div>
      </div>
    </AdminAuth>
  );
};

export default AdminLogin;