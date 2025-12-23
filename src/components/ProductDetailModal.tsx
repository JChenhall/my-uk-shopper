import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { X, TrendingDown, Calendar } from "lucide-react";
import { db } from "../lib/db";

interface Props {
  barcode: string;
  onClose: () => void;
}

export const ProductDetailModal = ({ barcode, onClose }: Props) => {
  const product = useLiveQuery(() =>
    db.products.where("barcode").equals(barcode).first()
  );
  const prices = useLiveQuery(() =>
    db.prices.where("barcode").equals(barcode).sortBy("price")
  );

  if (!product) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <img
              src={product.image}
              className="w-20 h-20 object-contain bg-slate-50 rounded-2xl p-2"
              alt=""
            />
            <div>
              <h2 className="text-xl font-black text-slate-800">
                {product.name}
              </h2>
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                {product.brand}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
          <TrendingDown className="text-green-500" size={20} /> Price Comparison
        </h3>

        <div className="space-y-3 mb-8">
          {prices && prices.length > 0 ? (
            prices.map((entry, idx) => (
              <div
                key={idx}
                className={`flex justify-between items-center p-4 rounded-2xl border-2 ${
                  idx === 0
                    ? "border-green-200 bg-green-50"
                    : "border-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      idx === 0 ? "bg-green-500" : "bg-slate-300"
                    }`}
                  />
                  <span className="font-bold text-slate-700">
                    {entry.store}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-900 text-lg">
                    £{entry.price.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar size={10} />{" "}
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-4 italic">
              No price history yet.
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg"
        >
          Close Details
        </button>
      </motion.div>
    </motion.div>
  );
};
