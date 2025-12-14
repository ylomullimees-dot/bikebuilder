// Bike Builder with separate front/rear wheels, tires, rotors, calipers

let allParts = [];
const selectedParts = {};

// Order of categories for the flow + dropdown
const categoriesSequence = [
  'frames',
  'front_wheel',
  'rear_wheel',
  'front_tire',
  'rear_tire',
  'front_rotor',
  'rear_rotor',
  'front_caliper',
  'rear_caliper',
  'cassettes',
  'cranksets',        // includes chain + front derailleur
  'rear_derailleurs',
  'saddles',
  'shifters',
  'handlebars'
];

let currentCategoryIndex = 0;
let currentFrameSlug = null;

// Layer order bottom → top
const layerOrder = {
  rear_rotor: 1,
  front_rotor: 2,
  rear_caliper: 3,
  front_caliper: 4,
  rear_wheel: 5,
  front_wheel: 5,
  rear_tire: 6,
  front_tire: 6,
  cassettes: 9,
  frames: 10,
  saddles: 11,
  handlebars: 12,
  shifters: 13,
  cranksets: 14,
  rear_derailleurs: 15
};

// Fallback colors if image missing
const REFERENCE_WIDTH = 850;
const REFERENCE_HEIGHT = 650;

function pxToPercent(value, reference) {
  if (typeof value !== "string") return value;
  if (!value.endsWith("px")) return value;

  const px = parseFloat(value);
  return ((px / reference) * 100).toFixed(3) + "%";
}

function normalizePosition(pos) {
  if (!pos) return pos;

  return {
    top: pxToPercent(pos.top, REFERENCE_HEIGHT),
    left: pxToPercent(pos.left, REFERENCE_WIDTH),
    width: pxToPercent(pos.width, REFERENCE_WIDTH),
    height: pxToPercent(pos.height, REFERENCE_HEIGHT)
  };
}

const categoryColors = {
  frames: '#8e44ad',
  front_wheel: '#2980b9',
  rear_wheel: '#2980b9',
  front_tire: '#2c3e50',
  rear_tire: '#2c3e50',
  front_rotor: '#f1c40f',
  rear_rotor: '#f39c12',
  front_caliper: '#d35400',
  rear_caliper: '#e67e22',
  cassettes: '#d35400',
  cranksets: '#16a085',
  rear_derailleurs: '#c0392b',
  saddles: '#95a5a6',
  handlebars: '#27ae60',
  shifters: '#34495e'
};

function init() {
  const partsScript = document.getElementById('parts-data');
  if (!partsScript) {
    console.error('Missing parts-data script tag');
    return;
  }
  try {
    allParts = JSON.parse(partsScript.textContent);
  } catch (err) {
    console.error('Failed to parse parts JSON:', err);
    return;
  }

  populateManufacturerFilter();
  populateCategoryFilter();
  updateCategoryNav();
  applyFilters();

  document.getElementById('search-input').addEventListener('input', applyFilters);
  document.getElementById('manufacturer-filter').addEventListener('change', applyFilters);
  document.getElementById('category-filter').addEventListener('change', handleCategorySelect);

  const nextBtn = document.getElementById('next-category');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const currentCat = categoriesSequence[currentCategoryIndex];
      if (!selectedParts[currentCat]) return; // must choose something before moving on
      if (currentCategoryIndex < categoriesSequence.length - 1) {
        currentCategoryIndex++;
        updateCategoryNav();
        applyFilters();
      }
    });
  }
}

function populateManufacturerFilter() {
  const manufacturerFilter = document.getElementById('manufacturer-filter');
  if (!manufacturerFilter) return;

  const manufacturers = Array.from(new Set(allParts.map(p => p.manufacturer))).sort();
  manufacturerFilter.innerHTML = '';

  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = 'All manufacturers';
  manufacturerFilter.appendChild(allOpt);

  manufacturers.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    manufacturerFilter.appendChild(opt);
  });
}

function populateCategoryFilter() {
  const categoryFilter = document.getElementById('category-filter');
  if (!categoryFilter) return;

  categoryFilter.innerHTML = '';
  categoriesSequence.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = toTitleCase(cat.replace(/_/g, ' '));
    categoryFilter.appendChild(opt);
  });

  categoryFilter.value = categoriesSequence[currentCategoryIndex];
}

function handleCategorySelect() {
  const categoryFilter = document.getElementById('category-filter');
  const value = categoryFilter.value;
  const idx = categoriesSequence.indexOf(value);
  if (idx !== -1) {
    currentCategoryIndex = idx;
    updateCategoryNav();
    applyFilters();
  }
}

function updateCategoryNav() {
  const navLabel = document.getElementById('current-category');
  const nextBtn = document.getElementById('next-category');
  const categoryFilter = document.getElementById('category-filter');
  if (!navLabel || !nextBtn) return;

  const currentCat = categoriesSequence[currentCategoryIndex];
  navLabel.textContent = toTitleCase(currentCat.replace(/_/g, ' '));

  const hasSelection = !!selectedParts[currentCat];
  nextBtn.disabled = !hasSelection || currentCategoryIndex >= categoriesSequence.length - 1;

  if (categoryFilter) {
    categoryFilter.value = currentCat;
  }
}

