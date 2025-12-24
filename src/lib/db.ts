/* eslint-disable @typescript-eslint/no-explicit-any */
//src/lib/db.ts
import Dexie, { type Table } from "dexie";
export interface Product {
  id?: number;
  barcode: string;
  name: string;
  brand: string;
  image: string;
  category: string;
  potentialStores: string[];
}
export interface PriceEntry {
  id?: number;
  barcode: string;
  store: string;
  price: number;
  date: number;
  location?: string;
}
export interface ShoppingList {
  id?: number;
  name: string;
  storeName: string;
  createdAt: number;
  completedAt?: number;
  estimatedTotal?: number;
}
export interface ShoppingListItem {
  id?: number;
  listId: number;
  barcode: string;
  qty: number;
  done: boolean;
}
export interface SavedItem {
  id?: number;
  barcode: string;
  storeName: string;
  savedAt: number;
  category?: string;
}
export interface CachedSearchResult {
  id?: number;
  storeName: string;
  searchQuery: string;
  products: any[];
  cachedAt: number;
}
export class ShopSmartDB extends Dexie {
  products!: Table<Product>;
  prices!: Table<PriceEntry>;
  lists!: Table<ShoppingList>;
  shoppingList!: Table<ShoppingListItem>;
  savedItems!: Table<SavedItem>;
  cachedSearchResults!: Table<CachedSearchResult>;
  constructor() {
    super("ShopSmartDB");
    // Version 3 - original schema
    this.version(3).stores({
      products: "++id, barcode, name, *potentialStores",
      prices: "++id, barcode, store, [barcode+store]",
      lists: "++id, name",
      shoppingList: "++id, listId, barcode, done, [listId+barcode]",
    });
    // Version 4 - add savedItems table and update lists schema
    this.version(4)
      .stores({
        products: "++id, barcode, name, *potentialStores",
        prices: "++id, barcode, store, [barcode+store]",
        lists: "++id, name, storeName, completedAt, createdAt",
        shoppingList: "++id, listId, barcode, done, [listId+barcode]",
        savedItems: "++id, [barcode+storeName], storeName",
      })
      .upgrade((tx) => {
        // Migrate existing lists to add storeName field
        return tx
          .table("lists")
          .toCollection()
          .modify((list) => {
            if (!list.storeName) {
              list.storeName = "General";
            }
          });
      });
    // Version 5 - add cached search results
    this.version(5).stores({
      products: "++id, barcode, name, *potentialStores",
      prices: "++id, barcode, store, [barcode+store]",
      lists: "++id, name, storeName, completedAt, createdAt",
      shoppingList: "++id, listId, barcode, done, [listId+barcode]",
      savedItems: "++id, [barcode+storeName], storeName",
      cachedSearchResults: "++id, [storeName+searchQuery], storeName, cachedAt",
    });
    
    // Version 6 - add category to savedItems
    this.version(6).stores({
      products: "++id, barcode, name, *potentialStores",
      prices: "++id, barcode, store, [barcode+store]",
      lists: "++id, name, storeName, completedAt, createdAt",
      shoppingList: "++id, listId, barcode, done, [listId+barcode]",
      savedItems: "++id, [barcode+storeName], storeName, category",
      cachedSearchResults: "++id, [storeName+searchQuery], storeName, cachedAt",
    });
  }
}
export const db = new ShopSmartDB();
