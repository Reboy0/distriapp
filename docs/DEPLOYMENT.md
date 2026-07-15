# Деплой (24/7 доступ)

## Варіант 1 — один VPS (рекомендовано: найпростіше і найшвидше)

Один сервер, одна команда `docker compose up -d --build` — і бекенд, Postgres
та всі 3 фронтенди піднімаються разом. Репозиторій уже повністю готовий:
`docker-compose.yml` описує всі 5 контейнерів, а фронтенди самі визначають
адресу бекенду за хостом, з яким їх відкрили (`window.location.hostname`,
порт 8000) — жодних env-змінних на кожен застосунок налаштовувати не треба.

Тредоф: без домену й HTTPS з коробки — доступ по `http://IP:порт`. Для
демо/бети це нормально; HTTPS+домен можна додати пізніше (Caddy/Nginx,
~10 хвилин), коли буде свій домен.

### Крок 1 — сервер

Будь-який VPS з Ubuntu 22.04+ (DigitalOcean, Hetzner, будь-хто інший).
Найдешевшого плану (1 vCPU / 1-2 GB RAM, ~$4-6/міс) вистачить для старту.
Запишіть публічну IP-адресу сервера.

### Крок 2 — підключення і Docker

```bash
ssh root@<IP_вашого_сервера>

curl -fsSL https://get.docker.com | sh          # ставить docker + compose plugin
apt install -y git
```

### Крок 3 — клонувати приватний репозиторій

Найпростіше — через `gh` (авторизація тим самим device-flow, що й у нас):

```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
  | tee /etc/apt/sources.list.d/github-cli.list
apt update && apt install -y gh

gh auth login          # відкриє код + URL для авторизації у браузері
gh repo clone Reboy0/distriapp
cd distriapp
```

### Крок 4 — налаштувати секрети

```bash
cp backend/.env.example backend/.env
nano backend/.env      # змініть хоча б JWT_SECRET на довгий випадковий рядок
```

### Крок 5 — підняти все

```bash
docker compose up -d --build
```

Перші 3-5 хвилин — збірка образів (кожен фронтенд білдиться окремо).
Перевірте:

```bash
docker compose ps               # усі 5 сервісів мають бути Up
curl localhost:8000/health      # {"status":"ok"}
```

### Крок 6 — фаєрвол

Відкрийте порти 3000, 3001, 3002, 8000 у фаєрволі провайдера (Security
Group / Cloud Firewall у панелі керування) або через `ufw`:

```bash
ufw allow 22,3000,3001,3002,8000/tcp
ufw enable
```

### Крок 7 — перший адмін

```bash
docker compose exec backend python -m scripts.seed_admin admin@example.com yourpassword
```

### Готово

- `http://<IP>:3000` — панель дистриб'ютора
- `http://<IP>:3001` — панель адміна
- `http://<IP>:3002` — кабінет клієнта
- `http://<IP>:8000/docs` — API/Swagger

### Оновлення після наступних push

```bash
cd distriapp && git pull && docker compose up -d --build
```

---

## Варіант 2 — Railway + Vercel (окремі керовані платформи)

Має сенс пізніше, коли потрібні: HTTPS з коробки без своєї конфігурації,
автодеплой на кожен push без SSH, або більше ресурсів/масштабування, ніж
дає один VPS.

### Бекенд + Postgres на Railway

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**.
2. Root Directory сервісу — `backend` (там лежить Dockerfile).
3. **New → Database → Add PostgreSQL** у тому ж проєкті.
4. У Variables бекенд-сервісу:
   - `DATABASE_URL` — значення з доданого Postgres, але з префіксом
     `postgresql+asyncpg://` замість `postgresql://`.
   - `JWT_SECRET` — довгий випадковий рядок.
5. Settings → **Networking → Generate Domain** → отримаєте
   `https://....up.railway.app`.
6. Перший адмін:
   ```bash
   npm i -g @railway/cli && railway login && railway link
   railway run python -m scripts.seed_admin admin@example.com yourpassword
   ```

### Три застосунки на Vercel

Той самий репозиторій → **три окремі проєкти**, різний **Root Directory**
(`apps/client-web`, `apps/distributor-web`, `apps/admin-web`). Якщо хочете
явно задати бекенд (замість авто-визначення за хостом): додайте
`NEXT_PUBLIC_API_BASE_URL=https://<railway-домен>/api/v1` в Environment
Variables кожного проєкту.

---

## Нюанси, спільні для обох варіантів

- **CORS** зараз `allow_origins=["*"]` (`backend/app/main.py`) — навмисно
  відкрито. Коли з'явиться постійний домен, варто звузити список origin'ів.
- **WebSocket — single-process.** `ConnectionManager` (`app/ws/manager.py`)
  тримає з'єднання в пам'яті одного процесу бекенда. Нормально для одного
  інстансу (і VPS, і Railway за замовчуванням саме так і працюють); якщо
  колись масштабуватиметесь на кілька інстансів — знадобиться спільний
  брокер (Redis pub/sub).
- **Автопередача замовлень у 1С, синхронізація 3×/день** — досі лише ручна
  кнопка/сервісні функції, не крон-джоба (див. README, "Наступні кроки").
- **Безкоштовні тарифи мають ліміти**, платні плани рано чи пізно знадобляться
  для реального навантаження — не стосується VPS, де ви платите фіксовано
  за сервер незалежно від трафіку.
