# Trap — Functions

Trap is not just a server; it's also a useful collection of functions that help you debug your PHP applications.

## trap()

### Description

The `trap()` function is designed to capture and send variable dumps to the server. It serves as the primary entry point
for debugging PHP applications, allowing developers to inspect variables, trace execution flow, and analyze application
state at runtime.

> **Note:** When using `trap()`, it automatically configures `$_SERVER['REMOTE_ADDR']` and `$_SERVER['REMOTE_PORT']` if
> they are not already set. This ensures that the debug information is accurately captured and displayed.

### Signature

```php
function trap(mixed ...$values): TrapHandle
```

The function accepts any number of arguments (named or positional) and returns a `TrapHandle` instance that provides
additional debugging capabilities through method chaining.

### Usage Examples

#### 1. Basic Variable Dumping

```php
// Dump a simple variable
trap($user);

// Dump multiple variables
trap($request, $response, $config);

// Use named arguments for better clarity
trap(user: $user, request: $request, response: $response);
```

This sends the variables to the Buggregator server where they can be inspected in the dashboard.

#### 2. Stack Trace Inspection

```php
// Add stack trace to your dump to see the execution flow
trap()->stackTrace();

// Dump a variable along with the stack trace
trap($result)->stackTrace();
```

This adds the current stack trace to your dump, showing the execution path that led to this point in your code.

#### 3. Limiting Dump Depth

```php
// Limit the dump depth to 4 levels for deeply nested objects
trap($complexObject)->depth(4);

// Dump multiple objects with depth limit
trap(user: $user, order: $order)->depth(2);
```

This is useful for complex objects where you want to limit how deep the dump will go into nested structures.

#### 4. Conditional Dumping

```php
// Dump only if a condition is met
trap($response)->if($statusCode >= 400);

// Using a callable for complex conditions
trap($query)->if(fn() => $query->count() > 100);
```

This lets you add conditional logic to your dumps, only showing them when specific conditions are met.

#### 5. Limiting Dump Frequency

```php
// Dump only once at this location in code
trap($i)->once();

// Dump only 5 times at this location
trap($i)->times(5);

// Dump only 3 times with full stack consideration (useful in recursion)
trap($recursiveData)->times(3, true);
```

This helps when debugging loops or recursive functions by limiting how many times the dump is shown.

#### 6. Getting Values Back

```php
// Dump a value and return it immediately
$result = trap($data)->return();

// Chain operations without breaking the flow
$response = $service->process(trap($request)->return());

// Return a specific named value
$name = trap(first: $firstName, last: $lastName)->return('last');
```

This allows you to insert debugging in the middle of expressions without disrupting your code flow.

#### 7. Adding Context

```php
// Add execution context to help understand the dump
trap($phpCode)->context(language: 'php', filename: 'Controller.php');

// Add context using an array
trap($data)->context(['environment' => 'production', 'user_id' => 42]);

// Shorthand for code highlighting
trap($sqlQuery)->code('sql');
```

This adds metadata to your dumps to provide more context for debugging.

#### 8. Combining Multiple Features

```php
// Combine multiple debugging features
trap($user)
    ->depth(3)
    ->if($user->isAdmin())
    ->context(role: 'admin', permissions: $user->getPermissions())
    ->once();
```

This example uses multiple features together to create a targeted debugging setup.

#### 9. Working with Protobuf Messages

```php
// Dump Protobuf messages with improved readability
trap($protoMessage);
```

The trap function includes special handling for Protocol Buffers, making them easier to debug.

#### 10. Checking Performance with Ticks

```php
// First tick
tr();

// Some code to measure
doSomething();

// Second tick will show time elapsed since first tick
tr();
```

The `tr()` function (a short alias) can be used to measure performance between points in your code.

## tr()

### Description

The `tr()` function is a shorthand alias for `trap()->return()`. When called without arguments, it works as a
performance ticker, measuring time and memory usage between calls.

### Signature

```php
function tr(mixed ...$values): mixed
```

### Usage Examples

#### 1. Performance Measurement

```php
// Mark the starting point
tr();

// Execute the code to measure
$result = heavyComputation();

// Mark the endpoint and see elapsed time and memory usage
tr();
```

This shows time elapsed and memory usage between calls.

#### 2. Quick Value Inspection

```php
// Dump and return in one call
$user = tr($repository->findUser($id));

// Chain in expressions
return tr($response->withHeader('Content-Type', 'application/json'));
```

This lets you inspect values while keeping them in your execution flow.

## td()

### Description

The `td()` function combines `trap()` with PHP's `die` statement, allowing you to dump values and terminate script
execution. It's useful for quickly halting execution after inspecting critical values.

### Signature

```php
function td(mixed ...$values): never
```

### Usage Examples

#### 1. Debug and Die

```php
// Dump value and terminate execution
td($error);

// Dump multiple values before terminating
td($request, $exception, $context);
```

This dumps the values to Buggregator and immediately terminates script execution.

#### 2. Emergency Debugging

```php
// When you need to stop and check what's happening
if ($unexpectedCondition) {
    td(message: 'Unexpected condition', data: $data);
}
```

This is useful during development to quickly halt execution at critical points.

#### 3. Performance Check and Die

```php
// Start measuring
tr();

// Run code to analyze
$result = complexOperation();

// Check result and terminate
td($result);
```

This combines performance measurement with termination, useful for profiling.