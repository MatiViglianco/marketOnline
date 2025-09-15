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
        self.assertNotIn("used_count", data)

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

    def test_expired_coupon_invalid(self):
        expired = Coupon.objects.create(
            code="OLD10",
            type=Coupon.TYPE_FIXED,
            amount=Decimal("10.00"),
            percent=0,
            percent_cap=0,
            min_subtotal=Decimal("0"),
            active=True,
            expires_at=timezone.now() - timedelta(days=1),
        )
        r = self.client.post(
            "/api/coupons/validate/",
            {"code": expired.code},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {"valid": False})

    def test_usage_limit_coupon_invalid(self):
        limited = Coupon.objects.create(
            code="LIMITED",
            type=Coupon.TYPE_FIXED,
            amount=Decimal("10.00"),
            percent=0,
            percent_cap=0,
            min_subtotal=Decimal("0"),
            active=True,
            usage_limit=1,
            used_count=1,
        )
        r = self.client.post(
            "/api/coupons/validate/",
            {"code": limited.code},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {"valid": False})
