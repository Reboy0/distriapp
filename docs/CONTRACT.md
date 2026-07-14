# Контракт домену та API (для узгодженої розробки apps/*)

Джерело істини для бізнес-правил: `docs/funktsionalni-vymohy-dlya-rozrobky.md`. Цей файл — витяг у формі, зручній для фронтендів (веб-панелі, мобільний застосунок), що узгоджений зі схемою бекенду (`backend/app`).

Backend: FastAPI, base URL `http://localhost:8000/api/v1`. Auth: JWT Bearer, три типи токенів — `admin`, `distributor`, `client`, кожен несе `tenant_id` (=`distributor_id`) окрім admin.

## Сутності

- **Distributor** (тенант): `id, name, contacts, onec_config, is_active, created_at`
- **Invitation**: `id, distributor_id, code, status(active|used|expired), created_at, expires_at` (7 днів)
- **Client**: `id, distributor_id, name, phone, is_active, created_at`
- **PointOfSale**: `id, client_id, distributor_id, name, address, is_active, deferment_until(date|null), created_at`
- **Product**: `id, distributor_id, external_code, name, unit, base_price_with_vat, stock_qty, low_stock_threshold(int|null), is_new(bool)`
- **PointProductPrice** (ручна ціна на точку): `id, point_id, product_id, manual_price_with_vat, updated_at`
- **Order**: `id, point_id, client_id, distributor_id, status(created|pending_1c|sent_to_1c|cancelled), payment_status(none|unpaid|paid), payment_status_manual(bool), cancel_comment, onec_document_id, created_at, sent_at, cancelled_at`
- **OrderItem**: `id, order_id, product_id, qty, unit_price_with_vat, sum`
- **ChatThread**: `id, client_id, distributor_id`
- **ChatMessage**: `id, thread_id, sender_type(client|distributor), text, product_id(null), created_at`
- **SyncLog**: `id, distributor_id, type(catalog|payments|manual), status(success|error), started_at, finished_at, error_message`

## Ключові бізнес-правила (звідки походить UI-логіка)

- Ціни — **завжди з ПДВ**, ніде не показувати без ПДВ.
- `PointProductPrice`, якщо є — переважає над `Product.base_price_with_vat`; імпорт з 1С її не чіпає.
- Наявність: `qty=0` → «немає»; `0<qty<=threshold` → «закінчується»; `qty>threshold` → «є»; якщо `threshold=null` — тільки «є/немає». Точні залишки клієнту не показувати.
- Кошик → «Замовити» одразу створює Order і шле в 1С — **без екрана підтвердження**.
- Order при створенні НЕ отримує `payment_status` (=`none`). Стає `unpaid` лише після доставки: синхронізація 1С (3х/день: 9:00/15:00/20:00 Київ) або вручну дистриб'ютором.
- Ручна позначка `paid` (`payment_status_manual=true`) — фінальна, наступні синхронізації її не перезаписують.
- **Блокування точки**: точка недоступна для нового замовлення, якщо (∃ order з `payment_status=unpaid`) І (`deferment_until` не задано або вже минуло). Блокування діє лише на цю точку.
- Перехід точки в «боржника» після дати відстрочки відбувається о 00:00 наступного дня.
- Скасування замовлення дистриб'ютором — з коментарем; у 1С нічого автоматично не змінюється.
- 1С інтеграція — за абстрактним інтерфейсом (`OneCConnector`), реальної реалізації поки немає (Q1-Q3 не визначені), є `StubOneCConnector` для розробки.

## API-поверхня (орієнтовно, P0)

