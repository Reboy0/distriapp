# Деплой (24/7 доступ)

Бекенд (FastAPI + PostgreSQL + WebSocket) — на **Railway**. Три веб-застосунки
(Next.js) — на **Vercel**. Обидва мають щедрий безкоштовний старт, деплояться
з GitHub автоматично на кожен push, і без проблем тримають WebSocket/Postgres
(на відміну від чисто serverless-платформ).

Репозиторій уже готовий до цього: `backend/docker-entrypoint.sh` сам прожене
`alembic upgrade head` і підхопить `$PORT`, який видасть платформа — нічого
руками на сервері робити не треба.

## 0. Передумова

Код має лежати на GitHub (Railway/Vercel деплояться саме звідти).

```bash
git remote add origin <URL вашого репозиторію на GitHub>
git push -u origin master
```

Якщо репозиторію на GitHub ще немає — створіть порожній на github.com і
виконайте команди, які він сам покаже після створення.

## 1. Бекенд + Postgres на Railway

1. Зареєструйтесь на [railway.app](https://railway.app) (можна через GitHub).
2. **New Project → Deploy from GitHub repo** → оберіть цей репозиторій.
3. Railway запропонує сервіс з кореня репо — видаліть його або одразу
   вкажіть **Root Directory: `backend`** в Settings цього сервісу (Dockerfile
   лежить саме там).
4. **New → Database → Add PostgreSQL** в тому ж проєкті — Railway сам створить
   інстанс і змінну `DATABASE_URL` буде видно в його вкладці Variables.
5. У сервісі бекенда (Variables) додайте:
   - `DATABASE_URL` — скопіюйте значення з доданого Postgres-сервісу, але
     **замініть префікс** `postgresql://` на `postgresql+asyncpg://`
     (SQLAlchemy-драйвер асинхронний, Railway дає звичайний `postgresql://`).
   - `JWT_SECRET` — будь-який довгий випадковий рядок (не той, що в
     `.env.example`).
   - Решта змінних з `backend/.env.example` — необов'язкові, є дефолти.
6. Deploy запуститься автоматично. У логах має з'явитись
   `Uvicorn running on http://0.0.0.0:$PORT` — це і є ознака успіху
   (`docker-entrypoint.sh` перед цим сам прогнав міграції).
7. Settings → **Networking → Generate Domain** — отримаєте публічний URL
   типу `https://distriapp-backend-production.up.railway.app`.
8. Перевірте: `curl https://<ваш-домен>/health` → `{"status":"ok"}`.

### Перший адмін

Немає self-service реєстрації адміна (навмисне рішення). Створіть його один
раз через Railway CLI:

```bash
npm i -g @railway/cli
railway login
railway link            # оберіть цей проєкт
railway run python -m scripts.seed_admin admin@example.com yourpassword
```

(Виконується у контексті бекенд-сервіса — команда запускається у щойно
задеплоєному контейнері з доступом до тієї ж БД.)

## 2. Три веб-застосунки на Vercel

Той самий GitHub-репозиторій → **три окремі проєкти** у Vercel (по одному на
застосунок), кожен з іншим **Root Directory**:

1. [vercel.com](https://vercel.com) → **Add New → Project** → оберіть
   репозиторій.
2. У кроці конфігурації:
   - **Root Directory**: `apps/client-web` (для решти двох — відповідно
     `apps/distributor-web` і `apps/admin-web`).
   - Framework Preset — Vercel сам визначить Next.js.
   - Environment Variables → додайте
     `NEXT_PUBLIC_API_BASE_URL` = `https://<ваш-railway-домен>/api/v1`
     (той самий бекенд для всіх трьох проєктів).
3. Deploy. Повторіть для двох інших застосунків (той самий репозиторій,
   інший Root Directory, та сама змінна оточення).

Кожен проєкт отримає свій URL: `*.vercel.app` (client-web),
`*.vercel.app` (distributor-web), `*.vercel.app` (admin-web).

## 3. Перевірка після деплою

```bash
curl https://<backend>.up.railway.app/health
```

Відкрийте кожен `*.vercel.app` URL у браузері, залогіньтесь тестовими
обліковими даними (`docs/TEST_CREDENTIALS.md` — або новими, які створите
через задеплоєний бекенд), перевірте що дані реально тягнуться з Railway
(Network tab у DevTools), і що чат/статуси замовлень оновлюються без
перезавантаження (WebSocket — підключення автоматично стане `wss://`,
бо URL бекенда тепер `https://`).

## Нюанси, про які варто знати

- **CORS** зараз `allow_origins=["*"]` (`backend/app/main.py`) — навмисно
  відкрито, щоб не зав'язуватись на ще не відомі домени Vercel. Як тільки
  URL-и застабілізуються (або підключите свій домен), варто звузити список
  origin'ів до конкретних `*.vercel.app`/власного домену.
- **WebSocket — single-process.** `ConnectionManager` (`app/ws/manager.py`)
  тримає з'єднання в пам'яті одного процесу. Railway за замовчуванням
  запускає один інстанс — це нормально для старту; якщо згодом
  масштабуватиметесь на кілька інстансів бекенда, знадобиться спільний
  брокер (Redis pub/sub), інакше клієнти, підключені до різних інстансів,
  не бачитимуть подій одне від одного.
- **Автопередача замовлень у 1С, синхронізація 3×/день** — досі лише ручна
  кнопка/сервісні функції, не крон-джоба. Не залежить від хостингу, це
  окрема задача (див. README, розділ "Наступні кроки").
- **Custom domain**: коли буде свій домен — Railway (Settings → Networking →
  Custom Domain) і Vercel (Settings → Domains) обидва приймають CNAME,
  налаштовується за 5 хвилин на кожному.
- **Безкоштовні тарифи мають ліміти** (Railway — обмежений стартовий кредит,
  сервіс може засинати без активності; Vercel free — без сну, але є ліміти
  на serverless-виконання). Для справжнього production-навантаження рано чи
  пізно доведеться перейти на платний план.
