/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, Plus, Check } from "lucide-react";
import { db } from "../lib/db";

const CATEGORIES = [
  { id: "dairy", name: "Dairy & Eggs", icon: "🥛" },
  { id: "breads", name: "Bakery", icon: "🍞" },
  { id: "fruits", name: "Fruit & Veg", icon: "🍎" },
  { id: "snacks", name: "Snacks & Crisps", icon: "🥨" },
  { id: "frozen-foods", name: "Frozen", icon: "🍦" },
  { id: "beverages", name: "Drinks", icon: "🥤" },
  { id: "ready-meals", name: "Ready Meals", icon: "🍱" },
  { id: "pantry", name: "Pantry", icon: "🥫" },
];

const UK_SUPERMARKETS = [
  "Tesco",
  "Aldi",
  "Sainsburys",
  "Lidl",
  "Asda",
  "Morrisons",
  "Waitrose",
  "MnS",
];

export const DiscoverView = () => {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedItems, setAddedItems] = useState<string[]>([]);

  const mapApiToStores = (
    apiStores: string = "",
    apiBrand: string = ""
  ): string[] => {
    const foundStores: string[] = [];
    const combinedData = (apiStores + " " + apiBrand).toLowerCase();

    UK_SUPERMARKETS.forEach((store) => {
      if (combinedData.includes(store.toLowerCase())) {
        foundStores.push(store);
      }
    });

    if (foundStores.length === 0 && apiBrand.length > 0) {
      return ["Tesco", "Sainsburys", "Asda", "Morrisons"];
    }

    return foundStores;
  };

  const fetchCategory = async (catId: string) => {
    setSelectedCat(catId);
    setLoading(true);
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=${catId}&tagtype_1=countries&tag_contains_1=contains&tag_1=United Kingdom&json=true&page_size=50`,
        { headers: { "User-Agent": "B-List-App - UK - Version 1.0" } }
      );
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addProductToCatalog = async (p: any) => {
    const potentialStores = mapApiToStores(p.stores, p.brands);

    await db.products.put({
      barcode: p.code,
      name: p.product_name || "Unknown",
      brand: p.brands || "Generic",
      image: p.image_small_url || "",
      category: selectedCat || "General",
      potentialStores: potentialStores,
    });

    setAddedItems((prev) => [...prev, p.code]);
  };

  return (
    <div className="space-y-6">
      {!selectedCat ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-black text-slate-800">Discover</h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => fetchCategory(cat.id)}
                className="bg-white p-6 rounded-[32px] shadow-cartoon border-2 border-white text-center active:scale-95 transition-transform"
              >
                <div className="text-4xl mb-2">{cat.icon}</div>
                <div className="font-bold text-slate-700 text-sm">
                  {cat.name}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <button
            onClick={() => setSelectedCat(null)}
            className="text-brand-primary font-bold flex items-center gap-2 mb-2"
          >
            <ChevronLeft size={20} /> Back
          </button>

          <h2 className="text-2xl font-black text-slate-800 capitalize">
            {selectedCat.replace("-", " ")}
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2
                className="animate-spin text-brand-primary mb-4"
                size={40}
              />
              <p className="font-bold text-slate-400">
                Fetching UK Products...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {products.map((p) => {
                const isAdded = addedItems.includes(p.code);
                const stores = mapApiToStores(p.stores, p.brands);

                return (
                  <div
                    key={p.code}
                    className="bg-white p-4 rounded-2xl shadow-cartoon border-2 border-white"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <img
                        src={
                          p.image_small_url ||
                          "https://illustrations.popsy.co/violet/box.svg"
                        }
                        className="w-12 h-12 object-contain bg-slate-50 rounded-lg"
                        alt=""
                      />
                      <div className="flex-1">
                        <div className="font-bold text-sm leading-tight">
                          {p.product_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          {p.brands}
                        </div>
                      </div>
                      <button
                        onClick={() => !isAdded && addProductToCatalog(p)}
                        className={`p-2 rounded-xl transition-colors ${
                          isAdded
                            ? "bg-green-500 text-white"
                            : "bg-brand-primary text-white"
                        }`}
                      >
                        {isAdded ? <Check size={20} /> : <Plus size={20} />}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {stores.map((s) => (
                        <span
                          key={s}
                          className="text-[8px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-tighter"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
