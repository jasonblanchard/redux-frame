## Constants

<dl>
<dt><a href="#FRAME_PREFIX">FRAME_PREFIX</a></dt>
<dd><p>Prefix that is tacked on to action type when using <code>frame()</code></p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#effect">effect()</a></dt>
<dd><p>Interceptor factory that creates an interceptor that merges the effectId and args into context.effects.</p>
</dd>
<dt><a href="#injectCoeffects">injectCoeffects()</a></dt>
<dd><p>Interceptor factory that creates an interceptor that merges the result of the coeffect handler named coeffectId into context.coeffects under the coeffectId key.</p>
</dd>
<dt><a href="#path">path(args)</a></dt>
<dd><p>Interceptor factory that creates an interceptor that merges the value at coeffects[from] into coeffects[to].
Useful if you want to tack on the result from a previous coeffect handler on to the action before dispatching it so that you can access that data in your reducers.</p>
</dd>
<dt><a href="#reduxFrame">reduxFrame(options)</a></dt>
<dd><p>Redux middlware that invokes the interceptor chain when the action.type is preffixed by FRAME_PREFIX. Add this to Redux with <code>applyMiddleware()</code></p>
</dd>
<dt><a href="#mergeWithEffects">mergeWithEffects(context, effect)</a></dt>
<dd><p>Merge effect with context.effects.</p>
</dd>
<dt><a href="#mergeWithCoeffects">mergeWithCoeffects(context, coeffect)</a></dt>
<dd><p>Merge effect with context.coeffects.</p>
</dd>
<dt><a href="#frame">frame(type)</a></dt>
<dd><p>Add FRAME_PREFIX to action type.
This tells reduxFrame that this is an action that should be handled by the middleware.
Actions that don&#39;t have this prefix are passed through the rest of the configured Redux middleware stack.</p>
</dd>
</dl>

<a name="FRAME_PREFIX"></a>

## FRAME_PREFIX
Prefix that is tacked on to action type when using `frame()`

**Kind**: global constant  
<a name="effect"></a>

## effect()
Interceptor factory that creates an interceptor that merges the effectId and args into context.effects.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
|  | <code>string</code> | effectId |
|  | <code>object</code> | key value pair arguments |

**Example**  
```js
// In your interceptor chain:
['effect', { effectId: 'someEffectHandler' args: { arg1: 'arg1' } }]
// When the interceptors are run, this will invoke your effect handler:
someEffectHandler(context, { arg1: 'arg1' }, dispatch)
```
<a name="injectCoeffects"></a>

## injectCoeffects()
Interceptor factory that creates an interceptor that merges the result of the coeffect handler named coeffectId into context.coeffects under the coeffectId key.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
|  | <code>string</code> | coeffectId |
|  | <code>object</code> | key value pair arguments |

**Example**  
```js
// In your interceptor chain:
['injectCoeffects', { coeffectId: 'someCoeffectHandler' args: { arg1: 'arg1' } }]
// When the interceptors are run, this will invoke your effect handler:
someCoeffectHandler(context, { arg1: 'arg1' })
```
<a name="path"></a>

## path(args)
Interceptor factory that creates an interceptor that merges the value at coeffects[from] into coeffects[to].
Useful if you want to tack on the result from a previous coeffect handler on to the action before dispatching it so that you can access that data in your reducers.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>Object</code> | key/value argument pairs. |
| args.from | <code>string</code> | source path you want to merge elsewhere. Can express a deep path with dot-separated path string. |
| args.from | <code>Array.&lt;string&gt;</code> | source path you want to merge elsewhere. Can express a deep path with array of keys. |
| args.to | <code>string</code> | destination path. Can express a deep path with dot-separated path string. |
| args.to | <code>Array.&lt;string&gt;</code> | destination path.Can express a deep path with array of keys. |

**Example**  
```js
// In your interceptor chain:
['path', { from: 'some.from.path', to: 'some.to.path' }]
```
<a name="reduxFrame"></a>

## reduxFrame(options)
Redux middlware that invokes the interceptor chain when the action.type is preffixed by FRAME_PREFIX. Add this to Redux with `applyMiddleware()`

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | key/value pairs of effectIds and effect handler functions. |
| options.effectHandlers | <code>Object</code> | key/value pairs of effectIds and effect handler functions. |
| options.coeffectHandlers | <code>Object</code> | key/value pairs of coeffectIds and coeffect handler functions. |
| options.interceptors | <code>Object</code> | key/value pairs of interceptorIds and interceptors. Interceptors may be interceptor objects (with an `id` and a `before` OR `after` function) or functions that return interceptor objects (i.e. interceptor factories). Interceptor factories should be added to the interceptor chain as an array where element 0 is the interceptorId and element 1 are args for the interceptor factory. |
| options.globalInterceptors | <code>Object</code> | Array of interceptors. These will run AFTER the built-in interceptors and BEFORE action.interceptors. |

<a name="mergeWithEffects"></a>

## mergeWithEffects(context, effect)
Merge effect with context.effects.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>object</code> | context map |
| effect | <code>object</code> | key value pair of effect handler name as they key and args as the value. |

<a name="mergeWithCoeffects"></a>

## mergeWithCoeffects(context, coeffect)
Merge effect with context.coeffects.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>object</code> | context map |
| coeffect | <code>object</code> | key value pair of coeffect handler name as they key and args as the value. |

<a name="frame"></a>

## frame(type)
Add FRAME_PREFIX to action type.
This tells reduxFrame that this is an action that should be handled by the middleware.
Actions that don't have this prefix are passed through the rest of the configured Redux middleware stack.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | action type. |

