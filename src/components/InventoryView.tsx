import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { db } from "../lib/db";
import { ProductDetailModal } from "./ProductDetailModal";

export const InventoryView = () => {
  const allProducts = useLiveQuery(() => db.products.toArray());
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Deduplicate products by barcode, keeping the most recent one
  const deduplicatedProducts = React.useMemo(() => {
    if (!allProducts) return [];
    const uniqueMap = new Map();
    allProducts.forEach((product) => {
      if (
        !uniqueMap.has(product.barcode) ||
        (product.id &&
          (!uniqueMap.get(product.barcode).id ||
            product.id > uniqueMap.get(product.barcode).id))
      ) {
        uniqueMap.set(product.barcode, product);
      }
    });
    return Array.from(uniqueMap.values());
  }, [allProducts]);

  // Filter products based on search query
  const products = React.useMemo(() => {
    if (!searchQuery) return deduplicatedProducts;
    const query = searchQuery.toLowerCase();
    return deduplicatedProducts.filter(
      (product) =>
        product.name?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.potentialStores?.some((store: string) =>
          store.toLowerCase().includes(query)
        )
    );
  }, [deduplicatedProducts, searchQuery]);

  // Cleanup duplicate products
  const cleanupDuplicates = async () => {
    if (!allProducts) return;
    const barcodeMap = new Map<string, number[]>();

    // Group IDs by barcode
    allProducts.forEach((product) => {
      if (!barcodeMap.has(product.barcode)) {
        barcodeMap.set(product.barcode, []);
      }
      if (product.id) {
        barcodeMap.get(product.barcode)!.push(product.id);
      }
    });

    // Delete duplicates, keeping the highest ID (most recent)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_barcode, ids] of barcodeMap) {
      if (ids.length > 1) {
        ids.sort((a, b) => b - a); // Sort descending
        const toDelete = ids.slice(1); // Keep first (highest), delete rest
        await db.products.bulkDelete(toDelete);
      }
    }
  };

  React.useEffect(() => {
    if (allProducts && allProducts.length > deduplicatedProducts.length) {
      cleanupDuplicates();
    }
  }, [allProducts, deduplicatedProducts.length]);

  const addToShoppingList = async (barcode: string) => {
    const list = await db.lists.toCollection().first();
    const listId = list?.id || 1;

    const exists = await db.shoppingList
      .where("[listId+barcode]")
      .equals([listId, barcode])
      .first();

    if (!exists) {
      await db.shoppingList.add({
        listId,
        barcode,
        qty: 1,
        done: false,
      });
      alert("Added to your shopping list!");
    } else {
      alert("Item is already on your list.");
    }
  };

  if (!products) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800">Master Catalog</h2>
        <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-xs font-bold">
          {products.length} Items
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by name, brand, or store..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-3 bg-white rounded-2xl border-2 border-white shadow-cartoon font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-brand-primary transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-lg"
          >
            ✕
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="bg-white p-10 rounded-[32px] shadow-cartoon border-2 border-white text-center">
          <img
            src="https://illustrations.popsy.co/violet/falling.svg"
            className="w-32 mx-auto mb-4"
            alt="empty"
          />
          <p className="text-slate-400 font-bold">
            {searchQuery
              ? "No items match your search"
              : "Your catalog is empty!"}
          </p>
          <p className="text-xs text-slate-300 mt-1">
            {searchQuery
              ? "Try a different search term"
              : "Scan your first product to begin."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {products.map((product) => (
            <motion.div
              key={product.barcode}
              whileTap={{ scale: 0.98 }}
              className="bg-white p-4 rounded-2xl shadow-cartoon border-2 border-white flex items-center gap-4 cursor-pointer"
              onClick={() => setSelectedBarcode(product.barcode)}
            >
              <img
                src={
                  product.image ||
                  "https://illustrations.popsy.co/violet/box.svg"
                }
                className="w-14 h-14 object-contain rounded-lg bg-slate-50"
                alt={product.name}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-sm leading-tight">
                  {product.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                  {product.brand}
                </p>
                {product.potentialStores &&
                  product.potentialStores.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.potentialStores.map((store: string) => (
                        <span
                          key={store}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-bold"
                        >
                          {store}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToShoppingList(product.barcode);
                }}
                className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white transition-colors flex-shrink-0"
              >
                <Plus size={20} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedBarcode && (
          <ProductDetailModal
            barcode={selectedBarcode}
            onClose={() => setSelectedBarcode(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
