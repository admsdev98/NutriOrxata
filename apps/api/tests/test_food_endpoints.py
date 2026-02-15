from __future__ import annotations

import uuid
import unittest
from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.bootstrap.api import create_app
from app.core.db.base import Base
from app.core.dependencies.auth import current_user, db_session
from app.modules.auth.domain.models import Tenant
from app.modules.auth.security.jwt_tokens import create_access_token
from app.modules.food.domain.models import DishTemplate, DishTemplateItem, Ingredient


class TestFoodEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.SessionLocal = sessionmaker(bind=cls.engine, expire_on_commit=False)
        Base.metadata.create_all(cls.engine)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(cls.engine)
        cls.engine.dispose()

    def setUp(self):
        self._clear_db()
        self.app = create_app()
        self.current_user_ctx = SimpleNamespace(
            id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            role="worker",
            is_active=True,
        )

        def override_current_user():
            return self.current_user_ctx

        def override_db_session():
            session = self.SessionLocal()
            try:
                yield session
            finally:
                session.close()

        self.app.dependency_overrides[current_user] = override_current_user
        self.app.dependency_overrides[db_session] = override_db_session
        self.client = TestClient(self.app)

    def tearDown(self):
        self.client.close()
        self.app.dependency_overrides.clear()

    def _clear_db(self):
        with self.SessionLocal() as session:
            session.execute(delete(DishTemplateItem))
            session.execute(delete(DishTemplate))
            session.execute(delete(Ingredient))
            session.execute(delete(Tenant))
            session.commit()

    def _set_current_tenant(self, tenant_id: uuid.UUID):
        self.current_user_ctx.tenant_id = tenant_id

    def _auth_headers(self, access_mode: str = "active") -> dict[str, str]:
        token = create_access_token(
            sub=str(uuid.uuid4()),
            tenant_id=str(self.current_user_ctx.tenant_id),
            role="worker",
            access_mode=access_mode,
        )
        return {"Authorization": f"Bearer {token.token}"}

    def _seed_two_tenants(self) -> dict[str, str | uuid.UUID]:
        tenant_a_id = uuid.uuid4()
        tenant_b_id = uuid.uuid4()

        ingredient_a_id = uuid.uuid4()
        ingredient_b_id = uuid.uuid4()

        dish_a_id = uuid.uuid4()
        dish_b_id = uuid.uuid4()

        now = datetime.now(timezone.utc)

        with self.SessionLocal() as session:
            session.add_all(
                [
                    Tenant(id=tenant_a_id, created_at=now, status="active", subscription_status="trial"),
                    Tenant(id=tenant_b_id, created_at=now, status="active", subscription_status="trial"),
                ]
            )
            session.add_all(
                [
                    Ingredient(
                        id=ingredient_a_id,
                        tenant_id=tenant_a_id,
                        name="A Ingredient",
                        kcal_per_100g=Decimal("100"),
                        protein_g_per_100g=Decimal("10"),
                        carbs_g_per_100g=Decimal("5"),
                        fat_g_per_100g=Decimal("1"),
                        serving_size_g=None,
                        created_at=now,
                        updated_at=None,
                    ),
                    Ingredient(
                        id=ingredient_b_id,
                        tenant_id=tenant_b_id,
                        name="B Ingredient",
                        kcal_per_100g=Decimal("200"),
                        protein_g_per_100g=Decimal("20"),
                        carbs_g_per_100g=Decimal("10"),
                        fat_g_per_100g=Decimal("2"),
                        serving_size_g=None,
                        created_at=now,
                        updated_at=None,
                    ),
                ]
            )
            session.add_all(
                [
                    DishTemplate(
                        id=dish_a_id,
                        tenant_id=tenant_a_id,
                        name="A Dish",
                        created_at=now,
                        updated_at=None,
                    ),
                    DishTemplate(
                        id=dish_b_id,
                        tenant_id=tenant_b_id,
                        name="B Dish",
                        created_at=now,
                        updated_at=None,
                    ),
                ]
            )
            session.add_all(
                [
                    DishTemplateItem(
                        id=uuid.uuid4(),
                        tenant_id=tenant_a_id,
                        dish_template_id=dish_a_id,
                        ingredient_id=ingredient_a_id,
                        quantity_g=Decimal("100"),
                        created_at=now,
                    ),
                    DishTemplateItem(
                        id=uuid.uuid4(),
                        tenant_id=tenant_b_id,
                        dish_template_id=dish_b_id,
                        ingredient_id=ingredient_b_id,
                        quantity_g=Decimal("100"),
                        created_at=now,
                    ),
                ]
            )
            session.commit()

        return {
            "tenant_a_id": tenant_a_id,
            "tenant_b_id": tenant_b_id,
            "ingredient_a_id": str(ingredient_a_id),
            "ingredient_b_id": str(ingredient_b_id),
            "dish_a_id": str(dish_a_id),
            "dish_b_id": str(dish_b_id),
        }

    def test_tenant_isolation_for_food_read_endpoints(self):
        seeded = self._seed_two_tenants()
        self._set_current_tenant(seeded["tenant_a_id"])

        ingredients_res = self.client.get("/api/food/ingredients")
        self.assertEqual(ingredients_res.status_code, 200)
        self.assertEqual([row["id"] for row in ingredients_res.json()], [seeded["ingredient_a_id"]])

        ingredient_foreign_res = self.client.get(f"/api/food/ingredients/{seeded['ingredient_b_id']}")
        self.assertEqual(ingredient_foreign_res.status_code, 404)
        self.assertEqual(ingredient_foreign_res.json(), {"detail": "ingredient_not_found"})

        used_by_foreign_res = self.client.get(f"/api/food/ingredients/{seeded['ingredient_b_id']}/used-by")
        self.assertEqual(used_by_foreign_res.status_code, 404)
        self.assertEqual(used_by_foreign_res.json(), {"detail": "ingredient_not_found"})

        templates_res = self.client.get("/api/food/dish-templates")
        self.assertEqual(templates_res.status_code, 200)
        self.assertEqual([row["id"] for row in templates_res.json()], [seeded["dish_a_id"]])

        dish_foreign_res = self.client.get(f"/api/food/dish-templates/{seeded['dish_b_id']}")
        self.assertEqual(dish_foreign_res.status_code, 404)
        self.assertEqual(dish_foreign_res.json(), {"detail": "dish_template_not_found"})

    def test_tenant_isolation_for_food_mutation_endpoints(self):
        seeded = self._seed_two_tenants()
        self._set_current_tenant(seeded["tenant_a_id"])
        headers = self._auth_headers("active")

        ingredient_payload = {
            "name": "Updated name",
            "kcal_per_100g": 123,
            "protein_g_per_100g": 12,
            "carbs_g_per_100g": 11,
            "fat_g_per_100g": 10,
            "serving_size_g": 50,
        }
        ingredient_put_res = self.client.put(
            f"/api/food/ingredients/{seeded['ingredient_b_id']}",
            json=ingredient_payload,
            headers=headers,
        )
        self.assertEqual(ingredient_put_res.status_code, 404)
        self.assertEqual(ingredient_put_res.json(), {"detail": "ingredient_not_found"})

        ingredient_delete_res = self.client.delete(f"/api/food/ingredients/{seeded['ingredient_b_id']}", headers=headers)
        self.assertEqual(ingredient_delete_res.status_code, 404)
        self.assertEqual(ingredient_delete_res.json(), {"detail": "ingredient_not_found"})

        dish_payload = {
            "name": "Updated dish",
            "items": [
                {
                    "ingredient_id": seeded["ingredient_a_id"],
                    "quantity_g": 150,
                }
            ],
        }
        dish_put_res = self.client.put(
            f"/api/food/dish-templates/{seeded['dish_b_id']}",
            json=dish_payload,
            headers=headers,
        )
        self.assertEqual(dish_put_res.status_code, 404)
        self.assertEqual(dish_put_res.json(), {"detail": "dish_template_not_found"})

        dish_delete_res = self.client.delete(f"/api/food/dish-templates/{seeded['dish_b_id']}", headers=headers)
        self.assertEqual(dish_delete_res.status_code, 404)
        self.assertEqual(dish_delete_res.json(), {"detail": "dish_template_not_found"})

    def test_read_only_access_blocks_all_food_mutations(self):
        seeded = self._seed_two_tenants()
        self._set_current_tenant(seeded["tenant_a_id"])
        headers = self._auth_headers("read_only")

        ingredient_payload = {
            "name": "New ingredient",
            "kcal_per_100g": 150,
            "protein_g_per_100g": 20,
            "carbs_g_per_100g": 5,
            "fat_g_per_100g": 3,
            "serving_size_g": None,
        }
        ingredient_create_res = self.client.post("/api/food/ingredients", json=ingredient_payload, headers=headers)
        self.assertEqual(ingredient_create_res.status_code, 403)
        self.assertEqual(ingredient_create_res.json(), {"detail": "read_only"})

        ingredient_update_res = self.client.put(
            f"/api/food/ingredients/{seeded['ingredient_a_id']}",
            json=ingredient_payload,
            headers=headers,
        )
        self.assertEqual(ingredient_update_res.status_code, 403)
        self.assertEqual(ingredient_update_res.json(), {"detail": "read_only"})

        ingredient_delete_res = self.client.delete(f"/api/food/ingredients/{seeded['ingredient_a_id']}", headers=headers)
        self.assertEqual(ingredient_delete_res.status_code, 403)
        self.assertEqual(ingredient_delete_res.json(), {"detail": "read_only"})

        dish_payload = {
            "name": "New dish",
            "items": [
                {
                    "ingredient_id": seeded["ingredient_a_id"],
                    "quantity_g": 120,
                }
            ],
        }
        dish_create_res = self.client.post("/api/food/dish-templates", json=dish_payload, headers=headers)
        self.assertEqual(dish_create_res.status_code, 403)
        self.assertEqual(dish_create_res.json(), {"detail": "read_only"})

        dish_update_res = self.client.put(
            f"/api/food/dish-templates/{seeded['dish_a_id']}",
            json=dish_payload,
            headers=headers,
        )
        self.assertEqual(dish_update_res.status_code, 403)
        self.assertEqual(dish_update_res.json(), {"detail": "read_only"})

        dish_delete_res = self.client.delete(f"/api/food/dish-templates/{seeded['dish_a_id']}", headers=headers)
        self.assertEqual(dish_delete_res.status_code, 403)
        self.assertEqual(dish_delete_res.json(), {"detail": "read_only"})
