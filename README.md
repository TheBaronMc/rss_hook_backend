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

### Exceptions

```json
{
  "statusCode": 0,  // Error code
  "message":    ""  // Error message
}
```

### Article

```json
{
  "id":             0,  // Int
  "title":          "", // String
  "description":    "", // String
  "pub_date":       "", // Date Ex: 2023-04-23T18:47:42.531Z
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

Example:
```json
{
  "url": "http://flux.url"
}
```

**Response:**
Return the created flux
```json
{
  "id":   0,  // id of the flux
  "url":  ""  // url of the rss flux
}
```

**Exceptions:**

+ `A url is required`: Status Code 403, the URL is missing from the parameters.
+ `Wrong url`: Status Code 403, you gave a bad URL.
+ `Invalid flux`: Status Code 403, you didn't gave a URL of an RSS Feed.

#### Get all flux

**GET**: `/flux`

**Reponse:** 
List of flux
```json
[
    { "id":   1, "url":  "http://url.example.com"  },
    ...
    { "id":   n, "url":  "http://url.example.com"  }
]
```

#### Delete a flux

**DELETE**: `/flux`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Flux id     |

**Response:**
Return the deleted flux
```json
{
  "id":   0,  // id of the flux
  "url":  ""  // url of the rss flux
}
```

**Exceptions:**

+ `An id is required`: Status Code 403, you didn't provide an id.
+ `Flux id has to be a number`: Status Code 403
+ `This id doesn\'t exist`: Status Code 403, no flux associated with this id.

#### Update a flux

**PATCH**: `/flux`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Flux id     |
| `url`     | New url     |

**Response:**
Return the updated flux
```json
{
  "id":   0,  // id of the flux
  "url":  ""  // url of the rss flux
}
```

**Exceptions:**

+ `Missing id`: Status Code 403, you didn't provide an id.
+ `Missing url`: Status Code 403, you didn't provide an new url.
+ `Wrong id`: Status Code 403, no flux associated with this id.
+ `Wrong url`: Status Code 403, wrong url format.


### Webhooks

#### Insert a webhook

**POST**: `/webhooks`

| Parameter | Description |
| --------- | ----------- |
| `url`     | Webhook url |

**Response:**
Return the created webhook
```json
{
  "id":   0,  // id of the webhook
  "url":  ""  // url of the webhook
}
```

**Exceptions:**

+ `A url is required`: Status Code 403, the URL is missing from the parameters.
+ `Wrong url`: Status Code 403, you gave a bad URL.

#### Get all webhook

**GET**: `/webhooks`

**Reponse:** 
List of webhooks
```json
[
    { "id":   1, "url":  "http://url.example.com"  },
    ...
    { "id":   n, "url":  "http://url.example.com"  }
]
```

#### Delete a webhook

**DELETE**: `/webhooks`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Webhook id  |

**Response:**
Return the deleted webhook
```json
{
  "id":   0,  // id of the webhook
  "url":  ""  // url of the webhook
}
```

**Exceptions:**

+ `An id is required`: Status Code 403, you didn't provide an id.
+ `This id doesn\'t exist`: Status Code 403, no webhook associated with this id.

#### Update a webhook

**PATCH**: `/webhooks`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Webhook id  |
| `url`     | New url     |

**Response:**
Return the updated webhook
```json
{
  "id":   0,  // id of the webhook
  "url":  ""  // url of the webhook
}
```

**Exceptions:**

+ `Missing id`: Status Code 403, you didn't provide an id.
+ `Missing url`: Status Code 403, you didn't provide an new url.
+ `Wrong id`: Status Code 403, no webhook associated with this id.
+ `Wrong url`: Status Code 403, wrong url format.

### Articles

#### Get all articles

**GET** `/articles`

**Reponse:** 
List of articles
```json
[
    { "id":   1, "sourceId": x },
    ...
    { "id":   n, "sourceId": y  }
]
```

#### Get only articles of a specific flux

**GET** `/articles/flux`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Flux id     |

> ⚠️ The parameter is given through the query string

**Reponse:** 
List of articles
```json
[
    { "id":   1, "sourceId": x },
    ...
    { "id":   n, "sourceId": x  }
]
```

**Exceptions:**

+ `An flux id is required`: Status Code 403, you didn't provide an id.
+ `A Flux id must a number`: Status Code 403

### Hooks

#### Bind a webhook and a flux

**POST**: `/hooks`

| Parameter    | Description |
| ------------ | ----------- |
| `flux_id`    | Flux id     |
| `webhook_id` | Webhook id  |

**Reponse:** 
Return if the hook has been created or not
```json
true  // Created
false // Not created - already exist
```

**Exceptions:**

+ `A flux id is required`: Status Code 403
+ `A webhook is required`: Status Code 403
+ `This flux id doesn't exist`: Status Code 403
+ `This webhook id doesn't exist`: Status Code 403

#### Get all flux bind with a webhook

**GET**: `/hooks/webhook`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Webhook id  |

> ⚠️ The parameter is given through the query string

**Reponse:** 
List of flux
```json
[
    { "id":   1, "url":  "http://url.example.com"  },
    ...
    { "id":   n, "url":  "http://url.example.com"  }
]
```

**Exceptions:**

+ `A webhook id is required`: Status Code 403
+ `This webhook id doesn't exist`: Status Code 403

#### Get all webhooks bind with a flux

**GET**: `/hooks/flux`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Flux id     |

> ⚠️ The parameter is given through the query string

**Reponse:** 
List of webhooks
```json
[
    { "id":   1, "url":  "http://url.example.com"  },
    ...
    { "id":   n, "url":  "http://url.example.com"  }
]
```

**Exceptions:**

+ `A flux id is required`: Status Code 403
+ `This flux id doesn't exist`: Status Code 403

#### Delete an association

**DELETE**: `/hooks`

| Parameter    | Description |
| ------------ | ----------- |
| `flux_id`    | Flux id     |
| `webhook_id` | Webhook id  |

**Reponse:** 
Return if the hook has been deleted or not
```json
true  // Deleted
false // Not deleted - does not exist
```

**Exceptions:**

+ `A flux id is required`: Status Code 403
+ `A webhook is required`: Status Code 403
+ `This flux id doesn't exist`: Status Code 403
+ `This webhook id doesn't exist`: Status Code 403

### Deliveries

#### All deliveries of an article

**GET**: `/deliveries/articles`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Article id  |

> ⚠️ The parameter is given through the query string

**Reponse:** 
List of webhooks
```json
[
    { "id":   1, "url":  "http://url.example.com"  },
    ...
    { "id":   n, "url":  "http://url.example.com"  }
]
```

**Exceptions:**

+ `An article id is required`: Status Code 403
+ `Id should be a numbe`: Status Code 403

#### All deliveries to a webhook

**GET**: `/deliveries/webhooks`

| Parameter | Description |
| --------- | ----------- |
| `id`      | Webhook id  |

> ⚠️ The parameter is given through the query string

**Reponse:** 
List of articles
```json
[
    { "id":   1, "sourceId": x },
    ...
    { "id":   n, "sourceId": y  }
]
```

**Exceptions:**

+ `A webhook id is required`: Status Code 403
+ `Id should be a numbe`: Status Code 403

## License

RssHookBackend is [MIT licensed](LICENSE).
