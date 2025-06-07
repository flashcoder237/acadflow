// ========================================
// FICHIER: src/pages/ProfilePage.tsx - Page du profil
// ========================================

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Edit, 
  Save, 
  Camera, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  GraduationCap,
  Building,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useEtablissement } from '@/stores/appStore';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est requis'),
  last_name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  specialite: z.string().optional()
});

type ProfileForm = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const etablissement = useEtablissement();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      telephone: user?.telephone || '',
      adresse: user?.adresse || '',
      specialite: user?.specialite || ''
    }
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsSubmitting(true);
    try {
      // Simuler une mise à jour
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateUser(data);
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Utilisateur non connecté</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
          <p className="text-gray-600">
            Gérez vos informations personnelles et professionnelles
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Vos données de base et de contact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <Input
                      {...register('first_name')}
                      disabled={!isEditing}
                      className={cn(errors.first_name && "border-red-500")}
                    />
                    {errors.first_name && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.first_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <Input
                      {...register('last_name')}
                      disabled={!isEditing}
                      className={cn(errors.last_name && "border-red-500")}
                    />
                    {errors.last_name && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.last_name.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    {...register('email')}
                    disabled={!isEditing}
                    className={cn(errors.email && "border-red-500")}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <Input
                    type="tel"
                    {...register('telephone')}
                    disabled={!isEditing}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <Input
                    {...register('adresse')}
                    disabled={!isEditing}
                    placeholder="Votre adresse complète"
                  />
                </div>

                {user.type_utilisateur === 'enseignant' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spécialité
                    </label>
                    <Input
                      {...register('specialite')}
                      disabled={!isEditing}
                      placeholder="Ex: Informatique, Mathématiques, Physique..."
                    />
                  </div>
                )}

                {isEditing && (
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar avec photo et infos */}
        <div className="space-y-6">
          {/* Photo de profil */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  {user.photo ? (
                    <img 
                      src={user.photo} 
                      alt="Photo de profil"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                {isEditing && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute bottom-3 right-0 w-8 h-8 rounded-full"
                    onClick={() => {
                      // TODO: Implémenter l'upload de photo
                      alert('Fonctionnalité d\'upload de photo à implémenter');
                    }}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <h3 className="font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-sm text-gray-500 mb-3">{user.matricule}</p>
              <Badge variant="outline" className="capitalize">
                {user.type_utilisateur}
              </Badge>
            </CardContent>
          </Card>

          {/* Informations de contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
              )}

              {user.telephone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Téléphone</p>
                    <p className="text-sm text-gray-600">{user.telephone}</p>
                  </div>
                </div>
              )}

              {user.adresse && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Adresse</p>
                    <p className="text-sm text-gray-600">{user.adresse}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations système */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Établissement</p>
                  <p className="text-sm text-gray-600">{etablissement?.acronyme}</p>
                </div>
              </div>

              {user.grade && (
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Grade</p>
                    <p className="text-sm text-gray-600 capitalize">{user.grade}</p>
                  </div>
                </div>
              )}

              {user.specialite && (
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Spécialité</p>
                    <p className="text-sm text-gray-600">{user.specialite}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Membre depuis</p>
                  <p className="text-sm text-gray-600">
                    {new Date(user.date_joined).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {user.last_login && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Dernière connexion</p>
                    <p className="text-sm text-gray-600">
                      {new Date(user.last_login).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques rapides pour enseignants */}
          {user.type_utilisateur === 'enseignant' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mes statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {user.nombre_enseignements || 0}
                  </div>
                  <p className="text-sm text-blue-700">Enseignements</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">24</div>
                    <p className="text-xs text-green-700">Évaluations</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">156</div>
                    <p className="text-xs text-orange-700">Étudiants</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;