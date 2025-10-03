import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build URL from queryKey. Support forms like:
    // - '/api/products'
    // - ['/api/products', { includeDeleted: true }]
    // - ['/api/products', '123', { foo: 'bar' }]
    let url: string;
    if (Array.isArray(queryKey)) {
      const [first, ...rest] = queryKey as any[];
      url = typeof first === "string" ? first : String(first);

      // If there's an object in the second position, treat it as query params
      if (rest.length && rest[0] && typeof rest[0] === "object" && !Array.isArray(rest[0])) {
        const paramsObj = rest[0] as Record<string, any>;
        const qp = new URLSearchParams();
        Object.entries(paramsObj).forEach(([k, v]) => {
          if (v === undefined || v === null) return;
          if (typeof v === "object") qp.set(k, JSON.stringify(v));
          else qp.set(k, String(v));
        });
        const qs = qp.toString();
        if (qs) url += (url.includes("?") ? "&" : "?") + qs;
      } else if (rest.length) {
        // append remaining non-object parts as path segments
        const pathParts = rest.filter(p => typeof p === 'string' || typeof p === 'number');
        if (pathParts.length) url = [url, ...pathParts].join('/');
      }
    } else {
      url = String(queryKey);
    }

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
