// src/components/StoreView.tsx
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const UK_STORES = [
  { name: "Tesco", color: "bg-brand-tesco", logo: "T" },
  { name: "Aldi", color: "bg-brand-aldi", logo: "A" },
  { name: "Sainsburys", color: "bg-brand-sainsburys", logo: "S" },
  { name: "Lidl", color: "bg-brand-lidl", logo: "L" },
  { name: "Asda", color: "bg-brand-asda", logo: "A" },
  { name: "Morrisons", color: "bg-brand-morrisons", logo: "M" },
  { name: "Waitrose", color: "bg-emerald-600", logo: "W" },
  { name: "M&S", color: "bg-slate-800", logo: "M&S" },
];

interface StoreViewProps {
  onSelectStore: (name: string) => void;
}

export const StoreView = ({ onSelectStore }: StoreViewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 pb-8"
    >
      <h2 className="text-2xl font-black text-slate-800 mb-6">Supermarkets</h2>
      <div className="grid grid-cols-1 gap-3 pb-8">
        {UK_STORES.map((store) => (
          <motion.button
            key={store.name}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectStore(store.name)}
            className="bg-white p-4 rounded-2xl shadow-cartoon border-2 border-white flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 ${store.color} rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg`}
              >
                {store.logo}
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800">{store.name}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Plan your shop here
                </p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-brand-primary transition-colors" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
