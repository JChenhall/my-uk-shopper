// src/components/ManualProductModal.tsx
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Loader2, Check } from "lucide-react";
import { db } from "../lib/db";
import { CATEGORIES, type CategoryName } from "../lib/categories";

interface ManualProductModalProps {
  storeName: string;
  onClose: () => void;
  onAdded: () => void;
}

export const ManualProductModal = ({
  storeName,
  onClose,
  onAdded,
}: ManualProductModalProps) => {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<CategoryName>("Other");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      // Generate a unique barcode for manual entries
      const manualBarcode = `MANUAL-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Add to products table
      await db.products.add({
        barcode: manualBarcode,
        name: name.trim(),
        brand: brand.trim() || "Unknown",
        image: image || "https://via.placeholder.com/150?text=No+Image",
        category: category,
        potentialStores: [storeName],
      });

      // Add to saved items for this store
      await db.savedItems.add({
        barcode: manualBarcode,
        storeName,
        savedAt: Date.now(),
        category: category,
      });

      // Add price if provided
      if (price && parseFloat(price) > 0) {
        await db.prices.add({
          barcode: manualBarcode,
          store: storeName,
          price: parseFloat(price),
          date: Date.now(),
        });
      }

      onAdded();
      onClose();
    } catch (error) {
      console.error("Error saving manual product:", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-white to-slate-50 rounded-t-[32px] sm:rounded-[32px] shadow-cartoon border-2 border-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-br from-white to-slate-50 px-6 py-4 border-b-2 border-slate-100 flex justify-between items-center rounded-t-[32px]">
            <h3 className="text-xl font-black text-slate-800">
              Add Manual Product
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} className="text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Image Capture */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Product Photo
              </label>
              <div className="flex flex-col items-center gap-4">
                {image ? (
                  <div className="relative">
                    <img
                      src={image}
                      alt="Product"
                      className="w-32 h-32 object-cover rounded-2xl border-2 border-slate-200"
                    />
                    <button
                      onClick={() => setImage("")}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-brand-primary hover:bg-brand-primary/5 transition-colors"
                  >
                    <Camera size={32} className="text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">
                      Take Photo
                    </span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageCapture}
                  className="hidden"
                />
              </div>
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Organic Bananas"
                className="w-full px-4 py-3 bg-white rounded-2xl border-2 border-slate-200 font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-brand-primary transition-colors"
              />
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Brand (Optional)
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Tesco Finest"
                className="w-full px-4 py-3 bg-white rounded-2xl border-2 border-slate-200 font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-brand-primary transition-colors"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all ${
                      category === cat.name
                        ? `${cat.color} border-2 border-brand-primary`
                        : "bg-slate-50 border-2 border-slate-100"
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-xs">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Price (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                  £
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 bg-white rounded-2xl border-2 border-slate-200 font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            {/* Store Info */}
            <div className="bg-brand-primary/10 p-4 rounded-2xl">
              <p className="text-sm text-slate-600">
                <span className="font-bold">Store:</span>{" "}
                <span className="text-brand-primary font-bold">
                  {storeName}
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                This product will be added to your {storeName} saved items.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gradient-to-br from-white to-slate-50 px-6 py-4 border-t-2 border-slate-100 flex gap-3 rounded-b-[32px]">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-2xl font-bold shadow-cartoon hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Add Product
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
