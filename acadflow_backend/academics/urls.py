from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnneeAcademiqueViewSet, SessionViewSet, SemestreViewSet,
    ClasseViewSet, UEViewSet, ECViewSet, TypeEvaluationViewSet,
    ConfigurationEvaluationECViewSet
)

router = DefaultRouter()
router.register(r'annees-academiques', AnneeAcademiqueViewSet)
router.register(r'sessions', SessionViewSet)
router.register(r'semestres', SemestreViewSet)
router.register(r'classes', ClasseViewSet)
router.register(r'ues', UEViewSet)
router.register(r'ecs', ECViewSet)
router.register(r'types-evaluation', TypeEvaluationViewSet)
router.register(r'configurations-ec', ConfigurationEvaluationECViewSet)

urlpatterns = [
    path('', include(router.urls)),
]