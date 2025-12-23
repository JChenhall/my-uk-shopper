/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/StorePlanningView.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Info,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Search,
  Camera,
} from "lucide-react";
import { db } from "../lib/db";
import { ManualProductModal } from "./ManualProductModal";

interface StorePlanningProps {
  storeName: string;
  onComplete: () => void;
  onBack: () => void;
}

export const StorePlanningView = ({
  storeName,
  onComplete,
  onBack,
}: StorePlanningProps) => {
  const [view, setView] = useState<"saved" | "all">("saved");
  const [selectedBarcodes, setSelectedBarcodes] = useState<Set<string>>(
    new Set()
  );
  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [loadingApi, setLoadingApi] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const savedItems = useLiveQuery(async () => {
    const saved = await db.savedItems
      .where("storeName")
      .equals(storeName)
      .toArray();
    return await Promise.all(
      saved.map(async (s) => {
        const product = await db.products
          .where("barcode")
          .equals(s.barcode)
          .first();
        if (!product) return null;
        const price = await db.prices
          .where({ barcode: s.barcode, store: storeName })
          .reverse()
          .first();
        return {
          ...product,
          lastPrice: price?.price,
          lastDate: price?.date,
          location: price?.location,
        };
      })
    ).then((items) => items.filter((item) => item !== null));
  }, [storeName]);

  // Fetch products from API based on search query
  const fetchProducts = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setApiProducts([]);
        return;
      }

      setLoadingApi(true);

      // Check cache first (cache for 24 hours)
      const cached = await db.cachedSearchResults
        .where("[storeName+searchQuery]")
        .equals([storeName, query.toLowerCase()])
        .first();

      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      if (cached && cached.cachedAt > oneDayAgo) {
        setApiProducts(cached.products);
        setLoadingApi(false);
        return;
      }

      try {
        const res = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?action=process&search_terms=${encodeURIComponent(
            query
          )}&tagtype_0=stores&tag_contains_0=contains&tag_0=${storeName}&tagtype_1=countries&tag_contains_1=contains&tag_1=United Kingdom&json=true&page_size=100`
        );
        const data = await res.json();
        const products = data.products || [];
        setApiProducts(products);

        // Cache the results
        await db.cachedSearchResults.put({
          storeName: storeName,
          searchQuery: query.toLowerCase(),
          products: products,
          cachedAt: Date.now(),
        });
      } catch (err) {
        console.error("Fetch failed", err);
        // Try to use cached data even if expired
        if (cached) {
          setApiProducts(cached.products);
        } else {
          setApiProducts([]);
        }
      } finally {
        setLoadingApi(false);
      }
    },
    [storeName]
  );

  // Handle search with countdown timer
  useEffect(() => {
    // Clear any existing timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Reset countdown
    setCountdown(null);

    // Only start countdown if we're in "all" view and have a search query
    if (view === "all" && searchQuery.length >= 2) {
      // Start countdown from 3
      setCountdown(3);
      let count = 3;

      countdownIntervalRef.current = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
        }
      }, 1000);

      // Set timeout to fetch after 3 seconds
      searchTimeoutRef.current = setTimeout(() => {
        fetchProducts(searchQuery);
        setCountdown(null);
      }, 3000);
    } else if (view === "all" && searchQuery.length < 2) {
      setApiProducts([]);
    }

    // Cleanup on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [searchQuery, view, fetchProducts]);

  // Move fetch logic to a dedicated function (Event Handler approach)
  const switchToAllView = () => {
    setView("all");
    // Clear search and products when switching to "all" view
    if (searchQuery.length === 0) {
      setApiProducts([]);
    }
  };

  const toggleSelection = (barcode: string) => {
    const next = new Set(selectedBarcodes);
    if (next.has(barcode)) next.delete(barcode);
    else next.add(barcode);
    setSelectedBarcodes(next);
  };

  const saveToCatalog = async (p: any) => {
    // Check if product already exists
    const existing = await db.products.where("barcode").equals(p.code).first();

    if (existing) {
      // Update existing product, keeping the ID
      await db.products.update(existing.id!, {
        name: p.product_name || existing.name,
        brand: p.brands || existing.brand,
        image: p.image_small_url || existing.image,
        potentialStores: Array.from(
          new Set([...(existing.potentialStores || []), storeName])
        ),
      });
    } else {
      // Add new product
      await db.products.add({
        barcode: p.code,
        name: p.product_name || "Unknown",
        brand: p.brands || "Generic",
        image: p.image_small_url || "",
        category: "General",
        potentialStores: [storeName],
      });
    }

    // Add to saved items for this store
    const exists = await db.savedItems
      .where("[barcode+storeName]")
      .equals([p.code, storeName])
      .first();

    if (!exists) {
      await db.savedItems.add({
        barcode: p.code,
        storeName: storeName,
        savedAt: Date.now(),
      });
    }
  };

  const removeFromCatalog = async (barcode: string) => {
    await db.savedItems
      .where("[barcode+storeName]")
      .equals([barcode, storeName])
      .delete();
  };

  const generateList = async () => {
    const listId = await db.lists.add({
      name: `${storeName} Shop`,
      storeName: storeName,
      createdAt: Date.now(),
      estimatedTotal: totalEstimate,
    });
    for (const barcode of selectedBarcodes) {
      await db.shoppingList.add({ listId, barcode, qty: 1, done: false });
    }
    onComplete();
  };

  const totalEstimate =
    savedItems?.reduce((acc, item) => {
      if (selectedBarcodes.has(item.barcode) && item.lastPrice)
        return acc + item.lastPrice;
      return acc;
    }, 0) || 0;

  // Filter items based on search query
  const filteredSavedItems = savedItems?.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.brand?.toLowerCase().includes(query)
    );
  });

  const filteredApiProducts = apiProducts.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.product_name?.toLowerCase().includes(query) ||
      p.brands?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#F8F9FF] pb-40">
      <div className="sticky top-0 z-40 bg-[#F8F9FF]/80 backdrop-blur-md p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 font-bold mb-4"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="bg-white p-6 rounded-[32px] shadow-cartoon border-2 border-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800">{storeName}</h2>
            <p className="text-sm font-bold text-brand-primary">
              Est. Total: £{totalEstimate.toFixed(2)}
            </p>
          </div>
          <button
            disabled={selectedBarcodes.size === 0}
            onClick={generateList}
            className="bg-brand-primary text-white px-6 py-4 rounded-2xl font-bold shadow-xl disabled:opacity-30 transition-opacity"
          >
            Generate List ({selectedBarcodes.size})
          </button>
        </div>

        <div className="flex gap-2 mt-6 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setView("saved")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
              view === "saved"
                ? "bg-white shadow-sm text-slate-800"
                : "text-slate-400"
            }`}
          >
            My Saved Items
          </button>
          <button
            onClick={switchToAllView}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
              view === "all"
                ? "bg-white shadow-sm text-slate-800"
                : "text-slate-400"
            }`}
          >
            All {storeName}
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder={
              view === "all"
                ? "Search for products (e.g. beans, heinz)..."
                : "Search by name or brand..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-24 py-3 bg-white rounded-2xl border-2 border-white shadow-cartoon font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-brand-primary transition-colors"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <AnimatePresence mode="wait">
              {view === "all" && countdown !== null && countdown > 0 && (
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500"
                >
                  <span>Searching in</span>
                  <span className="flex items-center justify-center w-6 h-6 bg-brand-primary/10 text-brand-primary rounded-full">
                    {countdown}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {searchQuery && !countdown && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Manual Product Entry Button */}
        {view === "saved" && (
          <button
            onClick={() => setShowManualModal(true)}
            className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-2xl font-bold shadow-cartoon hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Camera size={20} />
            Add Product Manually
          </button>
        )}

        {/* Info message for "All" view */}
        {view === "all" && searchQuery.length < 2 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 font-medium text-center">
              💡 Type at least 2 characters to search Open Food Facts
            </p>
          </div>
        )}
      </div>

      <div className="px-6 grid grid-cols-2 gap-4">
        {view === "saved" ? (
          filteredSavedItems && filteredSavedItems.length > 0 ? (
            filteredSavedItems.map((item) => (
              <ProductGridItem
                key={item.barcode}
                item={item}
                isSelected={selectedBarcodes.has(item.barcode)}
                onToggle={() => toggleSelection(item.barcode)}
                onRemove={() => removeFromCatalog(item.barcode)}
                isSavedView
              />
            ))
          ) : (
            <div className="col-span-2 py-20 text-center">
              <p className="text-slate-400 font-bold">
                {searchQuery
                  ? "No items match your search"
                  : "No saved items yet"}
              </p>
            </div>
          )
        ) : loadingApi ? (
          <div className="col-span-2 py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-brand-primary" size={32} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Searching Open Food Facts...
            </p>
          </div>
        ) : searchQuery.length < 2 ? (
          <div className="col-span-2 py-20 text-center">
            <Search className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="text-slate-400 font-bold">
              Search for products to get started
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Try "beans", "heinz", "flour", etc.
            </p>
          </div>
        ) : filteredApiProducts.length > 0 ? (
          filteredApiProducts.map((p) => (
            <ProductGridItem
              key={p.code}
              item={{
                barcode: p.code,
                name: p.product_name,
                image: p.image_small_url,
                brand: p.brands,
              }}
              isSelected={false}
              onToggle={() => {}}
              onSave={() => saveToCatalog(p)}
              isSavedView={false}
            />
          ))
        ) : (
          <div className="col-span-2 py-20 text-center">
            <p className="text-slate-400 font-bold">
              No items found for "{searchQuery}"
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Try a different search term
            </p>
          </div>
        )}
      </div>

      {view === "all" && (
        <div className="p-6 mt-4 flex items-start gap-2 bg-amber-50 rounded-2xl mx-6 border border-amber-100">
          <Info size={20} className="text-amber-500 shrink-0" />
          <p className="text-[10px] text-amber-700 font-medium">
            Note: "All Items" data comes from Open Food Facts and may not
            perfectly reflect current in-store stock.
          </p>
        </div>
      )}

      {/* Manual Product Modal */}
      {showManualModal && (
        <ManualProductModal
          storeName={storeName}
          onClose={() => setShowManualModal(false)}
          onAdded={() => {
            // Refresh saved items by re-querying (Dexie reactive)
            setShowManualModal(false);
          }}
        />
      )}
    </div>
  );
};

const ProductGridItem = ({
  item,
  isSelected,
  onToggle,
  onSave,
  onRemove,
  isSavedView,
}: any) => (
  <motion.div
    whileTap={{ scale: 0.95 }}
    onClick={isSavedView ? onToggle : undefined}
    className={`relative bg-white p-4 rounded-[24px] transition-all duration-300 shadow-cartoon ${
      isSavedView
        ? isSelected
          ? "border-4 border-brand-primary ring-4 ring-brand-primary/20 brightness-110 scale-[1.02] cursor-pointer"
          : "border-4 border-transparent opacity-50 brightness-75 grayscale cursor-pointer"
        : "border-2 border-white hover:shadow-xl"
    }`}
  >
    <img
      src={item.image || "https://illustrations.popsy.co/violet/box.svg"}
      className="w-full h-28 object-contain mb-3"
      alt=""
    />
    <h3 className="font-bold text-[11px] leading-tight h-8 line-clamp-2 text-slate-800">
      {item.name || "Unknown Item"}
    </h3>

    <div className="mt-3 flex justify-between items-center">
      <div>
        <div className="text-sm font-black text-slate-900">
          {item.lastPrice ? `£${item.lastPrice.toFixed(2)}` : "No Price"}
        </div>
        {item.lastDate && (
          <div className="text-[9px] text-slate-400 font-medium">
            {new Date(item.lastDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
            {item.location && ` • ${item.location}`}
          </div>
        )}
      </div>
      {isSavedView ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className="p-1.5 text-brand-primary bg-brand-primary/10 hover:bg-brand-primary hover:text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
        </button>
      )}
    </div>
    {isSelected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -top-2 -right-2 bg-brand-primary text-white p-2 rounded-full shadow-lg"
      >
        <Check size={16} strokeWidth={3} />
      </motion.div>
    )}
  </motion.div>
);
