import * as cheerio from "cheerio";

export interface ListingData {
  address: string;
  neighborhood: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  lotAcres: number;
  yearBuilt: number;
  description: string;
  photoUrls: string[];
}

/**
 * Three-tier scraping strategy:
 * 1. Parse the URL itself for address (always works, instant)
 * 2. Fetch via ScrapingBee proxy if API key is configured (bypasses bot protection)
 * 3. Direct fetch with mobile UA as fallback (works for Redfin, smaller sites)
 */
export async function scrapeListing(url: string): Promise<ListingData | null> {
  // Tier 1: Always extract what we can from the URL
  const result = emptyResult();
  parseAddressFromUrl(url, result);

  // Tier 2: Try fetching the full page for rich data
  const html = await fetchListingHtml(url);
  if (html) {
    extractFromHtml(html, result);
  }

  if (!result.address) return null;
  return result;
}

// --- Tier 1: URL parsing (free, instant, always works) ---

function parseAddressFromUrl(url: string, result: ListingData): void {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");

    if (host === "zillow.com") {
      // Format: /homedetails/450-Sterling-Woods-Ln-Southold-NY-11971/123_zpid/
      const match = parsed.pathname.match(
        /\/homedetails\/([^/]+?)\/\d+_zpid/
      );
      if (match) {
        result.address = formatDashedAddress(match[1]);
        const parts = match[1].split("-");
        if (parts.length >= 3) {
          const stateIdx = parts.length - 2;
          const state = parts[stateIdx];
          if (state.length === 2 && state === state.toUpperCase()) {
            // Use street suffixes to find where city begins
            const suffixes = ["Ln", "St", "Ave", "Dr", "Ct", "Rd", "Blvd", "Way", "Pl", "Ter", "Cir", "Hwy", "Pkwy", "Trl"];
            let cityStart = stateIdx;
            for (let i = 0; i < stateIdx; i++) {
              if (suffixes.includes(parts[i])) {
                cityStart = i + 1;
                break;
              }
            }
            if (cityStart < stateIdx) {
              result.neighborhood = parts.slice(cityStart, stateIdx).join(" ");
            }
          }
        }
      }
    } else if (host === "redfin.com") {
      // Format: /NY/Southold/450-Sterling-Woods-Ln-11971/home/123
      const match = parsed.pathname.match(
        /\/([A-Z]{2})\/([^/]+)\/([^/]+?)(?:-\d{5})?\/home/
      );
      if (match) {
        result.address = `${formatDashedAddress(match[3])}, ${match[2].replace(/-/g, " ")}, ${match[1]}`;
        result.neighborhood = match[2].replace(/-/g, " ");
      }
    } else if (host === "realtor.com") {
      // Format: /realestateandhomes-detail/450-Sterling-Woods-Ln_Southold_NY_11971_M12345
      const match = parsed.pathname.match(
        /\/realestateandhomes-detail\/([^/]+)/
      );
      if (match) {
        result.address = match[1]
          .replace(/_M\d+$/, "")
          .replace(/_/g, ", ")
          .replace(/-/g, " ");
      }
    }
  } catch {
    // URL parsing failed, not critical
  }
}

function formatDashedAddress(slug: string): string {
  return slug
    .replace(/-(\d{5})$/, ", $1") // zip code
    .replace(/-([A-Z]{2})-/, ", $1 ")  // state
    .replace(/-([A-Z]{2}),/, ", $1,")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// --- Tier 2: HTML fetching ---

async function fetchListingHtml(url: string): Promise<string | null> {
  // Try ScrapingBee first if configured
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (apiKey) {
    const html = await fetchViaScrapingBee(url, apiKey);
    if (html) return html;
  }

  // Fallback: direct fetch with mobile UAs
  return await fetchDirect(url);
}

async function fetchViaScrapingBee(
  url: string,
  apiKey: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      url: url,
      render_js: "false",
      premium_proxy: "true",
      country_code: "us",
    });

    const response = await fetch(
      `https://app.scrapingbee.com/api/v1/?${params}`,
      { signal: AbortSignal.timeout(30000) }
    );

    if (!response.ok) return null;
    const html = await response.text();
    if (html.includes("captcha") || html.length < 1000) return null;
    return html;
  } catch {
    return null;
  }
}

