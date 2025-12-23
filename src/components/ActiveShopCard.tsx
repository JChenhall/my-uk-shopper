/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/ActiveShopCard.tsx
import { motion } from "framer-motion";
import { Check, ScanBarcode } from "lucide-react";

interface ActiveShopCardProps {
  listName: string;
  items: any[];
  onToggle: (id: number, done: boolean) => void;
  onScan: (barcode: string) => void;
}

export const ActiveShopCard = ({
  listName,
  items,
  onToggle,
  onScan,
}: ActiveShopCardProps) => {
  const completedCount = items.filter((item) => item.done).length;
  const totalCount = items.length;

  return (
    <motion.div
      initial={{ rotate: -1, y: 10 }}
      animate={{ rotate: 1, y: 0 }}
      className="relative bg-[#FFFBEB] p-8 rounded-sm shadow-2xl border-l-[12px] border-red-400 min-h-[450px] overflow-hidden"
    >
      {/* Paper Lines */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#000 1px, transparent 1px)",
          backgroundSize: "100% 2.5rem",
          marginTop: "4rem",
        }}
      />

      <div className="relative z-10">
        <h2 className="font-['Gochi_Hand'] text-4xl text-slate-700 mb-2 border-b-2 border-slate-200 pb-4">
          {listName}
        </h2>

        {totalCount > 0 && (
          <p className="font-['Gochi_Hand'] text-lg text-slate-500 mb-6">
            {completedCount} of {totalCount} items collected
          </p>
        )}
      </div>

      <div className="space-y-6 relative z-10">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-4 group">
            <button
              onClick={() => onToggle(item.id, item.done)}
              className={`mt-1 w-7 h-7 rounded-md border-3 border-slate-400 flex items-center justify-center transition-all flex-shrink-0 ${
                item.done
                  ? "bg-green-500 border-green-600 rotate-12"
                  : "bg-white hover:border-slate-600"
              }`}
            >
              {item.done && (
                <Check size={18} className="text-white" strokeWidth={3} />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <span
                className={`block font-['Gochi_Hand'] text-2xl text-slate-700 leading-tight ${
                  item.done ? "line-through opacity-40" : ""
                }`}
              >
                {item.product?.name || "Unknown item"}
              </span>
              {item.product?.brand && (
                <span className="font-['Gochi_Hand'] text-sm text-slate-400 block mt-0.5">
                  {item.product.brand}
                </span>
              )}
            </div>

            {!item.done && (
              <button
                onClick={() => onScan(item.barcode)}
                className="p-2 text-slate-300 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors flex-shrink-0"
              >
                <ScanBarcode size={22} />
              </button>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-20 opacity-20">
          <img
            src="https://illustrations.popsy.co/violet/paper-plane.svg"
            className="w-32 mb-4"
            alt=""
          />
          <p className="font-['Gochi_Hand'] text-3xl text-slate-400">
            List is empty...
          </p>
        </div>
      )}

      {/* Decorative Tape */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/40 backdrop-blur-sm rotate-2 shadow-sm" />
    </motion.div>
  );
};
