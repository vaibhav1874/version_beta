/**
 * Project JEEVAN — Free Tactical Geocoding Engine
 * Uses OpenStreetMap Nominatim for resilient address-to-coordinate resolution.
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

/**
 * Clean and attempt multi-stage geocoding for Indian & global addresses.
 * If the exact address contains hyper-local landmarks (e.g. "near railway station"),
 * it progressively relaxes the query to locate the tehsil, city, or district accurately.
 */
export async function geocodeAddress(addressStr: string): Promise<GeocodeResult | null> {
  const raw = addressStr.trim();
  if (!raw || raw.length < 2) return null;

  // Build fallback candidate queries from most specific to broader geographical units
  const candidates: string[] = [];

  // 1. Direct query with common punctuation cleaned
  const cleanedFull = raw.replace(/[,;/-]/g, ' ').replace(/\s+/g, ' ').trim();
  candidates.push(cleanedFull);

  // 2. Remove purely descriptive prepositions/qualifiers that throw off Nominatim
  const descriptiveWords = new Set([
    'near', 'village', 'behind', 'opposite', 'opp', 'front', 'tehsil', 'tahsil',
    'dist', 'district', 'road', 'rd', 'ab', 'nh', 'nh42', 'nh52', 'station', 'railway', 'mp'
  ]);

  const tokens = raw
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => !descriptiveWords.has(word) && word.length > 2);

  if (tokens.length > 0) {
    candidates.push(tokens.join(' '));
  }

  // 3. Fallback: Search for primary city/town names found in the address (like Biaora, Rajgarh, Karanwas)
  const capitalizedWords = raw
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !descriptiveWords.has(w.toLowerCase()));

  if (capitalizedWords.length > 0) {
    candidates.push(capitalizedWords.slice(0, 3).join(' '));
  }

  // Deduplicate candidates
  const uniqueCandidates = Array.from(new Set(candidates));

  for (const query of uniqueCandidates) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) continue;

      const results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return {
            latitude: lat,
            longitude: lon,
            displayName: item.display_name,
          };
        }
      }
    } catch (err) {
      console.warn(`Geocoding lookup error for query: "${query}"`, err);
    }
  }

  return null;
}
