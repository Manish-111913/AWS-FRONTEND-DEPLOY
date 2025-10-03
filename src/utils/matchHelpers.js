import { itemCatalogue } from '../data/itemCatalogue.js';

/* quick normaliser (defensive) */
const norm = (str) => {
  if (str === undefined || str === null) return '';
  // Coerce non-string inputs to string safely
  const s = typeof str === 'string' ? str : String(str);
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

/* Levenshtein distance – light version */
const levenshtein = (a, b) => {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  matrix[0] = Array.from({ length: a.length + 1 }, (_, j) => j);
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,          // deletion
        matrix[i][j - 1] + 1,          // insertion
        matrix[i - 1][j - 1] + cost    // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
};

/* returns { status: 'exact'|'partial'|'none', catalogueItem } */
export const matchItem = rawName => {
  const n = norm(rawName);
  if (!n) return { status: 'none', catalogueItem: null };

  // 1️⃣ exact match
  const exact = itemCatalogue.find(it => norm(it.name) === n);
  if (exact) return { status: 'exact', catalogueItem: exact };

  // 2️⃣ partial / fuzzy – edit-distance ≤ 2 OR one contains the other
  const partial = itemCatalogue.find(it => {
    const m = norm(it.name);
    return (
      n.includes(m) ||
      m.includes(n) ||
      levenshtein(n, m) <= 2
    );
  });
  
  if (partial) return { status: 'partial', catalogueItem: partial };

  // 3️⃣ new item
  return { status: 'none', catalogueItem: null };
};

/* Enhanced matching with multiple suggestions */
export const matchItemWithSuggestions = (rawName, maxSuggestions = 5) => {
  const n = norm(rawName);
  if (!n) return { status: 'none', catalogueItem: null, suggestions: [] };

  // 1️⃣ exact match
  const exact = itemCatalogue.find(it => norm(it.name) === n);
  if (exact) return { status: 'exact', catalogueItem: exact, suggestions: [] };

  // 2️⃣ collect all partial matches with scores
  const partialMatches = itemCatalogue
    .map(it => {
      const m = norm(it.name);
      let score = 0;
      
      // Exact substring match gets highest score
      if (n.includes(m) || m.includes(n)) {
        score = 100 - Math.abs(n.length - m.length);
      } else {
        // Levenshtein distance scoring
        const distance = levenshtein(n, m);
        if (distance <= 3) {
          score = Math.max(0, 50 - (distance * 10));
        }
      }
      
      return { item: it, score };
    })
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);

  if (partialMatches.length > 0) {
    return {
      status: 'partial',
      catalogueItem: partialMatches[0].item,
      suggestions: partialMatches.map(m => m.item)
    };
  }

  // 3️⃣ new item
  return { status: 'none', catalogueItem: null, suggestions: [] };
};

/* Match by category with fuzzy name matching */
export const matchItemInCategory = (rawName, category) => {
  const n = norm(rawName);
  if (!n) return { status: 'none', catalogueItem: null };

  const categoryItems = itemCatalogue.filter(it => it.category === category);

  // 1️⃣ exact match within category
  const exact = categoryItems.find(it => norm(it.name) === n);
  if (exact) return { status: 'exact', catalogueItem: exact };

  // 2️⃣ partial match within category
  const partial = categoryItems.find(it => {
    const m = norm(it.name);
    return (
      n.includes(m) ||
      m.includes(n) ||
      levenshtein(n, m) <= 2
    );
  });
  
  if (partial) return { status: 'partial', catalogueItem: partial };

  // 3️⃣ new item in category
  return { status: 'none', catalogueItem: null };
};

/* Get best matches across all categories with confidence scores */
export const getBestMatches = (rawName, limit = 10) => {
  const n = norm(rawName);
  if (!n) return [];

  return itemCatalogue
    .map(item => {
      const m = norm(item.name);
      let confidence = 0;
      let matchType = 'none';

      // Exact match
      if (n === m) {
        confidence = 100;
        matchType = 'exact';
      }
      // Contains match
      else if (n.includes(m) || m.includes(n)) {
        confidence = 80 - Math.abs(n.length - m.length) * 2;
        matchType = 'contains';
      }
      // Levenshtein distance match
      else {
        const distance = levenshtein(n, m);
        if (distance <= 3) {
          confidence = Math.max(0, 60 - (distance * 15));
          matchType = 'fuzzy';
        }
      }

      return {
        item,
        confidence: Math.max(0, Math.min(100, confidence)),
        matchType,
        distance: levenshtein(n, m)
      };
    })
    .filter(match => match.confidence > 0)
    .sort((a, b) => {
      // Sort by confidence first, then by distance
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return a.distance - b.distance;
    })
    .slice(0, limit);
};

/* Utility to check if an item name is likely a typo of a catalogue item */
export const isLikelyTypo = (rawName, threshold = 2) => {
  const n = norm(rawName);
  if (!n || n.length < 3) return false;

  const closeMatch = itemCatalogue.find(it => {
    const m = norm(it.name);
    return levenshtein(n, m) <= threshold && Math.abs(n.length - m.length) <= 2;
  });

  return !!closeMatch;
};

/* Get category suggestions based on partial item name */
export const getCategorySuggestions = (rawName) => {
  const matches = getBestMatches(rawName, 20);
  const categories = [...new Set(matches.map(m => m.item.category))];
  
  return categories.map(category => {
    const categoryMatches = matches.filter(m => m.item.category === category);
    const avgConfidence = categoryMatches.reduce((sum, m) => sum + m.confidence, 0) / categoryMatches.length;
    
    return {
      category,
      confidence: avgConfidence,
      itemCount: categoryMatches.length,
      topItems: categoryMatches.slice(0, 3).map(m => m.item)
    };
  }).sort((a, b) => b.confidence - a.confidence);
};

/* Batch matching for multiple items */
export const batchMatchItems = (rawNames) => {
  return rawNames.map(rawName => ({
    input: rawName,
    ...matchItemWithSuggestions(rawName, 3)
  }));
};

/* Export utility functions for testing */
export const utils = {
  norm,
  levenshtein
};