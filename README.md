# strapi.kapustin.family

Personal Strapi v5 instance for Kapustin family projects, agents, health data, RPG data and life-log ingestion.

## Wedding guest privacy contract

`wedding-guest` использует только `POST /api/wedding-guests/lookup`. Generic
collection/findOne routes не зарегистрированы, поэтому API не перечисляет гостей.
Slug передаётся в body, а не URL/query, чтобы не попадать в access log.

Маршрут требует scope `api::wedding-guest.wedding-guest.lookup` и policy
`global::api-token-only`. Policy отклоняет Users & Permissions Public role даже
при ошибочной выдаче ему permission. Для frontend создаётся отдельный read-only
или custom API token только с указанным scope; full-access token не использовать.
Значение токена хранится только в server-side env frontend-приложения.

Публикация разрешена только после личного подтверждения гостем display name и
приписки. Подтверждение и персональные данные не публикуются в issue/PR. Для
отзыва выполните `Unpublish` или удаление записи. Lookup запрашивает только
`status: published`, без cache, поэтому unknown/revoked/storage-error имеют один
generic 404 без имени, slug и внутренней ошибки. Frontend также не имеет
именованного fallback и возвращает 404 при недоступной Strapi.

После revoke проверьте оба URL (`/<slug>` и `/i/<slug>`), общий OG preview,
`Cache-Control: private, no-store`, `X-Robots-Tag` и отсутствие ПДн в логах и
error payloads. Shared/static cache не используется; ошибочно настроенный внешний
CDN нужно purge. Regression test: `npm run test:wedding-guest-privacy`.

## Personal Event / Life-log Inbox

The `personal-event` collection type is the single inbox for Dmitrii's personal event pipeline:

- Ray-Ban Meta photos/videos
- Plaud audio recordings + transcripts
- Calendar events
- Manual notes/input
- Documents/files and other imports

REST endpoint after deploy:

```http
GET/POST /api/personal-events
```

Required fields for every record:

| Field | Type | Purpose |
|---|---|---|
| `occurredAt` | `datetime` | Real-world event timestamp |
| `eventType` | enum | `calendar`, `photo`, `video`, `audio`, `note`, `document`, `manual`, etc. |
| `source` | enum | `rayban_meta`, `plaud`, `calendar`, `manual`, `telegram`, `api`, etc. |
| `transcription` | text | Required textual transcript/OCR/caption/calendar text/manual note |

Pipeline fields: `status`, `summary`, `rawText`, `media`, `location`, `people`, `tags`, `entities`, `embeddingText`, `confidence`, `processedAt`, `metadata`, `externalId`.

## 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
