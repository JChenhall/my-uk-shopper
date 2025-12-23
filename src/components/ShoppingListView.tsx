import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { db } from "../lib/db";

export const ShoppingListView = () => {
  // Join logic: Get shopping list items and their product details
  const listItems = useLiveQuery(async () => {
    const items = await db.shoppingList.toArray();
    const detailedItems = await Promise.all(
      items.map(async (item) => {
        const product = await db.products
          .where("barcode")
          .equals(item.barcode)
          .first();
        return { ...item, product };
      })
    );
    return detailedItems;
  });

  const toggleDone = async (id: number, currentStatus: boolean) => {
    await db.shoppingList.update(id, { done: !currentStatus });
  };

  const removeItem = async (id: number) => {
    await db.shoppingList.delete(id);
  };

  if (!listItems) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-black text-slate-800">Current Shop</h2>

      {listItems.length === 0 ? (
        <div className="bg-white p-10 rounded-[32px] shadow-cartoon border-2 border-white text-center">
          <img
            src="https://illustrations.popsy.co/violet/shopping-bag.svg"
            className="w-40 mx-auto mb-4"
            alt="empty"
          />
          <p className="text-slate-400 font-bold">
            Your shopping bag is empty!
          </p>
          <p className="text-xs text-slate-300 mt-2">
            Add items from your catalog.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {listItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                  item.done
                    ? "bg-slate-50 border-transparent opacity-60"
                    : "bg-white border-white shadow-cartoon"
                }`}
              >
                <button
                  onClick={() => item.id && toggleDone(item.id, item.done)}
                >
                  {item.done ? (
                    <CheckCircle2 className="text-green-500" size={28} />
                  ) : (
                    <Circle className="text-slate-200" size={28} />
                  )}
                </button>

                <div className="flex-1">
                  <h3
                    className={`font-bold text-sm ${
                      item.done
                        ? "line-through text-slate-400"
                        : "text-slate-800"
                    }`}
                  >
                    {item.product?.name || "Unknown Product"}
                  </h3>
                  <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">
                    {item.product?.brand}
                  </p>
                </div>

                <button
                  onClick={() => item.id && removeItem(item.id)}
                  className="text-slate-300 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
