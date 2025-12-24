// src/components/ScannerModal.tsx
import { useEffect, useState, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { motion } from "framer-motion";
import { X, Package, AlertCircle } from "lucide-react";
import { db } from "../lib/db";
import { mapApiToStores } from "../lib/storeUtils";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OFFProduct {
  code: string;
  product_name?: string;
  brands?: string;
  image_small_url?: string;
  categories?: string;
  stores?: string;
}

const STORES = [
  { name: "Tesco", color: "bg-brand-tesco" },
  { name: "Aldi", color: "bg-brand-aldi" },
  { name: "Sainsburys", color: "bg-brand-sainsburys" },
  { name: "Lidl", color: "bg-brand-lidl" },
  { name: "Asda", color: "bg-brand-asda" },
  { name: "Morrisons", color: "bg-brand-morrisons" },
];

export const ScannerModal = ({ isOpen, onClose }: ScannerModalProps) => {
  const [scannedProduct, setScannedProduct] = useState<OFFProduct | null>(null);
  const [price, setPrice] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<string>("Tesco");
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchProductInfo = useCallback(async (barcode: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
        {
          headers: {
            "User-Agent": "B-List-UK-Shopping-App - Version 1.0",
          },
        }
      );
      const data = await res.json();

      if (data.status === 1 && data.product) {
        setScannedProduct(data.product);
      } else {
        setScannedProduct({
          product_name: "",
          brands: "",
          code: barcode,
        });
      }
    } catch {
      setScannedProduct({
        product_name: "Offline Mode",
        code: barcode,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && isScanning) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
          videoConstraints: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        false
      );

      scanner.render(
        async (decodedText: string) => {
          try {
            await scanner.clear();
            setIsScanning(false);
            fetchProductInfo(decodedText);
          } catch (err) {
            console.error(err);
          }
        },
        () => {}
      );

      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [isOpen, isScanning, fetchProductInfo]);

  const handleSave = async () => {
    if (!scannedProduct || !price) return;

    const potentialStores = mapApiToStores(
      scannedProduct.stores,
      scannedProduct.brands
    );

    await db.products.put({
      barcode: scannedProduct.code,
      name: scannedProduct.product_name || "Unknown Product",
      brand: scannedProduct.brands || "Generic",
      image: scannedProduct.image_small_url || "",
      category: scannedProduct.categories?.split(",")[0] || "Grocery",
      potentialStores: potentialStores,
    });

    await db.prices.add({
      barcode: scannedProduct.code,
      store: selectedStore,
      price: parseFloat(price),
      date: Date.now(),
    });

    let list = await db.lists.toCollection().first();
    if (!list) {
      const id = await db.lists.add({
        name: "My First Shop",
        storeName: "General",
        createdAt: Date.now(),
      });
      list = {
        id,
        name: "My First Shop",
        storeName: "General",
        createdAt: Date.now(),
      };
    }

    const listId = list.id!;
    const alreadyOnList = await db.shoppingList
      .where("[listId+barcode]")
      .equals([listId, scannedProduct.code])
      .first();

    if (!alreadyOnList) {
      await db.shoppingList.add({
        listId,
        barcode: scannedProduct.code,
        qty: 1,
        done: false,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      className="fixed inset-0 z-[100] bg-white flex flex-col"
    >
      <div className="p-6 flex justify-between items-center border-b">
        <h2 className="text-xl font-black text-slate-800">Scan Product</h2>
        <button
          onClick={onClose}
          className="p-2 bg-slate-100 rounded-full text-slate-500"
        >
          <X />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isScanning ? (
          <div className="rounded-[32px] overflow-hidden border-4 border-brand-primary shadow-xl bg-slate-50">
            <div id="reader" className="w-full"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {isLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="font-bold text-slate-400">
                  Searching UK Database...
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200">
                  <div className="flex items-center gap-4">
                    {scannedProduct?.image_small_url ? (
                      <img
                        src={scannedProduct.image_small_url}
                        className="w-20 h-20 object-contain rounded-lg"
                        alt=""
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Package className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        className="font-bold w-full bg-transparent border-b border-transparent focus:border-brand-primary outline-none text-slate-800"
                        value={scannedProduct?.product_name}
                        placeholder="Product Name"
                        onChange={(e) =>
                          setScannedProduct((prev) =>
                            prev
                              ? { ...prev, product_name: e.target.value }
                              : null
                          )
                        }
                      />
                      <input
                        className="text-sm text-slate-500 w-full bg-transparent border-b border-transparent focus:border-brand-primary outline-none"
                        value={scannedProduct?.brands}
                        placeholder="Brand (e.g. Tesco, Heinz)"
                        onChange={(e) =>
                          setScannedProduct((prev) =>
                            prev ? { ...prev, brands: e.target.value } : null
                          )
                        }
                      />
                    </div>
                  </div>
                  {!scannedProduct?.product_name && (
                    <div className="mt-3 flex items-center gap-2 text-amber-600 text-xs font-bold">
                      <AlertCircle size={14} /> Not found. Please enter
                      manually.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-700">
                    Price (£)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-4 text-2xl font-bold rounded-2xl border-2 border-slate-200 focus:border-brand-primary outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-700">
                    Store
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {STORES.map((store) => (
                      <button
                        key={store.name}
                        onClick={() => setSelectedStore(store.name)}
                        className={`p-3 rounded-xl font-bold text-sm transition-all ${
                          selectedStore === store.name
                            ? `${store.color} text-white shadow-lg scale-105`
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {store.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={!price || !scannedProduct?.product_name}
                  className="w-full bg-brand-primary text-white py-5 rounded-[24px] font-black text-lg shadow-cartoon disabled:opacity-50 active:scale-95 transition-transform"
                >
                  Save & Add to List
                </button>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
