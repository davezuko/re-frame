import {createStore as createBaseStore} from "@re-frame/store"

export function createStore() {
  var store = createBaseStore.apply(null, arguments)

  // Aliases
  store.event = store.registerEventDB
  store.event.fx = store.registerEventFX
  store.effect = store.registerEffect
  store.inject = store.injectCoeffect

  // Ergonomic wrappers
  store.dispatch = makeSimpleDispatch(store.dispatch)
  store.dispatchSync = makeSimpleDispatch(store.dispatchSync)
  store.computed = makeSimpleComputed(store.registerSubscription)
  store.query = makeSimpleQuery(store.query)
  store.subscribe = makeSimpleQuery(store.subscribe)

  // New functionality
  store.init = function(initialState) {
    // TODO: verify init not called after first run?
    // TODO: how to unregister an event?
    store.registerEventDB("@re-frame/init", function init(db, event) {
      return event.initialState
    })
    store.dispatchSync({id: "@re-frame/init", initialState: initialState})
  }

  return store
}

/**
 * Store only supports subscribing with a tuple: ["id", ...args].
 * makeSimpleSubscribe allows passing these values in unwrapped:
 *
 * Before : subscribe(["id", 1, 2, 3])
 * After  : subscribe("id, 1, 2, 3)
 */
function makeSimpleQuery(subscribe) {
  return function normalizeQuery(query) {
    if (typeof query === "string") {
      query = [].slice.call(arguments)
    }
    return subscribe(query)
  }
}

/**
 * Before : registerSubscription("foo", (db, [id, ...args]) => {})
 * After  : computed("foo", (db, ...args) => {})
 */
function makeSimpleComputed(registerSubscription) {
  return function computed(id, queries, handler) {
    if (typeof queries === "function") {
      handler = queries
      queries = undefined
    }
    function simpleHandler(db, query) {
      var args = [db].concat(query.slice(1))
      return handler.apply(null, args)
    }
    return registerSubscription(id, queries, simpleHandler)
  }
}

/**
 * Before : dispatch({ id: "event" })
 * After  : dispatch("event")
 *
 * Before : dispatch({ id: "event", payload: 1 })
 * After  : dispatch("event", 1)
 *
 * Before : dispatch({ id: "event", error: true, message: "error!" })
 * After  : dispatch("event", { error: true, message: "error!" })
 */
function makeSimpleDispatch(dispatcher) {
  return function dispatch(id, payload) {
    var event
    if (typeof id === "object") {
      event = id
    } else {
      event = Object.create(null)
      event.id = id
      if (arguments.length > 1) {
        if (typeof payload === "object" && payload) {
          for (var key in payload) {
            if (payload.hasOwnProperty(key)) {
              if (key === "id") {
                // TODO: warn in development
                continue
              }
              event[key] = payload[key]
            }
          }
        } else {
          event.payload = payload
        }
      }
    }
    return dispatcher(event)
  }
}