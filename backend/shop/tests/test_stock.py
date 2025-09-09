import threading
from unittest import skipIf

from django.db import close_old_connections, connection
from django.test import TransactionTestCase, TestCase
from rest_framework import serializers

from shop.models import Category, Product
from shop.serializers import OrderSerializer


@skipIf(connection.vendor == "sqlite", "SQLite locking prevents reliable concurrency tests")
class StockConcurrencyTest(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.category = Category.objects.create(name="Cat", slug="cat")
        self.product = Product.objects.create(
            category=self.category, name="Prod", price=10, stock=5
        )

    def _create_order(self, barrier, results, idx):
        close_old_connections()
        data = {
            "name": "John",
            "phone": "123",
            "address": "street",
            "payment_method": "cash",
            "delivery_method": "delivery",
            "items": [{"product_id": self.product.id, "quantity": 3}],
        }
        serializer = OrderSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        barrier.wait()
        try:
            serializer.save()
            results[idx] = "ok"
        except serializers.ValidationError:
            results[idx] = "fail"

    def test_concurrent_orders_do_not_oversell(self):
        barrier = threading.Barrier(2)
        results = [None, None]
        t1 = threading.Thread(target=self._create_order, args=(barrier, results, 0))
        t2 = threading.Thread(target=self._create_order, args=(barrier, results, 1))
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 2)
        self.assertEqual(results.count("ok"), 1)
        self.assertEqual(results.count("fail"), 1)


class RepeatedProductTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Cat", slug="cat")
        self.product = Product.objects.create(
            category=self.category, name="Prod", price=10, stock=5
        )

    def test_repeated_product_aggregates_quantity(self):
        data = {
            "name": "John",
            "phone": "123",
            "address": "street",
            "payment_method": "cash",
            "delivery_method": "delivery",
            "items": [
                {"product_id": self.product.id, "quantity": 2},
                {"product_id": self.product.id, "quantity": 3},
            ],
        }
        serializer = OrderSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 0)

    def test_repeated_product_rejected_when_insufficient_stock(self):
        data = {
            "name": "John",
            "phone": "123",
            "address": "street",
            "payment_method": "cash",
            "delivery_method": "delivery",
            "items": [
                {"product_id": self.product.id, "quantity": 2},
                {"product_id": self.product.id, "quantity": 4},
            ],
        }
        serializer = OrderSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        with self.assertRaises(serializers.ValidationError):
            serializer.save()
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)