function applyFilters() {
  const searchValue = document.getElementById('search-input').value.trim().toLowerCase();
  const manValue = document.getElementById('manufacturer-filter').value;
  const currentCat = categoriesSequence[currentCategoryIndex];

  const terms = searchValue.split(/\s+/).filter(Boolean);

  const filtered = allParts.filter(part => {
    if (part.category !== currentCat) return false;
    if (manValue !== 'all' && part.manufacturer !== manValue) return false;

    return terms.every(term =>
      part.manufacturer.toLowerCase().includes(term) ||
      part.model.toLowerCase().includes(term) ||
      part.category.toLowerCase().includes(term)
    );
  });

  renderResults(filtered);
}

function renderResults(parts) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  if (parts.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No parts match your search.';
    p.style.color = '#777';
    p.style.padding = '0.5rem';
    resultsDiv.appendChild(p);
    return;
  }

  parts.forEach(part => {
    const card = document.createElement('div');
    card.className = 'part-card';

    const weightText = typeof part.weight === 'number' ? `${part.weight} g` : '–';
    const priceText = typeof part.price === 'number'
      ? `${part.price.toFixed(0)}${part.currency ? ' ' + part.currency : ''}`
      : '–';

    card.innerHTML = `
      <h3>${part.model}</h3>
      <p>${part.manufacturer} — ${toTitleCase(part.category.replace(/_/g, ' '))}</p>
      <p class="meta-line">Weight: ${weightText}</p>
      <p class="meta-line">Price: ${priceText}</p>
    `;

    card.addEventListener('click', () => selectPart(part));
    resultsDiv.appendChild(card);
  });
}

function selectPart(part) {
  selectedParts[part.category] = part;

  if (part.category === 'frames' && part.slug) {
    currentFrameSlug = part.slug;
  }

  renderSelected();
  renderBike();
  updateCategoryNav();
}

function renderSelected() {
  const list = document.getElementById('selected-list');
  list.innerHTML = '';

  let totalWeight = 0;
  let totalPrice = 0;
  let currency = null;

  const entries = Object.entries(selectedParts).sort((a, b) => {
    const aOrder = layerOrder[a[0]] || 999;
    const bOrder = layerOrder[b[0]] || 999;
    return aOrder - bOrder;
  });

  entries.forEach(([category, part]) => {
    const li = document.createElement('li');

    const weightText = typeof part.weight === 'number' ? `${part.weight} g` : '–';
    const priceText = typeof part.price === 'number'
      ? `${part.price.toFixed(0)}${part.currency ? ' ' + part.currency : ''}`
      : '–';

    li.textContent =
      `${toTitleCase(category.replace(/_/g, ' '))}: ` +
      `${part.manufacturer} ${part.model} | ${weightText} | ${priceText}`;
    list.appendChild(li);

    if (typeof part.weight === 'number') {
      totalWeight += part.weight;
    }
    if (typeof part.price === 'number') {
      totalPrice += part.price;
      if (!currency && part.currency) {
        currency = part.currency;
      }
    }
  });

  const totalWeightEl = document.getElementById('total-weight');
  const totalPriceEl = document.getElementById('total-price');

  if (totalWeightEl) {
    totalWeightEl.textContent = `Total weight: ${totalWeight} g`;
  }
  if (totalPriceEl) {
    const currencySuffix = currency ? ' ' + currency : '';
    totalPriceEl.textContent = `Total price: ${totalPrice.toFixed(0)}${currencySuffix}`;
  }
}

function renderBike() {
  const builder = document.getElementById('bike-builder');
  builder.innerHTML = '';

  const entries = Object.entries(selectedParts).sort((a, b) => {
    const aLayer = layerOrder[a[0]] || 999;
    const bLayer = layerOrder[b[0]] || 999;
    return aLayer - bLayer;
  });

  entries.forEach(([category, part]) => {
    const layerDiv = document.createElement('div');
    layerDiv.className = 'part-layer';
    layerDiv.style.zIndex = (layerOrder[category] || 999).toString();

    if (part.image) {
      layerDiv.style.backgroundImage = `url(${part.image})`;
    } else {
      layerDiv.style.backgroundColor = categoryColors[category] || '#666';
    }

    if (part.positions && currentFrameSlug && part.positions[currentFrameSlug]) {
      const pos = part.positions[currentFrameSlug];
      layerDiv.style.top = pos.top || '0';
      layerDiv.style.left = pos.left || '0';
      layerDiv.style.width = pos.width || '100%';
      layerDiv.style.height = pos.height || '100%';
    } else {
      layerDiv.style.top = '0';
      layerDiv.style.left = '0';
      layerDiv.style.width = '100%';
      layerDiv.style.height = '100%';
    }

    builder.appendChild(layerDiv);
  });
}

function toTitleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function getPositionForPart(part, currentFrame) {
  // 1. Frame-specific positioning (new system)
  if (
    part.positions &&
    currentFrame &&
    currentFrame.slug &&
    part.positions[currentFrame.slug]
  ) {
    return part.positions[currentFrame.slug];
  }

  // 2. Default positioning (recommended)
  if (part.positions && part.positions.default) {
    return part.positions.default;
  }

  // 3. Absolute fallback (old system behavior)
  return {
    top: "0%",
    left: "0%",
    width: "100%",
    height: "100%"
  };
}

window.addEventListener('DOMContentLoaded', init);