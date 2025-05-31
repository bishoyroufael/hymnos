// hooks/useGlobalLocalStorage.ts
import { useLocalStorage } from "usehooks-ts";

/**
 * A wrapper around use-hooks-ts's useLocalStorage that exposes
 * global getter/setter functions for adding and retrieving items.
 */

type LocalStorageHandler<T> = {
  value: T;
  set: (newValue: T) => void;
  get: () => T;
};

export function useGlobalLocalStorage<T>(
  key: string,
  initialValue: T,
): LocalStorageHandler<T> {
  const [value, setValue] = useLocalStorage<T>(key, initialValue);

  const get = () => value;
  const set = (newValue: T) => setValue(newValue);

  return {
    value,
    set,
    get,
  };
}
