import { useState } from "react";
import { motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { db } from "../lib/db";

export const CreateListModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!name) return;
    await db.lists.add({ name, storeName: "General", createdAt: Date.now() });
    setName("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black">New List</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        <input
          autoFocus
          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-6 outline-none focus:border-brand-primary font-bold"
          placeholder="e.g. Sunday Roast..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={handleCreate}
          className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
        >
          <Sparkles size={20} /> Create List
        </button>
      </motion.div>
    </motion.div>
  );
};
