import {isActiveProduct} from './registry-public.mjs';
/** Shared deterministic order rules. No credentials or browser dependencies. */
export function compareProducts(a, b) {
  const av = Number.isInteger(a.sortOrder) ? a.sortOrder : Infinity;
  const bv = Number.isInteger(b.sortOrder) ? b.sortOrder : Infinity;
  if (av !== bv) return av < bv ? -1 : 1;
  const name = (a.name || '').localeCompare(b.name || '', 'en');
  return name || (a.slug || a.id || '').localeCompare(b.slug || b.id || '', 'en');
}
export function orderedProducts(products) {
  return products.filter(isActiveProduct).slice().sort(compareProducts);
}
export function movedOrder(ids, id, toIndex) {
  const result = ids.filter(value => value !== id);
  if (result.length === ids.length) throw new Error('Unknown card');
  result.splice(Math.max(0, Math.min(toIndex, result.length)), 0, id);
  return result;
}
export function orderPayload(products, ids) {
  if (new Set(ids).size !== products.length || ids.length !== products.length ||
      ids.some(id => !products.some(p => p.id === id))) throw new Error('Invalid card order');
  return {
    operation: 'reorder',
    data: {
      expected: products.map(p => ({ id: p.id, sortOrder: p.sortOrder ?? null })),
      order: ids,
    },
  };
}
