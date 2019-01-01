# re-frame vs redux

1. In re-frame, an "event" can be thought of as nearly the same thing as a redux "action". They do look a bit different, though, since re-frame uses a tuple while redux uses the more traditional object:

```js
const event  = ['add', 5]                   // re-frame
const action = { type: 'add', payload: 5 }  // redux
```

1. In re-frame, an "EventDB handler" can be thought of as nearly the same thing as a redux "reducer".

```js
// re-frame event handlers
const store = reframe.createStore(0)
store.registerEventDB('increment', (db, event) => db + 1)
store.registerEventDB('decrement', (db, event) => db - 1)
store.dispatch(['increment'])

// redux reducer
const reducer = (state = 0, action) => {
  switch (action.type) {
    case 'increment':
      return state + 1
    case 'decrement':
      return state - 1
    default:
      return state
  }
}
const store = redux.createStore(reducer)
store.dispatch({ type: 'increment' })
```

1. When using redux's `combineReducers` function, all combined reducers will be called when an action is dispatched, regardless of whether they care about it. This can be used to implement generic reducers that act on arbitrary actions. This is not possible in re-frame, since an event is sent directly to its corresponding handler. You can achieve a similar effect, though, by using **interceptors**.