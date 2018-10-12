# redux-frame
Side-effect management library for Redux inspired by [re-frame](https://github.com/Day8/re-frame).

> NOTE: This is very new and very experimental. It is not stable and the API is almost certainly change. ☠️ BEWARE ☠️

[![CircleCI](https://circleci.com/gh/jasonblanchard/redux-frame.svg?style=svg)](https://circleci.com/gh/jasonblanchard/redux-frame)

[![Coverage Status](https://coveralls.io/repos/github/jasonblanchard/redux-frame/badge.svg?branch=master)](https://coveralls.io/github/jasonblanchard/redux-frame?branch=master)

## What's this all about?
The purpose of this library is to give you, the application developer, the tools you need to compose a Redux implementation out of smaller, purer, more reusable pieces that isolate side effects and interaction with the outside world.

This library is heavily influence by [re-frame](https://github.com/Day8/re-frame). At this point, you should head over there and read the [overview](https://github.com/Day8/re-frame#derived-values-flowing) and docs on [interceptors](https://github.com/Day8/re-frame/blob/master/docs/Interceptors.md), [effects](https://github.com/Day8/re-frame/blob/master/docs/Effects.md) and [coeffects](https://github.com/Day8/re-frame/blob/master/docs/Coeffects.md). Go ahead, I'll wait.

Ok ready? That's a quality README, isn't it? I apologize for all the parentheses.

redux-frame is pretty much a Javascript port of dominos 1 through 3 that fits in with the Redux paradigm through a Redux middleware. You'll see a lot of the same concepts and terminology around interceptors, effects, and coeffects. If you're like "WAT I don't know what you're talking about!" you should circle back to the re-frame [overview](https://github.com/Day8/re-frame#derived-values-flowing) and the docs on [interceptors](https://github.com/Day8/re-frame/blob/master/docs/Interceptors.md), [effects](https://github.com/Day8/re-frame/blob/master/docs/Effects.md) and [coeffects](https://github.com/Day8/re-frame/blob/master/docs/Coeffects.md). Go ahead, I'll wait. It's worth it, I promise. You'll get used to the parentheses.

Redux-frame works pretty similarly and so, having thoroughly enjoyed those docs above, you almost already know how this library works. There are a few differences:

1. You don't "register" effect and coeffect handlers throughout the code. Instead, you pass them in at store creation time. The purpose for this is to avoid having state hang out in module scope which I always find a little unsettling. Redux gives us a natural place to inject these dependencies when you pass the middleware in to `createStore()`.
1. You also don't need to register event handlers at all. In re-frame, this is where you build up your interceptor chain. In redux-frame, interceptors are listed directly in the action payload. The reason for this is [react-redux](https://github.com/reduxjs/react-redux) already provides a level of indirection between actions and view code by way of the `connect()` higher-order component and your `mapDispatchToProps()` function. If your action payloads start to get complex (they will - by design, a lot of orchestration gets delegated to these objects) and you want to make them more re-usable, feel free to use action creator functions.
1. There are no interceptors that deal with the `db` value. Instead, redux-frame can forward actions through the rest of the Redux middleware stack to your reducer function(s) which can handle state transitions just like you're used to with pure Redux. In other words, the `db` value is what you get from `store.getState()`. You are free to choose your event schema (imperative "DO_X" event types or declarative "X_HAPPENED" event types) and your reducer composition structure (`reduceReducers` or `combineReducers`). Both are outside the scope of this library.

## Quick start
Install redux-frame:

```
$ npm install redux-reduxFrame
```

Configure your Redux store with the `reduxFrame` middleware:

store.js:
```js
import { reduxFrame } from 'redux-frame';
import { createStore, applyMiddleware } from 'redux';

import reducer from './reducer'; // You'll create this like any other reducer.
// You'll create these, too, following the docs below:
import effectHandlers from './effects';
import coeffectHandlers from './coeffects';

export default createStore(
  reducer,
  applyMiddleware(
    reduxFrame({
      effectHandlers,
      coeffectHandlers
    })
  )
)
```

Configure your application with this `store` just like any other Redux sture.

Later, in your application, dispatch an action with an interceptor chain:

```js
import { frame, effect, injectCoeffect, interceptors: as reduxFrameInterceptors } from 'redux-frame';
import interceptors from './interceptors';

function mapDispatchToProps(dispatch) {
  return {
    handleSomething: dispatch({
      type: frame('SOME_ACTION'),
      interceptors: [
        reduxFrameInterceptors.debug, // Built-in interceptor to log out the context map
        reduxFrameInterceptors.dispatch, // Build-in effect handler for dispatching the action in coeffects.action
        effect('someCustomEffect', { someArgKey: 'someArgValue' }), // Adds `someCustomEffect` to the effect map which later invokes the someCustomEffect effect handler.
        injectCoeffect('someCustomCoeffect', { someArgKey: 'someArgValue' }), // Replaces the `someCustomCoeffect` key in coeffects with the return value of the someCustomCoeffect coeffect handler.
        interceptors.someCustomInterceptor // Invokes the someCustomInterceptor.before function in the first pass through the interceptor chain and the someCustomInterceptor.after function in the second pass. In this position, its `before` function will be the last to get invoked and its `after` function will be the first to be invoked.
      ]
    })
  }
}
```

### API docs
Right [over here](docs/api).

## Key concepts
### Interceptors
The interceptor chain is kind of like middleware functions that you see in [Redux](https://redux.js.org/advanced/middleware) and [Express](https://expressjs.com/en/guide/using-middleware.html) - you inject behavior with middleware functions that can do special stuff and then invoke some kind of `next()` function that represents the next link in the chain.

The interceptor chain is _kind of_ like a middleware chain except instead of using the functions and the call stack to process everything, the interceptor chain creates a "virtual" stack using data that can be walked in two directions and modified at runtime (whoa)!

Interceptors are objects that look like this:

```js
const myInterceptor: {
  id: 'myInterceptor', // Mostly used for debugging
  before: context => { /* do something with context, return a new context */ }, // We'll get to this `context` thing later.
  after: context => { /* do something with context, return a new context */ } // You don't need both a `before` and `after` key, but you will need one of them for your interceptor to do anything.
}
```

Interceptors are invoked in the redux-frame middleware by adding them to the action payload at dispatch time:

```js
dispatch({
  type: frame('SOME_ACTION'), // `frame()` is provided by redux-frame. It just adds a special prefix to the action type so the middleware knows to deal with it.
  interceptors: [myInterceptor, anotherInterceptor, yetAnotherInterceptor]
});
```

Because this action type is `frame`'d, the redux-frame middleware will catch the action and, instead of sending it through the rest of the Redux middleware to your reducers, it'll start processing the interceptor chain.

"Processing" the interceptor chain means two things:
1. Running through all the `before()` functions as a queue (with the head of the queue being the right-most interceptor function)
2. Running through all the `after()` functions as a stack (with the head of the stack being the last interceptor run in the queue).

In other words, your interceptor list is processed once from right to left calling each `before()` function, usually building up the `coeffects` object described below, and then once from left to right calling each `after()` function, usually building up the `effects` object also described below..

As it does this, it threads a `context` map through each `before()` and `after()` function. These functions can return a new `context` map with more stuff in it. The context map has a few important keys in it:

- `coeffects` - this is an object of key value pairs. This is just data that can be used by other interceptors.
- `effects` - these are special key value pairs where the key maps to an `effectHandler` which later gets invoked with the value as `args`.
- `queue` - list of interceptors whose `before` functions have yet to be run.
- `stack` - list of interceptors already walked whose `after` functions may need to be run.

Interceptor functions should _always_ return a new context map and should _always_ be pure functions.

### Effects
Inevitably, your dispatched actions will eventually need to kick off side effects - http requests, dispatching other actions, etc. The way this is handled in redux-frame is to configure `eventHandler`s that are passed at store creation time. These are functions that look like this:

```js
const effectHandlers = {
  myEffectHandler = (coeffects, args, dispatch) => {
    /* do some gnarly code that interacts with the outside world, yuck! */
    return; // Whatever you return from these functions is ignored and lost forever, so don't bother trying.
  }
};
```

In your effect handler, you have access to all the coeffects built up by previous interceptors. You also have access to an `args` object and redux's `dispatch` function.

This effect handler gets invoked by the redux-frame middleware by you adding a key with the same name as the handler in the `effects` key of the `context` map. So in this case, you'd build up your `context` object to look like this:

```js
{
  coeffects: {...},
  effects: {
    myEffectHandler: { someArgKey: 'someArgValue' }
  }
}
```

> NOTE: There's a utility that'll merge this into the `effects` object this for you. Use it like this: `effect('myEffectHandler', { someArgKey: 'someArgValue' });`

The value of this key is passed as the `args` in your coeffect handler. The return value of coeffect handlers is ignored - they _just_ do side-effects. This is kicked off by a special effect handler at the very end of your interceptor chain that invokes all the effect handlers listed in `context.effects`. There is no guarantee of order in which these are executed.

And just like that, you can move side-effects to `effectHandlers` where they can be tested in isolation and then orchestrate them with data at action dispatch time.

There are a few built-in effect handlers that you can use:
- `dispatch` - this dispatches the action stored in `coeffects.action`. By default, this is the same action that kicked off the interceptor chain with the `frame()` prefix removed and excluding the interceptor array. You can add data to the payload to pass along more information to your reducers as necessary.
- `debug` - this calls `console.log` with the `action.type` and entire `context` map. This is useful for... well, debugging.

### Coeffects
Sometimes, your actions need access to the outside world. For example, your state transformation may be a function of some data stored in localStorage or a cookie. However, doing this in an interceptor would make it impure!

You can facilitate this by configuring your middleware with `coeffectHandlers`. These are functions that look like this:

```js
const coeffectHandlers = {
  myCoeffectHandler: (coeffects, args) => {
    /* do some gnarly code that interacts with the outside world, yuck! */
    return { some: 'thing' }; // Whatever you return here is added as the value of the `myCoeffectHandler` key in the coeffects map.
  }
}
```

This function gets invoked by the redux-frame middleware by calling the `injectCoeffect()` function in your interceptor chain where the first argument is the same name as the handler and the second argument is an `args` object:

```js
dispatch({
  type: frame('SOME_ACTION'),
  interceptors: [injectCoeffect('myCoeffectHandler', { someArgKey: 'someArgValue' })]
})
```

After this interceptor runs, the `coeffects` key will have the value returned by your coeffect handler.

There are a few built-in coeffect handlers that are added automatically:
- `state` - this adds the current value of `store.getState()` to the coeffects object.
- `action` - this is the same action that kicked off the interceptor chain with the `frame()` prefix removed and excluding the interceptor array. This will be used if you add the `dispatch` effect.

### Queue and Stack
The `queue` is a list of `interceptor` `before()` functions that get invoked in the first pass through the interceptor chain with the head as the right-most interceptor in the `interceptor` array (i.e. it goes right-to-left based on the order of interceptors in the `interceptors` array). Each time an interceptor gets popped off that list, it is pushed onto the `stack` to get invoked in the second run through the interceptor chain (i.e. left-to-right based on the order of interceptors in the `interceptors` array).

Because the `queue` and the `stack` are part of the `context` map, they can be introspected and modified by other interceptors.

Why would you do that? You may need to further process a value added to `coeffects` by a coeffect handler as a function of the value itself. Or maybe your coeffect handler resulted in an error and you need to conditionally tack information about the error on the the `coeffects.action` payload.

Ultimately, though, this is a pretty advanced feature that should be used judiciously.

## FAQ
### Why not some other Redux side-effect library like redux-thunk, redux-saga, redux-observable?
All these libraries have different approaches to dealing with time and sequencing. This library ____ has a really good write-up on the challenges inherent in dealing with time. Its the stance of this library that time and sequences are best expressed with data and that we can leverage data to push effect-ful code to the boundaries of the application.
### How do I test it?
That's actually one of the motivators for porting re-frame to the Redux ecosystem. Testing each part of your redux-frame stack in isolation should be super duper easy:

- actions are just object literals. Test them if you want, it should be pretty straightforward.
- interceptor `before()` and `after()` should be pure functions, so testing them should also be simply.
- effect and coeffect handlers may have some nasty dependencies that need to be mocked out or set up, but they should otherwise be simple, do one thing, and be very isolated from other parts of your code.

The goal of building architecture this way is that you have few effect and coeffect handlers (which are hard to test) and many actions that leverage these (which are easy and possibly unnecessary to test).
### How does this fit in with GraphQL?
`¯\_(ツ)_/¯`

If you are all-in on [Apollo](https://www.apollographql.com/) or [Relay](https://facebook.github.io/relay/), this probably ins't the library for you.

However, if you value more separation between your view code, the data fetching layer and centralized state management, I imagine you could use redux-frame something like this:

1. Build an interceptor or coeffect handler that pulls in a GraphQL query from somewhere. Maybe this is store on a root component that's keyed to the route or constructed from some component hierarchy.
2. Create an effect handler that will make the http request to your GraphQL endpoint with the query.
3. Configure the effect handler to dispatch another action in the error case to handle error-ey state.
4. Configure the effect handler to dispatch another action in the success case that processes the result.
5. The success action may normalize the result by key or do whatever else it needs to do for safe keeping in the Redux store.

## The Future
A future goal is to implement an effect handler similar to [re-frame-async-flow-fx](https://github.com/Day8/re-frame-async-flow-fx) so that redux-frame can coordinate complex, multistep actions.
