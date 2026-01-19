
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Lock, Eye, EyeOff, LogOut, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AdminAuthProps {
  children: React.ReactNode;
}

const AdminAuth: React.FC<AdminAuthProps> = ({ children }) => {
  const { user, isLoading, isAdmin, signIn, signOut, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    
    await signIn(email, password);
    setIsSigningIn(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    
    const { error } = await resetPassword(resetEmail);
    setIsResetting(false);
    
    if (!error) {
      setMode('login');
      setResetEmail('');
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-accent/10 rounded-full">
                <Lock className="h-8 w-8 text-accent" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Accès Administration</CardTitle>
            <CardDescription>
              {!user ? 'Connectez-vous avec votre compte administrateur' : 'Accès administrateur requis'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!user ? (
              <>
                {mode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@exemple.com"
                          className="pl-10"
                          required
                          autoFocus
                        />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Entrez votre mot de passe"
                          className="pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isSigningIn}>
                      <Lock className="h-4 w-4 mr-2" />
                      {isSigningIn ? 'Connexion...' : 'Se connecter'}
                    </Button>
                    
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="w-full text-sm text-muted-foreground hover:text-accent underline-offset-4 hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <div className="relative">
                        <Input
                          id="reset-email"
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="votre@email.com"
                          className="pl-10"
                          required
                          autoFocus
                        />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isResetting}>
                      <Mail className="h-4 w-4 mr-2" />
                      {isResetting ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                    </Button>
                    
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="w-full text-sm text-muted-foreground hover:text-accent"
                    >
                      ← Retour à la connexion
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Vous êtes connecté en tant que: <br />
                  <strong>{user.email}</strong>
                </p>
                <p className="text-destructive">
                  Votre compte n'a pas les privilèges administrateur requis.
                </p>
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Se déconnecter
                </Button>
              </div>
            )}
            
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Protection d'accès - Gaspard Boréal © 2025 - 2026</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Barre de déconnexion */}
      <div className="bg-card border-b border-border px-4 py-2">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Mode Administration - {user?.email}</span>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>
      
      {children}
    </div>
  );
};

export default AdminAuth;
