import { useQuery } from "convex/react";
import { useRef } from "react";
import { FunctionReference, getFunctionName } from "convex/server";
import { convexToJson } from "convex/values";

const MAX_CACHE_SIZE = 20;

type QueryReturn<T> = {
  data: T | undefined;
  isPrevious: boolean;
  isStale: boolean;
};

// simple: single previous result
export const useStableQuery = ((name, args) => {
  const result = useQuery(name, args);
  const stored = useRef(result);

  if (result !== undefined) {
    stored.current = result;
  }

  return {
    data: stored.current,
    isPrevious: result === undefined && stored.current !== undefined,
    isStale: false,
  };
}) as <T>(name: FunctionReference<"query">, args: any) => QueryReturn<T>;

export const useCachedStableQuery = ((name, args) => {
  const result = useQuery(name, args);
  const cache = useRef<Map<string, any>>(new Map());
  const lastPresentCacheKey = useRef<string | null>(null);

  const argsKey = `${getFunctionName(name)}-${JSON.stringify(convexToJson(args))}`;

  // Store the result if not loading
  if (result !== undefined) {
    if (cache.current.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.current.keys().next().value;
      if (firstKey) {
        cache.current.delete(firstKey);
      }
    }
    cache.current.set(argsKey, result);
    lastPresentCacheKey.current = argsKey;
  }

  const cachedResult = cache.current.get(argsKey);

  if (result !== undefined) {
    return { data: result, isPrevious: false, isStale: false };
  }

  // choose cached results for this query instead of cached results for a different query
  if (cachedResult !== undefined) {
    return { data: cachedResult, isPrevious: false, isStale: true };
  }
  const lastCached =
    lastPresentCacheKey.current !== null
      ? cache.current.get(lastPresentCacheKey.current)
      : undefined;

  // fall back to whatever the last result we had was for stability
  if (lastCached) {
    return { data: lastCached, isPrevious: true, isStale: false };
  }

  return { data: undefined, isPrevious: false, isStale: false };
}) as <T>(name: FunctionReference<"query">, args: any) => QueryReturn<T>;
