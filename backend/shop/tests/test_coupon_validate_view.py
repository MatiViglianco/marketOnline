from decimal import Decimal

from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from shop.models import Coupon


class CouponValidateViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("tester", password="pass")
        self.client.login(username="tester", password="pass")
        self.coupon = Coupon.objects.create(
            code="OFF10",
            type=Coupon.TYPE_FIXED,
            amount=Decimal("10.00"),
            percent=0,
            percent_cap=0,
            min_subtotal=Decimal("0"),
            active=True,
        )

    def test_response_does_not_expose_internal_fields(self):
        r = self.client.post(
            "/api/coupons/validate/",
            {"code": "OFF10"},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data.get("valid"))
        expected_keys = {"valid", "type", "amount", "percent", "percent_cap", "min_subtotal"}
        self.assertEqual(set(data.keys()), expected_keys)
        self.assertNotIn("active", data)
        self.assertNotIn("code", data)

    def test_invalid_coupon_response(self):
        r = self.client.post(
            "/api/coupons/validate/",
            {"code": "INVALID"},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {"valid": False})

    def test_requires_authentication(self):
        self.client.logout()
        r = self.client.post(
            "/api/coupons/validate/",
            {"code": "OFF10"},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 403)

    def test_invalid_when_expired(self):
        self.coupon.expires_at = timezone.now() - timedelta(days=1)
        self.coupon.save()
        r = self.client.post(
            "/api/coupons/validate/",
            {"code": "OFF10"},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {"valid": False})

    def test_invalid_when_usage_limit_reached(self):
        self.coupon.usage_limit = 1
        self.coupon.usage_count = 1
        self.coupon.save()
        r = self.client.post(
            "/api/coupons/validate/",
            {"code": "OFF10"},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {"valid": False})
