## Constants

<dl>
<dt><a href="#FRAME_PREFIX">FRAME_PREFIX</a></dt>
<dd><p>Prefix that is tacked on to action type when using <code>frame()</code></p>
</dd>
<dt><a href="#dispatch">dispatch</a></dt>
<dd><p>Interceptor that dispatches the action stored in context.coeffects.action.</p>
</dd>
<dt><a href="#debug">debug</a></dt>
<dd><p>Interceptor that logs the context with console.log().</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#effect">effect(effectId, args)</a></dt>
<dd><p>Interceptor factory that creates an interceptor that merges the effectId and args into context.effects.</p>
</dd>
<dt><a href="#injectCoeffects">injectCoeffects(coeffectId, args)</a></dt>
<dd><p>Interceptor factory that creates an interceptor that merges the result of the coeffect handler named coeffectId into context.coeffects under the coeffectId key.</p>
</dd>
<dt><a href="#coeffectToAction">coeffectToAction(args)</a></dt>
<dd><p>Interceptor factory that creates an interceptor that merges the value at coeffects[from] into coeffects.action[to].
Useful if you want to tack on the result from a previous coeffect handler on to the action before dispatching it so that you can access that data in your reducers.</p>
</dd>
<dt><a href="#reFrame">reFrame(options)</a></dt>
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
<a name="dispatch"></a>

## dispatch
Interceptor that dispatches the action stored in context.coeffects.action.

**Kind**: global constant  
<a name="debug"></a>

## debug
Interceptor that logs the context with console.log().

**Kind**: global constant  
<a name="effect"></a>

## effect(effectId, args)
Interceptor factory that creates an interceptor that merges the effectId and args into context.effects.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| effectId | <code>string</code> | effectId |
| args | <code>object</code> | key value pair arguments |

<a name="injectCoeffects"></a>

## injectCoeffects(coeffectId, args)
Interceptor factory that creates an interceptor that merges the result of the coeffect handler named coeffectId into context.coeffects under the coeffectId key.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| coeffectId | <code>string</code> | coeffectId |
| args | <code>object</code> | key value pair arguments |

<a name="coeffectToAction"></a>

## coeffectToAction(args)
Interceptor factory that creates an interceptor that merges the value at coeffects[from] into coeffects.action[to].
Useful if you want to tack on the result from a previous coeffect handler on to the action before dispatching it so that you can access that data in your reducers.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>Object</code> | key/value argument pairs. |
| args.from | <code>string</code> | path in coeffects that you want merged into the action. Can express a deep path with dot-separated path string. |
| args.from | <code>Array.&lt;string&gt;</code> | path in coeffects that you want merged into the action. Can express a deep path with array of keys. |
| args.to | <code>string</code> | path in the action where you want the result merged into. Can express a deep path with dot-separated path string. |
| args.to | <code>Array.&lt;string&gt;</code> | path in the action where you want the result merged into.Can express a deep path with array of keys. |

<a name="reFrame"></a>

## reFrame(options)
Redux middlware that invokes the interceptor chain when the action.type is preffixed by FRAME_PREFIX. Add this to Redux with `applyMiddleware()`

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | key/value pairs of effectIds and effect handler functions. |
| options.effectHandlers | <code>Object</code> | key/value pairs of effectIds and effect handler functions. |
| options.coeffectHandlers | <code>Object</code> | key/value pairs of coeffectIds and coeffect handler functions. |
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

