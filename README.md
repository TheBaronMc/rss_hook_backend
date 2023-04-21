# Rss Hook Backend

## Description

RssHook is made to bind rss flux to a webhook. This project use [Nest](https://github.com/nestjs/nest) framework and TypeScript.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test              # Run all tests
$ npx jest -t 'test name'   # Run a specific suite/test
```

## Data types

### Flux

```json
{
    "id":   0,  // int
    "url":  ""  // string
}
```

### Webhook

```json
{
    "id":   0,  // int
    "url":  ""  // string
}
```

### Hook

```json
{
  "destinationId":  0,  // Flux id - int
  "sourceId":       0   // Webhook id - int
}
```

### Article

```json
{
  "id":             0,  // Int
  "title":          "", // String
  "description":    "", // String
  "pub_date":       "", // Date
  "url":            "", // Optional - String
  "sourceId":       0,  // Int
}
```

### Delivery

```json
{
  "receiverId": 0, // Webhook id - Int
  "contentId":  0  // Article id - Int
}
```

## Entrypoints

### Flux

#### Insert a rss flux

**POST**: `/flux`

| Parameter | Description               |
| --------- | ------------------------- |
| `url`     | Url to fetch the rss flux |

#### Get all flux

**GET**: `/flux`

#### Delete a flux

**DELETE**: `/flux`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Flux id     |

#### Update a flux

**PATCH**: `/flux`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Flux id     |
| `url`     | New url     |

### Webhooks

#### Insert a webhook

**POST**: `/webhooks`

| Parameter | Description |
| --------- | ----------- |
| `url`     | Webhook url |

#### Get all webhook

**GET**: `/webhooks`

#### Delete a webhook

**DELETE**: `/webhooks`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Webhook id  |

#### Update a webhook

**PATCH**: `/webhooks`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Webhook id  |
| `url`     | New url     |

### Articles

#### Get all articles

**GET** `/articles`

#### Get only articles of a specific flux

**GET** `/articles/flux`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Flux id     |

> ⚠️ The parameter is given through the query string

### Hooks

#### Bind a webhook and a flux

**POST**: `/hooks`

| Parameter    | Description |
| ------------ | ----------- |
| `flux_id`    | Flux id     |
| `webhook_id` | Webhook id  |

#### Get all flux bind with a webhook

**GET**: `/hooks/webhook`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Webhook id  |

> ⚠️ The parameter is given through the query string

#### Get all webhooks bind with a flux

**GET**: `/hooks/flux`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Flux id     |

> ⚠️ The parameter is given through the query string

#### Delete an association

**DELETE**: `/hooks`

| Parameter    | Description |
| ------------ | ----------- |
| `flux_id`    | Flux id     |
| `webhook_id` | Webhook id  |

### Deliveries

#### All deliveries of an article

**GET**: `/deliveries/articles`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Article id  |

> ⚠️ The parameter is given through the query string

#### All deliveries to a webhook

**GET**: `/deliveries/webhooks`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Webhook id  |

> ⚠️ The parameter is given through the query string

## License

RssHookBackend is [MIT licensed](LICENSE).
