// A minimal stand-in for the Supabase JS query builder.
//
// Real Supabase calls look like:
//   supabase.from('table').select('*').eq('a', 1).eq('b', 2).order('c')
// and the whole chain is awaitable, resolving to { data, error }.
//
// `makeChain(result)` returns an object where every chain method
// (select/eq/order/single/delete/upsert/insert/update) just returns
// itself, and the object is "thenable" so `await chain` or
// `Promise.all([chain, chain])` resolves with `result`.
function makeChain(result) {
  const chain = {};
  ['select', 'eq', 'order', 'single', 'delete', 'upsert', 'insert', 'update', 'limit'].forEach((method) => {
    chain[method] = jest.fn(() => chain);
  });
  chain.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected);
  chain.catch = (onRejected) => Promise.resolve(result).catch(onRejected);
  return chain;
}

// Builds a fake supabase client whose `.from(tableName)` returns a
// chain pre-loaded with whatever result you configured for that table.
// `tableResults` is a map of tableName -> result (or an array of
// results, consumed in order across successive calls for that table,
// letting one test exercise multiple sequential queries to the same
// table with different answers).
function makeSupabaseClient(tableResults = {}) {
  const callCounts = {};
  const from = jest.fn((table) => {
    const configured = tableResults[table];
    let result;
    if (Array.isArray(configured)) {
      const i = callCounts[table] || 0;
      result = configured[Math.min(i, configured.length - 1)];
      callCounts[table] = i + 1;
    } else {
      result = configured !== undefined ? configured : { data: null, error: null };
    }
    return makeChain(result);
  });
  return { from };
}

module.exports = { makeChain, makeSupabaseClient };
