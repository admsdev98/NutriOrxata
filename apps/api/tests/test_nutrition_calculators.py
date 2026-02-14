import unittest
from datetime import date

from app.modules.nutrition.service.calculators import NutritionInputs, age_years_from_birth_date, calculate_targets


class TestNutritionCalculators(unittest.TestCase):
    def test_age_years_from_birth_date(self) -> None:
        self.assertEqual(age_years_from_birth_date(birth_date=date(2000, 2, 14), as_of=date(2026, 2, 14)), 26)
        self.assertEqual(age_years_from_birth_date(birth_date=date(2000, 2, 15), as_of=date(2026, 2, 14)), 25)

    def test_calculate_targets_basic(self) -> None:
        targets = calculate_targets(
            NutritionInputs(
                sex="male",
                age_years=30,
                height_cm=180,
                weight_kg=80.0,
                activity_level="moderate",
                goal="maintain",
            )
        )
        self.assertGreater(targets.daily_kcal, 0)
        self.assertGreater(targets.daily_protein_g, 0)
        self.assertGreaterEqual(targets.daily_carbs_g, 0)
        self.assertGreater(targets.daily_fat_g, 0)
        self.assertEqual(targets.weekly_kcal, targets.daily_kcal * 7)
        self.assertEqual(targets.weekly_protein_g, targets.daily_protein_g * 7)

    def test_calculate_targets_override_kcal(self) -> None:
        targets = calculate_targets(
            NutritionInputs(
                sex="female",
                age_years=25,
                height_cm=165,
                weight_kg=60.0,
                activity_level="light",
                goal="cut",
                override_kcal=1500,
            )
        )
        self.assertEqual(targets.daily_kcal, 1500)
        self.assertEqual(targets.weekly_kcal, 10500)

    def test_calculate_targets_override_macros_adjusts_remainder(self) -> None:
        targets = calculate_targets(
            NutritionInputs(
                sex="male",
                age_years=35,
                height_cm=175,
                weight_kg=90.0,
                activity_level="moderate",
                goal="maintain",
                override_kcal=2000,
                override_protein_g=200,
                override_carbs_g=None,
                override_fat_g=50,
            )
        )
        self.assertEqual(targets.daily_kcal, 2000)
        self.assertEqual(targets.daily_protein_g, 200)
        self.assertEqual(targets.daily_fat_g, 50)
        self.assertGreaterEqual(targets.daily_carbs_g, 0)


if __name__ == "__main__":
    unittest.main()
