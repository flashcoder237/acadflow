// ========================================
// FICHIER: src/pages/CreateEvaluationPage.tsx - Création d'évaluation avec vraies données
// ========================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Save, 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Users, 
  AlertCircle,
  BookOpen,
  Clock,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import { useAuthStore } from '@/stores/authStore';
import { useSessions, useNotificationActions } from '@/stores/appStore';
import { apiClient } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { CreateEvaluationRequest, TypeEvaluation } from '@/types';

// Schéma de validation
const evaluationSchema = z.object({
  nom: z.string().min(1, 'Le nom de l\'évaluation est requis'),
  enseignement: z.number().min(1, 'L\'enseignement est requis'),
  type_evaluation: z.number().min(1, 'Le type d\'évaluation est requis'),
  session: z.number().min(1, 'La session est requise'),
  date_evaluation: z.string().min(1, 'La date d\'évaluation est requise'),
  note_sur: z.number().min(1, 'La note maximale doit être supérieure à 0').max(100, 'La note maximale ne peut pas dépasser 100')
});

type EvaluationForm = z.infer<typeof evaluationSchema>;

const CreateEvaluationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const sessions = useSessions();
  const { showSuccess, showError } = useNotificationActions();

  // ID d'enseignement pré-sélectionné depuis l'URL
  const preSelectedEnseignement = searchParams.get('enseignement');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    setFocus,
    reset
  } = useForm<EvaluationForm>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      nom: '',
      enseignement: preSelectedEnseignement ? parseInt(preSelectedEnseignement) : 0,
      type_evaluation: 0,
      session: 0,
      date_evaluation: '',
      note_sur: 20
    }
  });

  const watchedEnseignement = watch('enseignement');

  // Charger les enseignements
  const { data: enseignements, isLoading: loadingEnseignements, error: errorEnseignements } = useQuery({
    queryKey: ['enseignements'],
    queryFn: () => apiClient.getEnseignements({ page_size: 100 }),
    enabled: !!user?.enseignant_id,
    retry: 2,
    staleTime: 5 * 60 * 1000
  });

  // Charger les types d'évaluation
  const { data: typesEvaluation, isLoading: loadingTypes, error: errorTypes } = useQuery({
    queryKey: ['types-evaluation'],
    queryFn: () => apiClient.getTypesEvaluation(),
    retry: 2,
    staleTime: 10 * 60 * 1000
  });

  // Mutation pour créer l'évaluation
  const createMutation = useMutation({
    mutationFn: (data: CreateEvaluationRequest) => apiClient.createEvaluation(data),
    onSuccess: (evaluation) => {
      showSuccess(
        'Évaluation créée',
        `L'évaluation "${evaluation.nom}" a été créée avec succès`
      );
      navigate('/evaluations');
    },
    onError: (error: any) => {
      console.error('Erreur création évaluation:', error);
      showError(
        'Erreur de création',
        error.message || 'Impossible de créer l\'évaluation'
      );
    }
  });

  // Focus sur le nom au chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      setFocus('nom');
    }, 100);
    return () => clearTimeout(timer);
  }, [setFocus]);

  // Pré-remplir l'enseignement si fourni dans l'URL
  useEffect(() => {
    if (preSelectedEnseignement && enseignements?.results) {
      const enseignement = enseignements.results.find(e => e.id === parseInt(preSelectedEnseignement));
      if (enseignement) {
        setValue('enseignement', enseignement.id);
      }
    }
  }, [preSelectedEnseignement, enseignements, setValue]);

  // Préremplir avec des valeurs par défaut intelligentes
  useEffect(() => {
    if (sessions.length > 0 && !watch('session')) {
      // Sélectionner la première session active
      const sessionActive = sessions.find(s => s.actif) || sessions[0];
      setValue('session', sessionActive.id);
    }
    
    // Date d'évaluation par défaut : aujourd'hui
    if (!watch('date_evaluation')) {
      const today = new Date().toISOString().split('T')[0];
      setValue('date_evaluation', today);
    }
  }, [sessions, setValue, watch]);

  const onSubmit = async (data: EvaluationForm) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      // L'erreur est gérée dans onError
    }
  };

  const selectedEnseignement = enseignements?.results.find(e => e.id === watchedEnseignement);

  // Gestion des erreurs de chargement
  if (errorEnseignements || errorTypes) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">
            Impossible de charger les données nécessaires pour créer une évaluation
          </p>
          <div className="space-x-3">
            <Button onClick={() => window.location.reload()} variant="outline">
              Recharger la page
            </Button>
            <Button onClick={() => navigate('/evaluations')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux évaluations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingEnseignements || loadingTypes) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" text="Chargement des données..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle évaluation</h1>
          <p className="text-gray-600">
            Créez une nouvelle évaluation pour vos enseignements
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informations générales
                </CardTitle>
                <CardDescription>
                  Définissez les informations de base de l'évaluation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nom de l'évaluation */}
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'évaluation *
                  </label>
                  <Input
                    id="nom"
                    type="text"
                    placeholder="Ex: Contrôle Continu 1, Examen Final..."
                    className={cn(errors.nom && "border-red-500")}
                    {...register('nom')}
                  />
                  {errors.nom && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.nom.message}
                    </p>
                  )}
                </div>

                {/* Enseignement */}
                <div>
                  <label htmlFor="enseignement" className="block text-sm font-medium text-gray-700 mb-1">
                    Enseignement *
                  </label>
                  <select
                    id="enseignement"
                    className={cn(
                      "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.enseignement && "border-red-500"
                    )}
                    {...register('enseignement', { valueAsNumber: true })}
                  >
                    <option value={0}>Sélectionnez un enseignement</option>
                    {enseignements?.results.map(enseignement => (
                      <option key={enseignement.id} value={enseignement.id}>
                        {enseignement.ec_code} - {enseignement.ec_nom} ({enseignement.classe_nom})
                      </option>
                    ))}
                  </select>
                  {errors.enseignement && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.enseignement.message}
                    </p>
                  )}
                  {enseignements?.results.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Aucun enseignement disponible. Contactez l'administration.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Type d'évaluation */}
                  <div>
                    <label htmlFor="type_evaluation" className="block text-sm font-medium text-gray-700 mb-1">
                      Type d'évaluation *
                    </label>
                    <select
                      id="type_evaluation"
                      className={cn(
                        "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                        errors.type_evaluation && "border-red-500"
                      )}
                      {...register('type_evaluation', { valueAsNumber: true })}
                    >
                      <option value={0}>Sélectionnez un type</option>
                      {typesEvaluation?.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.nom} ({type.code})
                        </option>
                      ))}
                    </select>
                    {errors.type_evaluation && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.type_evaluation.message}
                      </p>
                    )}
                  </div>

                  {/* Session */}
                  <div>
                    <label htmlFor="session" className="block text-sm font-medium text-gray-700 mb-1">
                      Session *
                    </label>
                    <select
                      id="session"
                      className={cn(
                        "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                        errors.session && "border-red-500"
                      )}
                      {...register('session', { valueAsNumber: true })}
                    >
                      <option value={0}>Sélectionnez une session</option>
                      {sessions.map(session => (
                        <option key={session.id} value={session.id}>
                          {session.nom}
                        </option>
                      ))}
                    </select>
                    {errors.session && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.session.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date d'évaluation */}
                  <div>
                    <label htmlFor="date_evaluation" className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'évaluation *
                    </label>
                    <Input
                      id="date_evaluation"
                      type="date"
                      className={cn(errors.date_evaluation && "border-red-500")}
                      {...register('date_evaluation')}
                    />
                    {errors.date_evaluation && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.date_evaluation.message}
                      </p>
                    )}
                  </div>

                  {/* Note sur */}
                  <div>
                    <label htmlFor="note_sur" className="block text-sm font-medium text-gray-700 mb-1">
                      Note sur *
                    </label>
                    <Input
                      id="note_sur"
                      type="number"
                      min="1"
                      max="100"
                      step="0.5"
                      placeholder="20"
                      className={cn(errors.note_sur && "border-red-500")}
                      {...register('note_sur', { valueAsNumber: true })}
                    />
                    {errors.note_sur && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.note_sur.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar avec résumé */}
          <div className="space-y-6">
            {/* Résumé de l'enseignement sélectionné */}
            {selectedEnseignement && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5" />
                    Enseignement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">EC</p>
                    <p className="font-semibold">{selectedEnseignement.ec_code}</p>
                    <p className="text-sm text-gray-600">{selectedEnseignement.ec_nom}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">UE</p>
                    <p className="text-sm">{selectedEnseignement.ue_nom}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Classe</p>
                    <p className="text-sm">{selectedEnseignement.classe_nom}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Aide et conseils */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="w-5 h-5" />
                  Conseils
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Date d'évaluation</p>
                    <p>Choisissez une date dans le futur ou récente pour la saisie des notes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Délai de saisie</p>
                    <p>Vous aurez 2 semaines par défaut pour saisir les notes après création.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Étudiants</p>
                    <p>Tous les étudiants inscrits à la classe seront automatiquement inclus.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || createMutation.isPending}
              >
                {isSubmitting || createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Créer l'évaluation
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  reset();
                  navigate('/evaluations');
                }}
                disabled={isSubmitting || createMutation.isPending}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateEvaluationPage;