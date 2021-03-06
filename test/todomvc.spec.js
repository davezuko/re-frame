import test from "ava"
import {createStore} from "@re-frame/store"

const flush = () => new Promise(resolve => setTimeout(resolve))

const makeTodo = description => ({
  description,
  completed: false,
})
const [
  TODO_LEARN_REFRAME,
  TODO_WRITE_FIRST_REFRAME_APPLICATION,
  TODO_TAKE_A_BREAK,
] = [
  makeTodo("Learn about re-frame's dominos"),
  makeTodo("Write your first application with re-frame"),
  makeTodo("Take a break and go outside!"),
]

const makeStore = () => {
  const store = createStore()
  store.registerEventDB("init", () => ({
    todos: [
      TODO_LEARN_REFRAME,
      TODO_WRITE_FIRST_REFRAME_APPLICATION,
      TODO_TAKE_A_BREAK,
    ],
  }))
  store.dispatchSync({id: "init"})

  store.registerEventDB("toggle-completed", (db, {todo}) => ({
    ...db,
    todos: db.todos.map(t => {
      return t.description === todo.description
        ? {...t, completed: !t.completed}
        : t
    }),
  }))

  store.registerEventDB("create-todo-success", (db, {response}) => ({
    ...db,
    todos: db.todos.concat(response),
  }))

  store.registerEventFX("create-todo", (cofx, {todo}) => ({
    http: {
      method: "POST",
      url: "/create-todo",
      body: todo,
      success: "create-todo-success",
    },
  }))

  store.registerEffect("http", store => config => {
    // simulate a network request
    Promise.resolve().then(() => {
      switch (config.url) {
        case "/create-todo":
          store.dispatchSync({id: config.success, response: config.body})
          break
      }
    })
  })

  return store
}

test("Can toggle a todo between complete and incomplete", t => {
  const store = makeStore()
  store.registerSubscription("todo", (db, {where}) => {
    return db.todos.find(todo => todo.id === where.id)
  })

  const findTodo = todo => store.query({id: "todo", where: {id: todo.id}})

  store.dispatchSync({id: "toggle-completed", todo: TODO_LEARN_REFRAME})
  t.is(findTodo(TODO_LEARN_REFRAME).completed, true)

  store.dispatchSync({id: "toggle-completed", todo: TODO_LEARN_REFRAME})
  t.is(findTodo(TODO_LEARN_REFRAME).completed, false)

  store.dispatchSync({id: "toggle-completed", todo: TODO_LEARN_REFRAME})
  t.is(findTodo(TODO_LEARN_REFRAME).completed, true)
})

test("Can create a todo", async t => {
  const store = makeStore()

  store.registerSubscription("todos", db => db.todos)
  const todos = store.subscribe({id: "todos"})

  store.dispatchSync({
    id: "create-todo",
    todo: {description: "Create a new todo", completed: false},
  })
  await flush()
  t.deepEqual(todos.deref(), [
    TODO_LEARN_REFRAME,
    TODO_WRITE_FIRST_REFRAME_APPLICATION,
    TODO_TAKE_A_BREAK,
    {
      description: "Create a new todo",
      completed: false,
    },
  ])
})
