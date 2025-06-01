from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, EnseignantViewSet, EtudiantViewSet,
    StatutEtudiantViewSet, InscriptionViewSet, HistoriqueStatutViewSet,
    login_view, logout_view
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'enseignants', EnseignantViewSet)
router.register(r'etudiants', EtudiantViewSet)
router.register(r'statuts-etudiant', StatutEtudiantViewSet)
router.register(r'inscriptions', InscriptionViewSet)
router.register(r'historique-statuts', HistoriqueStatutViewSet)

urlpatterns = [
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('', include(router.urls)),
]