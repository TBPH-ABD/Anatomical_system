/** Every locale must supply the same key set as the English source, with plain
 * strings in place of its literal types. A missing or extra key fails `tsc`. */
export type Translation<T> = {
  [K in keyof T]: T[K] extends string ? string : Translation<T[K]>;
};

export type Locale = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';
