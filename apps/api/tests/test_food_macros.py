from decimal import Decimal
import unittest

from app.modules.food.service.macros import MacroPer100g, compute_item_totals, compute_template_totals


class TestFoodMacros(unittest.TestCase):
    def test_compute_item_totals(self):
        per_100g = MacroPer100g(
            kcal=Decimal("200"),
            protein_g=Decimal("10"),
            carbs_g=Decimal("30"),
            fat_g=Decimal("5"),
        )
        totals = compute_item_totals(per_100g, quantity_g=Decimal("150"))

        self.assertEqual(totals.kcal, Decimal("300.00"))
        self.assertEqual(totals.protein_g, Decimal("15.00"))
        self.assertEqual(totals.carbs_g, Decimal("45.00"))
        self.assertEqual(totals.fat_g, Decimal("7.50"))

    def test_compute_template_totals(self):
        items = [
            (
                MacroPer100g(
                    kcal=Decimal("100"),
                    protein_g=Decimal("0"),
                    carbs_g=Decimal("25"),
                    fat_g=Decimal("0"),
                ),
                Decimal("200"),
            ),
            (
                MacroPer100g(
                    kcal=Decimal("250"),
                    protein_g=Decimal("20"),
                    carbs_g=Decimal("0"),
                    fat_g=Decimal("10"),
                ),
                Decimal("100"),
            ),
        ]
        totals = compute_template_totals(items)

        self.assertEqual(totals.kcal, Decimal("450.00"))
        self.assertEqual(totals.protein_g, Decimal("20.00"))
        self.assertEqual(totals.carbs_g, Decimal("50.00"))
        self.assertEqual(totals.fat_g, Decimal("10.00"))
