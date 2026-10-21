// utils/pagination.js
const PAGE_SIZE = 25;

// Fetches one page of `collection` and returns { items, page }.
// `page` holds what the pagination partial needs to render links.
async function paginate(collection, { query = {}, sort = {}, projection, pageParam, req, pageSize = PAGE_SIZE }) {
  const requested = parseInt(req.query[pageParam], 10);
  const total = await collection.countDocuments(query);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), pages) : 1;

  let cursor = collection.find(query).sort(sort).skip((current - 1) * pageSize).limit(pageSize);
  if (projection) cursor = cursor.project(projection);
  const items = await cursor.toArray();

  return {
    items,
    page: { current, pages, total, offset: (current - 1) * pageSize, param: pageParam, query: req.query }
  };
}

function emptyPage(pageParam) {
  return { current: 1, pages: 1, total: 0, offset: 0, param: pageParam, query: {} };
}

// Links between pages are built in views/partials/pagination.ejs
module.exports = { paginate, emptyPage, PAGE_SIZE };
