import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Home,
  ShoppingCart,
  Store,
  ScanBarcode,
  Check,
  Trash2,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { db } from "./lib/db";
import { ScannerModal } from "./components/ScannerModal";
import { StoreView } from "./components/StoreView";
import { InventoryView } from "./components/InventoryView";
import { ActiveShopCard } from "./components/ActiveShopCard";
import { StorePlanningView } from "./components/StorePlanningView";
import { InstallPrompt } from "./components/InstallPrompt";

interface NavButtonProps {
  Icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}

const NavButton = ({ Icon, active, onClick }: NavButtonProps) => (
  <button
    onClick={onClick}
    className={`p-3 transition-all rounded-2xl ${
      active ? "bg-brand-primary/10 text-brand-primary" : "text-slate-400"
    }`}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [planningStore, setPlanningStore] = useState<string | null>(null);

  const latestList = useLiveQuery(async () => {
    const list = await db.lists
      .orderBy("createdAt")
      .reverse()
      .filter((l) => !l.completedAt)
      .first();
    if (!list) return null;
    const items = await db.shoppingList
      .where("listId")
      .equals(list.id!)
      .toArray();
    const detailedItems = await Promise.all(
      items.map(async (item) => {
        const product = await db.products
          .where("barcode")
          .equals(item.barcode)
          .first();
        return { ...item, product };
      })
    );
    return { ...list, items: detailedItems };
  }, []);

  const pastLists = useLiveQuery(async () => {
    const lists = await db.lists
      .orderBy("completedAt")
      .reverse()
      .filter((l) => l.completedAt !== undefined)
      .limit(5)
      .toArray();
    return lists;
  }, []);

  const handleToggleItem = async (id: number, done: boolean) => {
    await db.shoppingList.update(id, { done: !done });
  };

  const handleCompleteList = async (listId: number) => {
    await db.lists.update(listId, { completedAt: Date.now() });
  };

  const handleReuseList = (listId: number) => {
    db.lists.get(listId).then((oldList) => {
      if (!oldList) return;

      db.lists
        .add({
          name: oldList.name,
          storeName: oldList.storeName,
          createdAt: Date.now(),
          estimatedTotal: oldList.estimatedTotal,
        })
        .then((newListId) => {
          db.shoppingList
            .where("listId")
            .equals(listId)
            .toArray()
            .then((oldItems) => {
              for (const item of oldItems) {
                db.shoppingList.add({
                  listId: newListId,
                  barcode: item.barcode,
                  qty: item.qty,
                  done: false,
                });
              }
              setActiveTab("home");
            });
        });
    });
  };

  const handleDeleteList = async (listId: number) => {
    // Delete all shopping list items associated with this list
    await db.shoppingList.where("listId").equals(listId).delete();
    // Delete the list itself
    await db.lists.delete(listId);
  };

  const handleShareList = async (listId: number) => {
    const list = await db.lists.get(listId);
    if (!list) return;

    const items = await db.shoppingList
      .where("listId")
      .equals(listId)
      .toArray();
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const product = await db.products
          .where("barcode")
          .equals(item.barcode)
          .first();
        return product
          ? `${product.name}${item.qty > 1 ? ` (x${item.qty})` : ""}`
          : "Unknown item";
      })
    );

    const shareText = `${list.name}\n\n${itemsWithDetails.join("\n")}${
      list.estimatedTotal
        ? `\n\nEstimated Total: £${list.estimatedTotal.toFixed(2)}`
        : ""
    }`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: list.name,
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareText);
      alert("Shopping list copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-[#F8F9FF]">
      <header className="p-6 flex justify-between items-center max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <ShoppingCart className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Family Shopping Tracker
          </h1>
        </div>
        <div className="w-12 h-12 bg-white rounded-full shadow-cartoon border-2 border-white flex items-center justify-center text-2xl">
          🥑
        </div>
      </header>

      <main className="px-6 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {latestList ? (
                <div className="space-y-4">
                  <ActiveShopCard
                    listName={latestList.name}
                    items={latestList.items}
                    onToggle={handleToggleItem}
                    onScan={() => setIsScannerOpen(true)}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleShareList(latestList.id!)}
                      className="flex-1 bg-blue-500 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                    >
                      <Share2 size={20} /> Share List
                    </button>
                    <button
                      onClick={() => handleCompleteList(latestList.id!)}
                      className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                    >
                      <Check size={20} /> Complete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-[32px] shadow-cartoon border-2 border-white text-center">
                  <img
                    src="https://illustrations.popsy.co/violet/shopping-bag.svg"
                    className="w-48 mx-auto mb-4"
                    alt=""
                  />
                  <h2 className="text-xl font-black mb-2">No active list</h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Start planning your supermarket shop
                  </p>
                  <button
                    onClick={() => setActiveTab("stores")}
                    className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg flex items-center gap-2 mx-auto hover:bg-brand-primary/90 transition-colors"
                  >
                    <Store size={20} /> Plan Your Next Shop
                  </button>
                </div>
              )}

              {latestList && (
                <button
                  onClick={() => setActiveTab("stores")}
                  className="w-full bg-white p-6 rounded-[32px] shadow-cartoon border-2 border-white flex items-center justify-between group active:scale-95 transition-transform"
                >
                  <div className="text-left">
                    <h3 className="font-black text-slate-800 text-lg">
                      Next Shop
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Plan your supermarket run
                    </p>
                  </div>
                  <div className="bg-brand-primary/10 p-4 rounded-2xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    <Store size={28} />
                  </div>
                </button>
              )}

              {pastLists && pastLists.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-slate-800">
                    Past Lists
                  </h3>
                  <div className="space-y-3">
                    {pastLists.map((list) => (
                      <div
                        key={list.id}
                        className="bg-white p-4 rounded-2xl shadow-cartoon border-2 border-white flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800">
                            {list.name}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium">
                            {new Date(list.completedAt!).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                            {list.estimatedTotal &&
                              ` • £${list.estimatedTotal.toFixed(2)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShareList(list.id!)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Share list"
                          >
                            <Share2 size={18} />
                          </button>
                          <button
                            onClick={() => handleReuseList(list.id!)}
                            className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-xl font-bold text-sm hover:bg-brand-primary hover:text-white transition-colors"
                          >
                            Reuse
                          </button>
                          <button
                            onClick={() => handleDeleteList(list.id!)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="Delete list"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "lists" && (
            <motion.div
              key="lists"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-2xl font-black text-slate-800 mb-6">
                My Saved Items
              </h2>
              <InventoryView />
            </motion.div>
          )}

          {activeTab === "stores" && (
            <motion.div
              key="stores"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <StoreView onSelectStore={(name) => setPlanningStore(name)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 p-6 pb-10 pointer-events-none">
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl border-2 border-white rounded-[32px] shadow-2xl flex justify-around items-center p-3 pointer-events-auto relative">
          <NavButton
            Icon={Home}
            active={activeTab === "home"}
            onClick={() => setActiveTab("home")}
          />
          <NavButton
            Icon={ShoppingCart}
            active={activeTab === "lists"}
            onClick={() => setActiveTab("lists")}
          />

          <div className="relative ">
            <motion.button
              onClick={() => setIsScannerOpen(true)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.9 }}
              className="bg-brand-primary p-4 rounded-full text-white shadow-2xl shadow-brand-primary/40 border-4 border-[#F8F9FF]"
            >
              <ScanBarcode size={28} strokeWidth={2.5} />
            </motion.button>
          </div>

          <NavButton
            Icon={Store}
            active={activeTab === "stores"}
            onClick={() => setActiveTab("stores")}
          />
        </div>
      </nav>

      <AnimatePresence>
        {isScannerOpen && (
          <ScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
          />
        )}
        {planningStore && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[150] bg-[#F8F9FF] overflow-y-auto"
          >
            <StorePlanningView
              storeName={planningStore}
              onComplete={() => {
                setPlanningStore(null);
                setActiveTab("home");
              }}
              onBack={() => setPlanningStore(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <InstallPrompt />
    </div>
  );
};

export default App;
