# Effects

XXX Describe what effects are and what's available.

## HTTP

```js
import {http} from "@re-frame/effects"
import {createStore} from "@re-frame/store"

const store = createStore()
store.effect("http", http)

store.event.fx("load-data", (ctx) => ({
  db: {
    ...ctx.db,
    loading: true,
  },
  http: {
    method: "GET",
    url: "my.api.com/endpoint",
    success: ["load-data-success"],
    failure: ["load-data-failure"],
  },
}))
store.event("load-data-success", (db, event) => {
  const [, response] = event
  return {
    loading: false,
    data: response,
  }
})
store.event("load-data-failure", (db, event) => {
  const [, error] = event
  return {
    loading: false,
    error,
  }
})
```

## Orchestrate

```js
import {orchestrate} from "@re-frame/effects"
import {createStore} from "@re-frame/store"

const store = createStore()
store.effect("orchestrate", orchestrate)

store.event.fx("boot", () => ({
  orchestrate: {
    dispatch: ["first-event"],
    rules: [
      { after: "first-event", dispatch: ["second-event"] },
      { after: "second-event", dispatchN: [["third-event"], ["fourth-event"]] },
      { after: "third-event", dispatch: ["last-event"], halt: true },
    ],
  },
}))
```