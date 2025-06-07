// ========================================
// FICHIER: src/pages/LoginPage.tsx - Page de connexion moderne
// ========================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, School, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { LoginRequest } from '@/types';
import { cn } from '@/lib/utils';

// Schéma de validation
const loginSchema = z.object({
  username: z.string().min(1, 'Le nom d\'utilisateur est requis'),
  password: z.string().min(1, 'Le mot de passe est requis')
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const { etablissement, loadInitialData } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  // Redirection si déjà authentifié
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Charger les données de l'établissement au montage
  useEffect(() => {
    loadInitialData();
    setFocus('username');
  }, [loadInitialData, setFocus]);

  // Nettoyer les erreurs quand l'utilisateur commence à taper
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const onSubmit = async (data: LoginForm) => {
    clearError();
    
    try {
      await login(data);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setLoginAttempts(prev => prev + 1);
      console.error('Erreur de connexion:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="w-full max-w-md relative">
        {/* Logo et informations de l'établissement */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            {etablissement?.logo ? (
              <img 
                src={etablissement.logo} 
                alt={etablissement.acronyme}
                className="w-12 h-12 object-contain rounded-full"
              />
            ) : (
              <School className="w-8 h-8 text-white" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {etablissement?.acronyme || 'AcadFlow'}
          </h1>
          
          {etablissement && (
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium">{etablissement.nom}</p>
              {etablissement.universite_tutelle_nom && (
                <p className="text-xs">{etablissement.universite_tutelle_nom}</p>
              )}
            </div>
          )}
        </div>

        {/* Formulaire de connexion */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm animate-slide-in-from-top">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center text-gray-900">
              Connexion
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Accédez à votre espace de gestion des notes
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Champ nom d'utilisateur */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Nom d'utilisateur ou matricule
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Entrez votre nom d'utilisateur"
                  className={cn(
                    "transition-all duration-200",
                    errors.username && "border-red-500 focus:border-red-500 focus:ring-red-500"
                  )}
                  {...register('username')}
                  onKeyPress={handleKeyPress}
                  disabled={isSubmitting}
                />
                {errors.username && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Champ mot de passe */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre mot de passe"
                    className={cn(
                      "pr-10 transition-all duration-200",
                      errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                    {...register('password')}
                    onKeyPress={handleKeyPress}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Message d'erreur global */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  {loginAttempts >= 3 && (
                    <p className="text-xs text-red-600 mt-1">
                      Plusieurs tentatives échouées. Vérifiez vos identifiants.
                    </p>
                  )}
                </div>
              )}

              {/* Bouton de connexion */}
              <Button
                type="submit"
                className="w-full h-11 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>

            {/* Liens d'aide */}
            <div className="mt-6 text-center space-y-2">
              <div className="text-xs text-gray-500">
                Problème de connexion ?
              </div>
              <div className="flex justify-center space-x-4 text-xs">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 underline transition-colors"
                  onClick={() => {
                    // TODO: Implémenter la récupération de mot de passe
                    alert('Contactez l\'administration pour récupérer votre mot de passe.');
                  }}
                >
                  Mot de passe oublié ?
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 underline transition-colors"
                  onClick={() => {
                    // TODO: Ajouter un modal d'aide
                    alert('Contactez le service informatique pour obtenir de l\'aide.');
                  }}
                >
                  Aide
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer avec informations système */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>AcadFlow v1.0 - Système de gestion académique</p>
          {etablissement?.site_web && (
            <p className="mt-1">
              <a 
                href={etablissement.site_web}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {etablissement.site_web}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;