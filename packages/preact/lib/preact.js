import {createContext} from "preact"
import {useContext, useEffect, useRef, useState} from "preact/hooks"

export var StoreContext = createContext()
export var StoreProvider = StoreContext.Provider
StoreProvider.displayName = "@re-frame/StoreProvider"

export function useStore() {
  var store = useContext(Store)
  return [useSubscription, store.dispatch]
}

export function useDispatch(event) {
  var store = useContext(StoreContext)
  if (event) {
    useEffect(function() {
      store.dispatch(event)
    }, event)
  }
  return store.dispatch
}

export function useLazySubscription(query) {
  var store = useContext(StoreContext)
  var state = useState()
  var value = state[0]
  var setValue = state[1]

  useEffect(function() {
    var subscription = store.subscribe(query)

    // The subscription may have emitted a new value between the start of render
    // and mount. If so, broadcast that change.
    if (value !== subscription.deref()) {
      setValue(subscription.deref())
    }
    subscription.watch(function(prev, next) {
      setValue(next)
    })
    return function() {
      subscription.dispose()
    }
  }, query)
  return value
}

export function useSubscription(query) {
  var store = useContext(StoreContext)
  var mounted = useRef(false)
  var initialValue

  if (!mounted.current) {
    initialValue = store.query(query)
  }

  var lazyValue = useLazySubscription(query)
  if (!mounted.current) {
    mounted.current = true
    return initialValue
  } else {
    return lazyValue
  }
}

export function useSubscriptions(queries) {
  var mounted = useRef(false)
  var store = useContext(StoreContext)
  var state = useState(!mounted.current && queries.map(store.query))
  var value = state[0]
  var setValue = state[1]

  useEffect(function() {
    if (!mounted.current) {
      mounted.current = true
    }

    var subscriptions = queries.map(store.subscribe)
    subscriptions.forEach(function(subscription) {
      subscription.watch(recompute)
    })

    function recompute() {
      setValue(
        subscriptions.map(function(subscription) {
          return subscription.deref()
        })
      )
    }

    return function() {
      subscriptions.forEach(function(subscription) {
        subscription.dispose()
      })
    }
  }, flatten(queries))

  return value
}

var _concat = [].concat
function flatten(arr) {
  return _concat.apply([], arr)
}
