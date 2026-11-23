import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Basket = Record<string, number>;
const KEY = 'waffir.basket';

export function useBasket() {
  const [basket, setBasket] = useState<Basket>({});
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => v && setBasket(JSON.parse(v))).catch(() => {});
  }, []);
  const save = (b: Basket) => {
    setBasket(b);
    AsyncStorage.setItem(KEY, JSON.stringify(b)).catch(() => {});
  };
  const setQty = useCallback((id: string, qty: number) => {
    setBasket((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id]; else next[id] = qty;
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);
  return { basket, setQty, clear: () => save({}) };
}
