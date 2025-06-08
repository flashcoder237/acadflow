from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EnseignementViewSet, EvaluationViewSet, NoteViewSet,
    MoyenneECViewSet, MoyenneUEViewSet, MoyenneSemestreViewSet,EnseignantEtudiantsViewSet
)

router = DefaultRouter()
router.register(r'enseignements', EnseignementViewSet)
router.register(r'evaluations', EvaluationViewSet)
router.register(r'notes', NoteViewSet)
router.register(r'moyennes-ec', MoyenneECViewSet)
router.register(r'moyennes-ue', MoyenneUEViewSet)
router.register(r'moyennes-semestre', MoyenneSemestreViewSet)
router.register(r'enseignants/etudiants', EnseignantEtudiantsViewSet, basename='enseignant-etudiants')


urlpatterns = [
    path('', include(router.urls)),
]