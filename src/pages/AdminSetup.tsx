import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminInitialization } from '@/hooks/useAdminInitialization';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield } from 'lucide-react';

const AdminSetup: React.FC = () => {
  const { user, signIn } = useAuth();
  const { isInitialized, isLoading, initializeFirstAdminDirect } = useAdminInitialization();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show loading while checking initialization status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  // If already initialized, redirect to login
  if (isInitialized) {
    return <Navigate to="/admin/login" replace />;
  }

  // If user is already authenticated, they shouldn't be here
  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use direct initialization to bypass email confirmation
      const initResult = await initializeFirstAdminDirect(email, password);
      
      if (!initResult.success) {
        // Handle specific error cases
        if (initResult.error?.includes('rate_limit') || initResult.error?.includes('rate limit')) {
          throw new Error('Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer.');
        }
        throw new Error(initResult.error || 'Échec de l\'initialisation administrateur');
      }

      toast.success('Compte administrateur créé avec succès !');
      
      // Now sign in the newly created user
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        // If sign in fails, at least the admin was created
        toast.warning('Compte créé mais connexion échouée. Utilisez la page de connexion.');
        window.location.href = '/admin/login';
        return;
      }

      // Redirect to admin area
      window.location.href = '/admin';
      
    } catch (error: any) {
      console.error('Setup error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      if (errorMessage.includes('duplicate key')) {
        errorMessage = 'Un compte avec cette adresse email existe déjà.';
      } else if (errorMessage.includes('invalid input syntax')) {
        errorMessage = 'Format d\'email invalide.';
      }
      
      toast.error(`Erreur lors de la création du compte : ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-2xl">Configuration Initiale</CardTitle>
          <CardDescription>
            Créez le premier compte administrateur pour accéder au système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  required
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ressaisissez le mot de passe"
                required
                disabled={isSubmitting}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Création en cours...' : 'Créer le compte administrateur'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Important :</strong> Ce formulaire n'est accessible que lors de la première configuration. 
              Une fois un administrateur créé, cette page ne sera plus disponible.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Cette méthode d'initialisation contourne la confirmation d'email pour faciliter la configuration initiale.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;