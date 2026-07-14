# Backend (FastAPI)

P0 domain model + business logic for the B2B distributor↔store system. See
`../docs/CONTRACT.md` for the entity/API contract and `../docs/funktsionalni-vymohy-dlya-rozrobky.md`
for the full functional spec.

## Local setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then point DATABASE_URL at your local Postgres

# with docker-compose (from repo root): docker-compose up -d postgres
alembic revision --autogenerate -m "initial schema"
alembic upgrade head

uvicorn app.main:app --reload
```

API docs at `http://localhost:8000/docs` once running.

## Structure

- `app/models/` — SQLAlchemy models, one file per entity (`app/models/enums.py` for status enums)
- `app/schemas/` — Pydantic request/response models
- `app/services/` — business rules, framework-agnostic: `pricing.py` (manual price override,
  CAT-2), `stock_status.py` (availability thresholds, CAT-5), `blocking.py` (point-blocking rule,
  §4.3), `deferment.py`, `orders.py` (order lifecycle + 1C push), `payments_sync.py`, `catalog_sync.py`
- `app/integrations/onec/` — abstract `OneCConnector` interface + `StubOneCConnector` for dev/tests.
  Real per-distributor connectors are blocked on Q1-Q3 in the spec (1C config, entity mapping,
  "unpaid" document semantics) — build everything else against the interface only.
- `app/api/v1/` — routers, one per resource area
- `app/api/deps.py` — JWT auth context (`admin` / `distributor` / `client` roles), tenant scoping

## Notable design decisions

- Point blocking (§4.3) and the deferment "debtor" transition are **computed on read**
  (`services/blocking.get_block_reason`), not stored as a flag — a point's deferment date simply
  passing is enough to flip it, no cron job required.
- `Order.payment_status` starts at `none` and is only set to `unpaid`/`paid` by 1C sync or a manual
  distributor action (ORD-6). Once `payment_status_manual=True`, sync must never touch it again
  (ORD-10).
- `PointProductPrice` rows are the *only* source of manual pricing; absence of a row means "use
  `Product.base_price_with_vat`". The nightly catalog import (`catalog_sync.sync_catalog`) never
  writes to this table.

## Tests

```bash
pytest
```

Currently covers the pure business-rule functions (`stock_status`, deferment window logic) that
don't need a database. Service-level tests against real Postgres (blocking, pricing, order
creation/retry) are the natural next addition once the docker-compose Postgres is wired into CI.
