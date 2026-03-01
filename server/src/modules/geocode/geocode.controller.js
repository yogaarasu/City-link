const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/reverse";
const CACHE_TTL_MS = 60 * 1000;
const geocodeCache = new Map();

const buildCacheKey = (lat, lng) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isValidLatitude = (value) => Number.isFinite(value) && value >= -90 && value <= 90;
const isValidLongitude = (value) => Number.isFinite(value) && value >= -180 && value <= 180;

const fetchReverseGeocode = async (lat, lng) => {
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    zoom: "18",
    lat: String(lat),
    lon: String(lng),
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "CityLink/1.0 (reverse-geocode-proxy)",
      },
    });

    if (response.ok) {
      return response.json();
    }

    if (response.status === 429 && attempt < 1) {
      await sleep(350);
      continue;
    }

    const error = new Error(`Geocoding provider responded with status ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  throw new Error("Unable to reverse geocode location");
};

export const reverseGeocodeController = async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
    return res.status(400).json({ error: "Invalid lat/lng query parameters" });
  }

  const cacheKey = buildCacheKey(lat, lng);
  const cached = geocodeCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return res.status(200).json(cached.data);
  }

  try {
    const data = await fetchReverseGeocode(lat, lng);
    geocodeCache.set(cacheKey, { data, timestamp: now });
    return res.status(200).json(data);
  } catch (error) {
    const status = error?.statusCode === 429 ? 429 : 502;
    return res.status(status).json({
      error:
        status === 429
          ? "Geocoding service is busy. Please wait a few seconds and try again."
          : "Unable to fetch address details right now.",
    });
  }
};
