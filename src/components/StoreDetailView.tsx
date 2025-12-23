// src/components/StoreDetailView.tsx
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, Plus } from "lucide-react";
import { db } from "../lib/db";

interface Props {
  storeName: string;
  onBack: () => void;
}

export const StoreDetailView = ({ storeName, onBack }: Props) => {
  // All data fetching and logic is encapsulated in the hook
  const inventory = useLiveQuery(async () => {
    const products = await db.products
      .where("potentialStores")
      .equals(storeName)
      .toArray();

    return await Promise.all(
      products.map(async (p) => {
        const priceEntry = await db.prices
          .where({ barcode: p.barcode, store: storeName })
          .reverse()
          .first();
        return { product: p, price: priceEntry?.price };
      })
    );
  }, [storeName]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <header className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 bg-white rounded-full shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800">{storeName}</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Store Inventory
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {inventory && inventory.length > 0 ? (
          inventory.map((item) => (
            <div
              key={item.product.barcode}
              className="bg-white p-4 rounded-2xl shadow-cartoon border-2 border-white flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    item.product.image ||
                    "https://illustrations.popsy.co/violet/box.svg"
                  }
                  className="w-12 h-12 object-contain"
                  alt=""
                />
                <div>
                  <div className="font-bold text-sm leading-tight">
                    {item.product.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-black uppercase">
                    {item.product.brand}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {item.price ? (
                  <div className="font-black text-brand-primary text-lg">
                    £{item.price.toFixed(2)}
                  </div>
                ) : (
                  <button className="flex items-center gap-1 text-[10px] font-black text-brand-primary bg-brand-primary/10 px-3 py-2 rounded-xl uppercase tracking-tighter">
                    <Plus size={12} /> Log Price
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-10 rounded-[32px] shadow-cartoon border-2 border-white text-center opacity-60">
            <ShoppingBag className="mx-auto mb-4 text-slate-200" size={48} />
            <p className="font-bold text-slate-400 text-sm">
              No items found for this store.
            </p>
            <p className="text-[10px] text-slate-300 mt-1">
              Add items via the Discover tab.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