```
POST   /auth/admin/login
POST   /auth/distributor/login
POST   /auth/client/register           { invitation_code, name, phone, password }
POST   /auth/client/login

GET    /invitations                    (distributor)
POST   /invitations                    (distributor)

GET    /catalog                        (client; ціни/статуси наявності для точки point_id)
GET    /catalog/products               (distributor: повний список товарів)
PATCH  /catalog/products/{id}          (distributor: threshold, is_new)
GET    /catalog/point-prices           (distributor: усі ручні ціни по всіх точках)
PUT    /catalog/points/{point_id}/prices/{product_id}   (distributor: manual price)
DELETE /catalog/points/{point_id}/prices/{product_id}   (distributor: reset to base)

GET    /points                         (client: свої; distributor: усі точки всіх клієнтів — той самий шлях, різниться по ролі токена)
POST   /points                         (client: створити точку)
PATCH  /points/{id}/deferment          (distributor: set/clear)

GET    /clients                        (distributor: список своїх клієнтів)

POST   /orders                         (client: створити, точка+позиції)
GET    /orders                         (фільтр за точкою/статусом; той самий шлях для обох ролей)
GET    /orders/{id}                    (деталі одного замовлення)
GET    /orders/{id}/items              (позиції замовлення окремо)
POST   /orders/{id}/cancel             (distributor + comment)
PATCH  /orders/{id}/payment-status     (distributor: paid|unpaid)
PATCH  /orders/{id}/payment-link       (distributor: payment_url — не інтеграція, лише URL для показу клієнту)

GET    /chat/threads                   (distributor: список тредів по своїх клієнтах)
GET    /chat/threads/{client_id}/messages    (той самий шлях для client і distributor)
POST   /chat/threads/{client_id}/messages   (text, product_id?)

POST   /integrations/sync              (distributor: "Оновити дані з 1С")
GET    /integrations/sync-log

GET/POST/PATCH /admin/distributors

WS     /ws?token=<jwt>                 (client або distributor; push-events: chat_message, order_update — жива заміна для polling/ручного оновлення сторінки)
```

## Веб-панель дистриб'ютора (apps/distributor-web) — основні екрани

1. Дашборд/точки: список точок усіх клієнтів, боржники підсвічені червоним, фільтр за платіжним статусом.
2. Замовлення: список з фільтрами (точка, статус), картка замовлення (скасувати+коментар, змінити payment-status, подзвонити клієнту — `tel:`).
3. Каталог: список товарів, редагування порогу «закінчується», позначка «новинка», перегляд/скидання ручних цін по точках.
4. Запрошення: створення, список зі статусами.
5. Чат: список тредів по клієнтах, картка товару всередині чату для «коли буде?».
6. Синхронізація: кнопка «Оновити дані з 1С», журнал синхронізацій (P1, лишити місце в навігації).

## Веб-панель адміна (apps/admin-web) — основні екрани

1. Дистриб'ютори: список, створення/редагування/деактивація.
2. Моніторинг інтеграцій 1С по всіх дистриб'юторах (P1, каркас навігації).

## Клієнтський інтерфейс — основні екрани

Реалізовано у двох паралельних застосунках проти одного й того ж бекенду (клієнтські
ендпоінти API однакові для обох):

- **apps/mobile** (Expo/React Native, tab navigation) — оригінальний варіант з ТЗ. Каталог/Кошик/
  Точки/Замовлення/Чат — окремі вкладки (не оновлювався під зміни нижче, зроблені лише в client-web).
- **apps/client-web** (Next.js, мобільно-орієнтований сайт, нижня навігація: Точки/Замовлення/Чат)
  — додано пізніше за рішенням замовника (клієнтський інтерфейс теж сайт), потім перероблено за
  UX-фідбеком: каталог — окрема сторінка (не секція на дашборді точки), функціонал автозамовлень
  за розкладом реалізовано і потім повністю прибрано за рішенням замовника.

1. **Точки**: список точок клієнта, додавання нової (назва, адреса). У кожної точки — велика кнопка
   «Каталог» (одразу на сторінку каталогу цієї точки) і клік по самій точці → дашборд точки.
2. **Дашборд точки** (`/points/[id]`, client-web): інфо про точку (адреса, статус, причина
   блокування — ORD-7), кнопка «Перейти в каталог», останні 3 замовлення цієї точки (статус,
   оплата, посилання на оплату якщо є).
3. **Каталог точки** (`/points/[id]/catalog`, client-web) — окрема сторінка: товари з цінами (ПДВ)
   і статусом наявності, кнопка «коли буде?» → чат з карткою товару, кошик і кнопка «Замовити»
   без екрана підтвердження.
4. Замовлення: повна історія зі статусами життєвого циклу та оплати (по всіх точках).
5. Чат: тред з дистриб'ютором, живі повідомлення через WS.

Фіксовані панелі (шапка, нижня навігація, панель кошика) вирівняні під мобільні safe-area через
CSS-змінну `--nav-h` і `env(safe-area-inset-*)` (`globals.css`) — без захардкоджених пікселів,
щоб панелі не наїжджали на "чубчик"/індикатор жестів на iPhone та подібних пристроях.

Auth: реєстрація лише за запрошенням (код з посилання), без відкритої реєстрації. Мультисесія з кількох пристроїв дозволена — без device-limit логіки.
