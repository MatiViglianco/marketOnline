from django.contrib import admin
from .models import Category, Product, SiteConfig, Order, OrderItem, Coupon, Announcement


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'offer_price', 'stock', 'is_active', 'promoted', 'promoted_until')
    list_filter = ('category', 'is_active', 'promoted')
    search_fields = ('name', 'description')


@admin.register(SiteConfig)
class SiteConfigAdmin(admin.ModelAdmin):
    list_display = ('whatsapp_phone', 'alias_or_cbu', 'shipping_cost', 'updated_at')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'phone', 'payment_method', 'total', 'created_at')
    readonly_fields = ('total', 'shipping_cost', 'created_at')
    inlines = [OrderItemInline]
    search_fields = ('name', 'phone')


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'type', 'amount', 'percent', 'percent_cap', 'min_subtotal', 'active')
    list_filter = ('type', 'active')
    search_fields = ('code',)


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'active', 'start_at', 'end_at', 'created_at')
    list_filter = ('active',)
    search_fields = ('title', 'message')
