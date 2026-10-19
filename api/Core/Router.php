<?php

declare(strict_types=1);

namespace Api\Core;

class Router
{
    private array $routes = [];

    public function add(string $method, string $path, callable|array $handler): void
    {
        $this->routes[] = [
            'method'  => strtoupper($method),
            'path'    => '/' . trim($path, '/'),
            'handler' => $handler,
        ];
    }

    public function dispatch(Request $request): void
    {
        $method = $request->method();
        $uri    = $request->uri();

        // Normalize trailing slash (treat /users/ and /users the same)
        $uri = rtrim($uri, '/') ?: '/';

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $pattern = $this->pathToRegex($route['path']);
            if (preg_match($pattern, $uri, $matches)) {
                // Extract named params
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                $request->setParams($params);

                $handler = $route['handler'];

                if (is_callable($handler)) {
                    $handler($request);
                    return;
                }

                if (is_array($handler) && count($handler) === 2) {
                    [$class, $action] = $handler;

                    if (is_string($class)) {
                        $class = new $class();
                    }

                    $class->{$action}($request);
                    return;
                }
            }
        }

        Response::error('Not Found', 404);
    }

    private function pathToRegex(string $path): string
    {
        // Escape forward slashes
        $pattern = preg_quote($path, '#');

        // Replace :param placeholders with regex groups
        $pattern = preg_replace('#\\\:([a-zA-Z_]+)#', '(?P<$1>[^/]+)', $pattern);

        return '#^' . $pattern . '$#';
    }
}
