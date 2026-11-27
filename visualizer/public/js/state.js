// The viewer's shared state: the catalogue, the repository being viewed, and each view's selections.

export const state = {
  catalog: [], source: null, view: 'database', data: null,
  filter: '', selected: null, messageType: 'all', apiFile: null,
  mode: 'source', landscape: null, apiView: 'operations', selectedModel: null, dbView: 'diagram', tableTab: 'columns', cy: null
};