const MOBILE_UAS = [
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
];

async function fetchDirect(url: string): Promise<string | null> {
  for (const ua of MOBILE_UAS) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": ua,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(15000),
        redirect: "follow",
      });
      if (!response.ok) continue;
      const html = await response.text();
      if (html.includes("captcha") || html.includes("Access Denied")) continue;
      if (html.length < 1000) continue;
      return html;
    } catch {
      continue;
    }
  }
  return null;
}

// --- HTML extraction (JSON-LD, regex, OG tags) ---

function extractFromHtml(html: string, result: ListingData): void {
  const $ = cheerio.load(html);

  // JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "");
      extractRecursive(data, result);
    } catch {
      // skip malformed JSON-LD
    }
  });

  // Regex fallbacks for fields not in JSON-LD
  if (!result.price) {
    result.price = extractNumber(html, [
      /"price"\s*:\s*(\d+)/,
      /"listPrice"\s*:\s*(\d+)/,
      /"price"\s*:\s*"?\$?([\d,]+)/,
    ]);
  }
  if (!result.beds) {
    result.beds = extractNumber(html, [
      /numberOfBedrooms\\?"?\s*:\s*(\d+)/,
      /"bedrooms"\s*:\s*(\d+)/,
      /"beds"\s*:\s*(\d+)/,
      /(\d+)\s*bed/i,
    ]);
  }
  if (!result.baths) {
    result.baths = extractFloat(html, [
      /numberOfBathroomsTotal\\?"?\s*:\s*([\d.]+)/,
      /"bathrooms"\s*:\s*([\d.]+)/,
      /"baths"\s*:\s*([\d.]+)/,
      /(\d+(?:\.\d+)?)\s*bath/i,
    ]);
  }
  if (!result.sqft) {
    result.sqft = extractNumber(html, [
      /"livingArea"\s*:\s*(\d+)/,
      /"livingAreaValue"\s*:\s*([\d,]+)/,
      /(\d{3,5})\s*sqft/i,
      /(\d{3,5})\s*sq\s*\.?\s*ft/i,
    ]);
  }
  if (!result.yearBuilt) {
    result.yearBuilt = extractNumber(html, [
      /yearBuilt\\?"?\s*:\s*(\d{4})/,
      /[Bb]uilt\s*(?:in\s*)?(\d{4})/,
    ]);
  }
  if (!result.lotAcres) {
    const lotSqft = extractNumber(html, [
      /"lotSize"\s*:\s*(\d+)/,
      /"lotAreaValue"\s*:\s*([\d,]+)/,
    ]);
    if (lotSqft > 0) {
      result.lotAcres = Math.round((lotSqft / 43560) * 100) / 100;
    }
    if (!result.lotAcres) {
      const acres = extractFloat(html, [/([\d.]+)\s*[Aa]cre/]);
      if (acres > 0 && acres < 1000) result.lotAcres = acres;
    }
  }

  // OG meta fallbacks
  if (!result.address) {
    const ogTitle =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      "";
    result.address = ogTitle.replace(/\s*[|\-–—].*$/, "").trim();
  }
  if (!result.description) {
    result.description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";
  }
  if (result.photoUrls.length === 0) {
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage && !ogImage.includes("staticmap")) {
      result.photoUrls.push(ogImage);
    }
  }

  // Site-specific photo extraction
  if (result.photoUrls.length === 0) {
    const zillowPhotos = html.match(
      /"(https:\/\/photos\.zillowstatic\.com\/fp\/[^"]+)"/g
    );
    if (zillowPhotos) {
      result.photoUrls = [
        ...new Set(
          zillowPhotos
            .map((m) => m.replace(/"/g, ""))
            .filter((u) => u.includes("_e") || u.includes("_f"))
        ),
      ].slice(0, 10);
    }
  }
  if (result.photoUrls.length === 0) {
    const redfinPhotos = html.match(
      /"(https:\/\/ssl\.cdn-redfin\.com\/photo\/[^"]+)"/g
    );
    if (redfinPhotos) {
      result.photoUrls = [
        ...new Set(redfinPhotos.map((m) => m.replace(/"/g, ""))),
      ].slice(0, 10);
    }
  }
}

// --- JSON-LD recursive extraction ---

function hasType(item: Record<string, unknown>, type: string): boolean {
  const t = item["@type"];
  if (typeof t === "string") return t === type;
  if (Array.isArray(t)) return t.includes(type);
  return false;
}

const PROPERTY_TYPES = [
  "SingleFamilyResidence",
  "Residence",
  "House",
  "Apartment",
  "Product",
  "RealEstateListing",
];

function extractRecursive(data: unknown, result: ListingData, depth = 0): void {
  if (depth > 5 || !data || typeof data !== "object") return;

  if (Array.isArray(data)) {
    for (const item of data) extractRecursive(item, result, depth + 1);
    return;
  }

  const obj = data as Record<string, unknown>;
  if (PROPERTY_TYPES.some((t) => hasType(obj, t))) {
    extractPropertyFields(obj, result);
  }

  const nested = [
    obj["@graph"],
    obj["mainEntity"],
    obj["offers"],
    obj["itemOffered"],
    (obj["offers"] as Record<string, unknown>)?.["itemOffered"],
  ];
  for (const child of nested) {
    if (child) extractRecursive(child, result, depth + 1);
  }
}

function extractPropertyFields(
  item: Record<string, unknown>,
  result: ListingData
): void {
  if (!result.address) {
    if (item.name && typeof item.name === "string") {
      result.address = item.name;
    }
    const address = item.address as Record<string, string> | undefined;
    if (address?.streetAddress) {
      result.address = [
        address.streetAddress,
        address.addressLocality,
        address.addressRegion,
        address.postalCode,
      ]
        .filter(Boolean)
        .join(", ");
      if (!result.neighborhood && address.addressLocality) {
        result.neighborhood = address.addressLocality;
      }
    }
  }

  if (
    !result.description &&
    item.description &&
    typeof item.description === "string"
  ) {
    result.description = item.description;
  }

  if (!result.price) {
    const price =
      item.price ?? (item.offers as Record<string, unknown>)?.price;
    if (price) {
      result.price = parseInt(String(price).replace(/[^\d]/g, ""), 10) || 0;
    }
  }

  if (!result.beds) {
    const beds =
      item.numberOfBedrooms ?? item.numberOfRooms ?? item.bedrooms;
    if (beds) result.beds = Number(beds) || 0;
  }

  if (!result.baths) {
    const baths =
      item.numberOfBathroomsTotal ?? item.bathrooms ?? item.bathroomsFull;
    if (baths) result.baths = Number(baths) || 0;
  }

  if (!result.sqft) {
    const floorSize = item.floorSize as Record<string, unknown> | undefined;
    if (floorSize?.value) {
      result.sqft =
        parseInt(String(floorSize.value).replace(/[^\d]/g, ""), 10) || 0;
    }
  }

  if (!result.yearBuilt && item.yearBuilt) {
    result.yearBuilt = Number(item.yearBuilt) || 0;
  }

  if (result.photoUrls.length === 0) {
    const images = (item.image || item.photo) as unknown;
    if (images) {
      if (Array.isArray(images)) {
        result.photoUrls = images
          .slice(0, 10)
          .map((img) =>
            typeof img === "string"
              ? img
              : (img as Record<string, string>)?.contentUrl ||
                (img as Record<string, string>)?.url ||
                ""
          )
          .filter((u) => u && !u.includes("staticmap"));
      } else if (
        typeof images === "string" &&
        !images.includes("staticmap")
      ) {
        result.photoUrls = [images];
      }
    }
  }
}

// --- Helpers ---

function emptyResult(): ListingData {
  return {
    address: "",
    neighborhood: "",
    price: 0,
    beds: 0,
    baths: 0,
    sqft: 0,
    lotAcres: 0,
    yearBuilt: 0,
    description: "",
    photoUrls: [],
  };
}

function extractNumber(html: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const val = parseInt(match[1].replace(/,/g, ""), 10);
      if (val > 0) return val;
    }
  }
  return 0;
}

function extractFloat(html: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const val = parseFloat(match[1]);
      if (val > 0) return val;
    }
  }
  return 0;
}
