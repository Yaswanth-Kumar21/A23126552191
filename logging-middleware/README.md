# Logging Middleware

This is a small reusable package I wrote to handle logging across the project. The idea came from the requirement that we should not use console.log anywhere. Instead every important action in the code should be logged using this function.

The Log function takes four inputs and sends them to the evaluation server as a POST request. It also handles getting the auth token automatically so I do not have to worry about that every time I call it.

## How to use it

```js
const { Log } = require('./logging-middleware');

await Log("backend", "info", "handler", "user requested notifications list");
await Log("frontend", "error", "api", "failed to load notifications from server");
```

## What each parameter means

The first one is the stack, either backend or frontend depending on where you are calling it from.

The second one is the level. Use debug for detailed tracing, info for normal events, warn for something that might be a problem, error when something failed, and fatal when the whole app cannot continue.

The third one is the package, which tells where in the code the log is coming from.

The fourth one is just the message describing what happened.

## Setup

```
npm install
```

After that you can import it and start using the Log function anywhere in the project.
