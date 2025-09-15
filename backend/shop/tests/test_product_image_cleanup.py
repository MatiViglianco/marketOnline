from unittest.mock import patch

from django.test import TestCase

from shop.models import Category, Product


class ProductImageCleanupTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Cat", slug="cat")

    @patch("cloudinary_storage.storage.MediaCloudinaryStorage.delete", autospec=True)
    def test_deleting_product_removes_cloudinary_image(self, mock_delete):
        product = Product.objects.create(
            category=self.category,
            name="Prod",
            price=10,
            image="products/test.jpg",
        )

        product.delete()

        mock_delete.assert_called_once()
        self.assertEqual(mock_delete.call_args[0][1], "products/test.jpg")

    @patch("cloudinary_storage.storage.MediaCloudinaryStorage.delete", autospec=True)
    def test_updating_product_image_replaces_old_file(self, mock_delete):
        product = Product.objects.create(
            category=self.category,
            name="Prod",
            price=10,
            image="products/old.jpg",
        )

        product.image = "products/new.jpg"
        product.save()

        mock_delete.assert_called_once()
        self.assertEqual(mock_delete.call_args[0][1], "products/old.jpg")
        self.assertEqual(product.image.name, "products/new.jpg")
