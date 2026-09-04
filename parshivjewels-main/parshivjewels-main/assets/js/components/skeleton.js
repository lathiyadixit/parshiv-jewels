/* Loading skeletons — shown while a route resolves or a filter re-runs,
   so the grid never collapses to zero height and shifts the page. */

export function skeletonCard() {
  return `<div class="panel overflow-hidden rounded-xl" aria-hidden="true">
    <div class="skeleton h-72 w-full sm:h-80"></div>
    <div class="space-y-3 p-5">
      <div class="skeleton h-3 w-20 rounded-full"></div>
      <div class="skeleton h-6 w-3/4 rounded"></div>
      <div class="skeleton h-4 w-24 rounded"></div>
      <div class="flex gap-2.5 pt-3">
        <div class="skeleton h-10 flex-1 rounded-full"></div>
        <div class="skeleton h-10 flex-1 rounded-full"></div>
      </div>
    </div>
  </div>`;
}

export function skeletonGrid(count = 6, columns = 3) {
  const cols =
    columns === 4
      ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : 'sm:grid-cols-2 xl:grid-cols-3';
  return `<div class="grid gap-7 ${cols}" role="status" aria-label="Loading products">
    ${Array.from({ length: count }, skeletonCard).join('')}
  </div>`;
}

export function skeletonProductPage() {
  return `<div class="grid gap-12 lg:grid-cols-2" role="status" aria-label="Loading product">
    <div class="skeleton aspect-square w-full rounded-2xl"></div>
    <div class="space-y-4 py-4">
      <div class="skeleton h-3 w-28 rounded-full"></div>
      <div class="skeleton h-12 w-4/5 rounded"></div>
      <div class="skeleton h-6 w-32 rounded"></div>
      <div class="skeleton h-24 w-full rounded"></div>
      <div class="skeleton h-12 w-full rounded-full"></div>
    </div>
  </div>`;
}
