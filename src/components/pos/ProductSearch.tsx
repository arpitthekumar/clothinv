"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Fuse from "fuse.js";
import type { FuseResultMatch } from "fuse.js";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Search,
  X,
  Trash2,
  Clock,
  Camera,
  SearchCheck,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  sku?: string;
  price?: string | number;
  stock?: number;
};

type SearchResponse = {
  results: Product[];
  hasMore?: boolean;
};

type SearchFn = (args: {
  query: string;
  page: number;
}) => Promise<SearchResponse>;

interface ProductSearchProps {
  productCode?: string;
  onChangeProductCode?: (value: string) => void;
  onSearch?: (query?: string) => Promise<SearchResponse> | void;
  searchFn?: SearchFn;
  onOpenScanner?: () => void;
  onAddToCart?: (productId: string) => void;
  onToggleFavorite?: (productId: string) => void;
  isFavorite?: (productId: string) => boolean;
  debounceMs?: number;
  pageSize?: number;
}

export default function ProductSearch({
  productCode: initialCode = "",
  onChangeProductCode,
  onSearch,
  searchFn,
  onOpenScanner,
  onAddToCart = () => {},
  onToggleFavorite = () => {},
  isFavorite = () => false,
  debounceMs = 400,
  pageSize = 25,
}: ProductSearchProps) {
  const [query, setQuery] = useState(initialCode);
  const [results, setResults] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fuse, setFuse] = useState<Fuse<Product> | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<number | null>(null);
  const resultsRef = useRef(results);
  resultsRef.current = results;

  const STORAGE_KEY = "product_search_history_v1";
  const MAX_HISTORY = 8;

  // Load history
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (initialCode !== undefined) setQuery(initialCode);
  }, [initialCode]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasMore(false);
      return;
    }

    setTyping(true);
    setLoading(false);

    const id = window.setTimeout(() => {
      performSearch(query, 1, true);
      setTyping(false);
    }, debounceMs);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Fuse for local highlighting
  useEffect(() => {
    if (results.length > 0) {
      const f = new Fuse(results, {
        keys: ["name", "sku"],
        includeMatches: true,
        threshold: 0.35,
        minMatchCharLength: 1,
      });
      setFuse(f);
    } else {
      setFuse(null);
    }
  }, [results]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && hasMore && !loading) {
            performSearch(query, page + 1, false);
          }
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [sentinelRef.current, hasMore, loading, page, query]);

  const pushHistory = (term: string) => {
    if (!term.trim()) return;
    const next = [term, ...history.filter((h) => h !== term)].slice(
      0,
      MAX_HISTORY
    );
    setHistory(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const deleteHistoryItem = (term: string) => {
    const next = history.filter((h) => h !== term);
    setHistory(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  // Core search
  const performSearch = useCallback(
    async (q: string, p = 1, reset = false) => {
      if (!q.trim()) {
        setResults([]);
        setHasMore(false);
        setPage(1);
        return;
      }

      if (abortRef.current) {
        window.clearTimeout(abortRef.current);
        abortRef.current = null;
      }

      setLoading(true);

      try {
        if (searchFn) {
          const resp = await searchFn({ query: q.trim(), page: p });
          setResults((prev) =>
            reset ? resp.results : [...prev, ...resp.results]
          );
          setHasMore(Boolean(resp.hasMore));
          setPage(p);
          if (reset) pushHistory(q.trim());
          setSelectedIndex(null);
        } else if (onSearch) {
          const maybe = onSearch(q.trim());
          if (
            maybe &&
            typeof (maybe as Promise<SearchResponse>).then === "function"
          ) {
            const resp = (await maybe) as SearchResponse;
            setResults((prev) =>
              reset ? resp.results : [...prev, ...resp.results]
            );
            setHasMore(Boolean(resp.hasMore));
            setPage(p);
            if (reset) pushHistory(q.trim());
            setSelectedIndex(null);
          } else {
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // swallow
      } finally {
        setLoading(false);
        // hide history on actual search result
        setShowHistory(false);
      }
    },
    [searchFn, onSearch, history]
  );

  const renderHighlighted = (
    item: Product,
    matches?: FuseResultMatch[] | null
  ) => {
    const text = item.name;
    if (!matches || matches.length === 0) return <>{text}</>;

    const nameMatch = matches.find((m) => m.key === "name");
    if (!nameMatch || !nameMatch.indices) return <>{text}</>;

    const parts: Array<{ text: string; highlight?: boolean }> = [];
    let lastIndex = 0;
    for (const [start, end] of nameMatch.indices) {
      if (start > lastIndex) parts.push({ text: text.slice(lastIndex, start) });
      parts.push({ text: text.slice(start, end + 1), highlight: true });
      lastIndex = end + 1;
    }
    if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex) });

    return (
      <>
        {parts.map((p, idx) =>
          p.highlight ? (
            <span
              key={idx}
              className="font-semibold underline decoration-yellow-300 decoration-2"
            >
              {p.text}
            </span>
          ) : (
            <span key={idx}>{p.text}</span>
          )
        )}
      </>
    );
  };

  // Keyboard nav
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!resultsRef.current || resultsRef.current.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === null ? 0 : Math.min(resultsRef.current.length - 1, prev + 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === null ? resultsRef.current.length - 1 : Math.max(0, prev - 1)
        );
      } else if (e.key === "Enter") {
        if (selectedIndex !== null) {
          const p = resultsRef.current[selectedIndex];
          if (p) onAddToCart(p.id);
        } else {
          performSearch(query, 1, true);
        }
      } else if (e.key.toLowerCase() === "f") {
        if (selectedIndex !== null) {
          const p = resultsRef.current[selectedIndex];
          if (p) onToggleFavorite(p.id);
        }
      }
    };

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [selectedIndex, onAddToCart, onToggleFavorite, performSearch, query]);

  const displayedResults = useMemo(() => {
    if (!fuse) return results;
    const fuseRes = fuse.search(query, { limit: results.length || 50 });
    if (fuseRes.length === 0) return results;
    return fuseRes.map((r) => {
      const p = r.item as Product & { __matches?: FuseResultMatch[] };
      (p as any).__matches = r.matches ?? [];
      return p;
    });
  }, [fuse, results, query]);

  // handlers
  const handleInputChange = (val: string) => {
    setQuery(val);
    onChangeProductCode?.(val);
  };
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowHistory(false);
        setResults([]); // optional: close results too
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTapSearch = () => {
    // If query empty -> show history like Google
    if (!query.trim()) {
      setShowHistory((s) => !s);
      return;
    }
    performSearch(query, 1, true);
  };

  const handleSelectHistory = (term: string) => {
    setQuery(term);
    performSearch(term, 1, true);
  };

  return (
    <div ref={wrapperRef} className="w-full  mx-auto relative">
      <div className="relative group">
        {/* Search Input */}
        <div
          className={`flex items-center gap-2 bg-white dark:bg-slate-900 border 
          px-4 py-2 shadow-sm 
        transition 
        group-focus-within:ring-2 group-focus-within:ring-blue-300
		    ${
          showHistory || results.length > 0
            ? "rounded-t-4xl rounded-b-none"
            : "rounded-4xl"
        }
`}
        >
          {" "}
          <Search className="h-5 w-5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowHistory(true)}
            placeholder="Search products, SKU, barcode..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4 hover:text-red-500" />
            </button>
          )}
          <button
            onClick={handleTapSearch}
            className="text-slate-500 hover:text-slate-700"
          >
            <Search className="h-5 w-5 hover:text-blue-500" />
          </button>
          <button
            onClick={onOpenScanner}
            className="text-slate-500 hover:text-yellow-500"
          >
            <QrCode className="h-5 w-5" />
          </button>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {(showHistory || results.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="left-0 w-full bg-white dark:bg-slate-900 
    border border-t-0 shadow-lg overflow-hidden z-50
    rounded-4xl rounded-t-none
    transition 
    group-focus-within:ring-2 group-focus-within:ring-blue-300"
            >
              <div className="max-h-64 overflow-y-auto">
                {/* RECENT SEARCHES WHEN EMPTY INPUT */}
                {showHistory && query.trim() === "" && history.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs text-slate-400 mb-1 px-2">
                      Recent searches
                    </p>

                    {history.slice(0, 3).map((h) => (
                      <button
                        key={h}
                        onClick={() => handleSelectHistory(h)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                      >
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="flex-1 truncate text-sm">{h}</span>
                        <X
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(h);
                          }}
                          className="h-4 w-4 text-slate-400 hover:text-red-500"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* LIVE MATCHED RECENT SUGGESTIONS */}
                {query.trim() !== "" &&
                  history
                    .filter((h) =>
                      h.toLowerCase().includes(query.toLowerCase())
                    )
                    .slice(0, 2)
                    .map((match) => (
                      <button
                        key={match}
                        className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
                        onClick={() => handleSelectHistory(match)}
                      >
                        <Search className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{match}</span>
                      </button>
                    ))}

                {/* SEARCH RESULTS */}
                {results.length > 0 &&
                  displayedResults.map((p, i) => {
                    const fav = isFavorite(p.id);
                    const matches = (p as any).__matches ?? [];

                    return (
                      <div
                        key={p.id}
                        onClick={() => onAddToCart(p.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          selectedIndex === i
                            ? "bg-yellow-50 dark:bg-yellow-900/20"
                            : ""
                        }`}
                      >
                        <div className="flex-1 text-left">
                          <p className="font-medium truncate">
                            {renderHighlighted(p, matches)}
                          </p>
                          <p className="text-xs text-slate-400">
                            SKU: {p.sku} • ₹{p.price}
                          </p>
                        </div>

                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(p.id);
                          }}
                          className={`px-2 py-1 rounded text-sm border cursor-pointer select-none ${
                            fav
                              ? "text-red-500 border-red-300"
                              : "text-slate-500"
                          }`}
                          role="button"
                        >
                          ❤
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
