from decimal import Decimal

from django.test import TestCase

from shop.models import Coupon


class CouponValidateViewTest(TestCase):
    def setUp(self):
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
