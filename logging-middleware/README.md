# Logging Middleware

A reusable logging package for the campus notification platform. Works across both backend and frontend (Node.js/JavaScript).

## Usage

```js
const { Log } = require('./logging-middleware');

await Log("backend", "info", "handler", "Processing notification request");
await Log("frontend", "error", "api", "Failed to fetch notifications");
```

## Function Signature

```
Log(stack, level, package, message)
```

## Parameters

| Parameter | Allowed Values |
|-----------|----------------|
| stack | `backend`, `frontend` |
| level | `debug`, `info`, `warn`, `error`, `fatal` |
| package (backend) | `cache`, `controller`, `cron_job`, `db`, `domain`, `handler`, `repository`, `route`, `service` |
| package (frontend) | `api`, `component`, `hook`, `page`, `state` |
| package (shared) | `auth`, `config`, `middleware`, `utils`, `style` |

## Setup

```bash
npm install
```

The middleware handles authentication automatically using stored credentials and caches the token until expiry.
