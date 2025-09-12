from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import PageNumberPagination
from django.db import models
from rest_framework.throttling import ScopedRateThrottle
from django.core.cache import cache

from .models import (
    Category,
    Product,
    SiteConfig,
    Order,
    Coupon,
    Announcement,
    SITE_CONFIG_CACHE_KEY,
    SITE_CONFIG_CACHE_TIMEOUT,
)
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    SiteConfigSerializer,
    OrderSerializer,
    AnnouncementSerializer,
)


class CategoryViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ProductPagination(PageNumberPagination):
    page_size = 12


class ProductViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Product.objects.filter(is_active=True).select_related('category')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'promoted']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'offer_price', 'created_at']
    pagination_class = ProductPagination


class SiteConfigViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    def list(self, request):
        data = cache.get(SITE_CONFIG_CACHE_KEY)
        if data is None:
            cfg = SiteConfig.objects.first()
            if cfg:
                data = SiteConfigSerializer(cfg).data
            else:
                data = {
                    'whatsapp_phone': '',
                    'alias_or_cbu': '',
                    'shipping_cost': '0.00',
                    'updated_at': None,
                }
            cache.set(SITE_CONFIG_CACHE_KEY, data, SITE_CONFIG_CACHE_TIMEOUT)
        return Response(data)


class OrderViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'orders'


class CouponValidateView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'coupon_validate'

    def post(self, request):
        code = request.data.get('code', '').strip()[:40]
        if not code:
            return Response({'detail': 'Código requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            c = Coupon.objects.get(code__iexact=code, active=True)
        except Coupon.DoesNotExist:
            return Response({'valid': False}, status=status.HTTP_200_OK)

        data = {
            'valid': True,
            'type': c.type,
            'amount': c.amount,
            'percent': c.percent,
            'percent_cap': c.percent_cap,
            'min_subtotal': c.min_subtotal,
        }
        return Response(data)


class AnnouncementViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = AnnouncementSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = []

    def get_queryset(self):
        from django.utils import timezone
        now = timezone.now()
        qs = Announcement.objects.filter(active=True)
        # Ventana de tiempo opcional: si start/end están definidos, respetarlos
        qs = qs.filter(models.Q(start_at__isnull=True) | models.Q(start_at__lte=now))
        qs = qs.filter(models.Q(end_at__isnull=True) | models.Q(end_at__gte=now))
        return qs
