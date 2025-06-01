from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DomaineViewSet, CycleViewSet, TypeFormationViewSet,
    FiliereViewSet, OptionViewSet, NiveauViewSet
)

router = DefaultRouter()
router.register(r'domaines', DomaineViewSet)
router.register(r'cycles', CycleViewSet)
router.register(r'types-formation', TypeFormationViewSet)
router.register(r'filieres', FiliereViewSet)
router.register(r'options', OptionViewSet)
router.register(r'niveaux', NiveauViewSet)

urlpatterns = [
    path('', include(router.urls)),
]