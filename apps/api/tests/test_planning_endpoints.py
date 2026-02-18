from __future__ import annotations

import uuid
import unittest
from datetime import datetime, timezone
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
from app.modules.planning.domain.models import (
    WeekPlanInstance,
    WeekPlanInstanceItem,
    WeekPlanTemplate,
    WeekPlanTemplateItem,
)


class TestPlanningEndpoints(unittest.TestCase):
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
            session.execute(delete(WeekPlanInstanceItem))
            session.execute(delete(WeekPlanInstance))
            session.execute(delete(WeekPlanTemplateItem))
            session.execute(delete(WeekPlanTemplate))
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

    def _seed_two_tenants_with_dishes(self) -> dict[str, str | uuid.UUID]:
        tenant_a_id = uuid.uuid4()
        tenant_b_id = uuid.uuid4()

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
                    DishTemplate(id=dish_a_id, tenant_id=tenant_a_id, name="Dish A", created_at=now, updated_at=None),
                    DishTemplate(id=dish_b_id, tenant_id=tenant_b_id, name="Dish B", created_at=now, updated_at=None),
                ]
            )
            session.commit()

        return {
            "tenant_a_id": tenant_a_id,
            "tenant_b_id": tenant_b_id,
            "dish_a_id": str(dish_a_id),
            "dish_b_id": str(dish_b_id),
        }

    def _create_template(self, dish_id: str, name: str = "Base template") -> str:
        res = self.client.post(
            "/api/planning/week-plan-templates",
            headers=self._auth_headers("active"),
            json={
                "name": name,
                "items": [
                    {
                        "day_key": "mon",
                        "slot_key": "breakfast",
                        "dish_template_id": dish_id,
                        "notes": "Original notes",
                    }
                ],
            },
        )
        self.assertEqual(res.status_code, 200)
        return res.json()["id"]

    def test_tenant_isolation_for_planning_read_and_create_instance(self):
        seeded = self._seed_two_tenants_with_dishes()

        self._set_current_tenant(seeded["tenant_a_id"])
        template_a_id = self._create_template(seeded["dish_a_id"], "Tenant A template")

        self._set_current_tenant(seeded["tenant_b_id"])
        template_b_id = self._create_template(seeded["dish_b_id"], "Tenant B template")

        self._set_current_tenant(seeded["tenant_a_id"])
        list_res = self.client.get("/api/planning/week-plan-templates")
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual([row["id"] for row in list_res.json()], [template_a_id])

        get_foreign_template = self.client.get(f"/api/planning/week-plan-templates/{template_b_id}")
        self.assertEqual(get_foreign_template.status_code, 404)
        self.assertEqual(get_foreign_template.json(), {"detail": "week_plan_template_not_found"})

        create_foreign_instance = self.client.post(
            "/api/planning/week-plan-instances/from-template",
            headers=self._auth_headers("active"),
            json={
                "template_id": template_b_id,
                "client_ref": "c-001",
                "week_start_date": "2026-02-16",
            },
        )
        self.assertEqual(create_foreign_instance.status_code, 404)
        self.assertEqual(create_foreign_instance.json(), {"detail": "week_plan_template_not_found"})

        create_own_instance = self.client.post(
            "/api/planning/week-plan-instances/from-template",
            headers=self._auth_headers("active"),
            json={
                "template_id": template_a_id,
                "client_ref": "c-001",
                "week_start_date": "2026-02-16",
            },
        )
        self.assertEqual(create_own_instance.status_code, 200)

        own_instance_res = self.client.get(
            "/api/planning/week-plan-instances/by-client-week",
            params={"client_ref": "c-001", "week_start_date": "2026-02-16"},
        )
        self.assertEqual(own_instance_res.status_code, 200)

        self._set_current_tenant(seeded["tenant_b_id"])
        foreign_lookup_res = self.client.get(
            "/api/planning/week-plan-instances/by-client-week",
            params={"client_ref": "c-001", "week_start_date": "2026-02-16"},
        )
        self.assertEqual(foreign_lookup_res.status_code, 404)
        self.assertEqual(foreign_lookup_res.json(), {"detail": "week_plan_instance_not_found"})

    def test_read_only_access_blocks_all_planning_mutations(self):
        seeded = self._seed_two_tenants_with_dishes()
        self._set_current_tenant(seeded["tenant_a_id"])
        template_id = self._create_template(seeded["dish_a_id"])

        create_template_res = self.client.post(
            "/api/planning/week-plan-templates",
            headers=self._auth_headers("read_only"),
            json={
                "name": "Read only template",
                "items": [
                    {
                        "day_key": "mon",
                        "slot_key": "lunch",
                        "dish_template_id": seeded["dish_a_id"],
                        "notes": None,
                    }
                ],
            },
        )
        self.assertEqual(create_template_res.status_code, 403)
        self.assertEqual(create_template_res.json(), {"detail": "read_only"})

        update_template_res = self.client.put(
            f"/api/planning/week-plan-templates/{template_id}",
            headers=self._auth_headers("read_only"),
            json={
                "name": "Updated",
                "items": [
                    {
                        "day_key": "mon",
                        "slot_key": "breakfast",
                        "dish_template_id": seeded["dish_a_id"],
                        "notes": "Updated",
                    }
                ],
            },
        )
        self.assertEqual(update_template_res.status_code, 403)
        self.assertEqual(update_template_res.json(), {"detail": "read_only"})

        delete_template_res = self.client.delete(
            f"/api/planning/week-plan-templates/{template_id}",
            headers=self._auth_headers("read_only"),
        )
        self.assertEqual(delete_template_res.status_code, 403)
        self.assertEqual(delete_template_res.json(), {"detail": "read_only"})

        create_instance_res = self.client.post(
            "/api/planning/week-plan-instances/from-template",
            headers=self._auth_headers("read_only"),
            json={
                "template_id": template_id,
                "client_ref": "c-001",
                "week_start_date": "2026-02-16",
            },
        )
        self.assertEqual(create_instance_res.status_code, 403)
        self.assertEqual(create_instance_res.json(), {"detail": "read_only"})

        instance_create_active = self.client.post(
            "/api/planning/week-plan-instances/from-template",
            headers=self._auth_headers("active"),
            json={
                "template_id": template_id,
                "client_ref": "c-001",
                "week_start_date": "2026-02-16",
            },
        )
        self.assertEqual(instance_create_active.status_code, 200)
        instance_id = instance_create_active.json()["id"]

        update_instance_res = self.client.put(
            f"/api/planning/week-plan-instances/{instance_id}",
            headers=self._auth_headers("read_only"),
            json={
                "items": [
                    {
                        "day_key": "mon",
                        "slot_key": "breakfast",
                        "dish_template_id": seeded["dish_a_id"],
                        "dish_name": None,
                        "notes": "Blocked",
                    }
                ]
            },
        )
        self.assertEqual(update_instance_res.status_code, 403)
        self.assertEqual(update_instance_res.json(), {"detail": "read_only"})

    def test_instance_edits_do_not_mutate_template(self):
        seeded = self._seed_two_tenants_with_dishes()
        self._set_current_tenant(seeded["tenant_a_id"])

        now = datetime.now(timezone.utc)
        second_dish_id = uuid.uuid4()
        with self.SessionLocal() as session:
            session.add(
                DishTemplate(id=second_dish_id, tenant_id=seeded["tenant_a_id"], name="Dish A2", created_at=now, updated_at=None)
            )
            session.commit()

        template_id = self._create_template(seeded["dish_a_id"], "Snapshot template")

        create_instance_res = self.client.post(
            "/api/planning/week-plan-instances/from-template",
            headers=self._auth_headers("active"),
            json={
                "template_id": template_id,
                "client_ref": "c-002",
                "week_start_date": "2026-02-23",
            },
        )
        self.assertEqual(create_instance_res.status_code, 200)
        instance_id = create_instance_res.json()["id"]

        update_instance_res = self.client.put(
            f"/api/planning/week-plan-instances/{instance_id}",
            headers=self._auth_headers("active"),
            json={
                "items": [
                    {
                        "day_key": "mon",
                        "slot_key": "breakfast",
                        "dish_template_id": str(second_dish_id),
                        "dish_name": None,
                        "notes": "Instance change",
                    }
                ]
            },
        )
        self.assertEqual(update_instance_res.status_code, 200)
        self.assertEqual(update_instance_res.json()["items"][0]["dish_name"], "Dish A2")
        self.assertEqual(update_instance_res.json()["items"][0]["notes"], "Instance change")

        template_after_res = self.client.get(f"/api/planning/week-plan-templates/{template_id}")
        self.assertEqual(template_after_res.status_code, 200)
        self.assertEqual(template_after_res.json()["items"][0]["dish_template_id"], seeded["dish_a_id"])
        self.assertEqual(template_after_res.json()["items"][0]["dish_template_name"], "Dish A")
        self.assertEqual(template_after_res.json()["items"][0]["notes"], "Original notes")

    def test_dish_suggestions_are_tenant_scoped_and_slot_aware(self):
        seeded = self._seed_two_tenants_with_dishes()
        self._set_current_tenant(seeded["tenant_a_id"])

        breakfast_dish_id = uuid.UUID(seeded["dish_a_id"])
        dinner_dish_id = uuid.uuid4()
        now = datetime.now(timezone.utc)

        with self.SessionLocal() as session:
            session.add(
                DishTemplate(
                    id=dinner_dish_id,
                    tenant_id=seeded["tenant_a_id"],
                    name="Dinner Bowl",
                    created_at=now,
                    updated_at=None,
                )
            )
            session.commit()

        create_template_res = self.client.post(
            "/api/planning/week-plan-templates",
            headers=self._auth_headers("active"),
            json={
                "name": "Suggestion seed",
                "items": [
                    {
                        "day_key": "mon",
                        "slot_key": "breakfast",
                        "dish_template_id": str(breakfast_dish_id),
                        "notes": None,
                    },
                    {
                        "day_key": "tue",
                        "slot_key": "dinner",
                        "dish_template_id": str(dinner_dish_id),
                        "notes": None,
                    },
                ],
            },
        )
        self.assertEqual(create_template_res.status_code, 200)

        suggestions_res = self.client.get(
            "/api/planning/dish-suggestions",
            params={"slot_key": "breakfast"},
        )
        self.assertEqual(suggestions_res.status_code, 200)

        payload = suggestions_res.json()
        returned_ids = [row["id"] for row in payload]

        self.assertIn(str(breakfast_dish_id), returned_ids)
        self.assertNotIn(seeded["dish_b_id"], returned_ids)
        self.assertEqual(payload[0]["id"], str(breakfast_dish_id))
        self.assertEqual(payload[0]["meal_type"], "breakfast")


if __name__ == "__main__":
    unittest.main()
