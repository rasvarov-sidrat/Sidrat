export type CountryOption = {
  code: 'RU' | 'AE' | 'MY';
  label: string;
  dialCode: string;
  phoneGroups: number[];
  phonePlaceholder: string;
};

export type CityOption = {
  value: string;
  region?: string;
};

export type AddressSuggestion = {
  value: string;
  subtitle?: string;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
  {
    code: 'RU',
    label: 'Российская Федерация',
    dialCode: '+7',
    phoneGroups: [3, 3, 2, 2],
    phonePlaceholder: '928 808 - 03 - 22',
  },
  {
    code: 'AE',
    label: 'ОАЭ',
    dialCode: '+971',
    phoneGroups: [2, 3, 4],
    phonePlaceholder: '50 123 4567',
  },
  {
    code: 'MY',
    label: 'Малайзия',
    dialCode: '+60',
    phoneGroups: [2, 3, 4],
    phonePlaceholder: '12 345 6789',
  },
];

const CITY_DATA_SOURCES = [
  'https://cdn.jsdelivr.net/gh/arbaev/russia-cities@main/russia-cities.json',
  'https://raw.githubusercontent.com/arbaev/russia-cities/main/russia-cities.json',
];

let cityCache: CityOption[] | null = null;
let cityLoadPromise: Promise<CityOption[]> | null = null;

function stripDigits(value: string) {
  return value.replace(/\D/g, '');
}

function unique(values: CityOption[]) {
  const seen = new Set<string>();
  return values.filter((item) => {
    const key = item.value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeCityItem(item: unknown): CityOption | null {
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  const value =
    (typeof record.name === 'string' && record.name) ||
    (typeof record.city === 'string' && record.city) ||
    (typeof record.name_alt === 'string' && record.name_alt) ||
    null;
  if (!value) return null;
  const region =
    (typeof record.region_name === 'string' && record.region_name) ||
    (typeof record.region === 'string' && record.region) ||
    undefined;
  return { value, region };
}

export async function loadRussianCities() {
  if (cityCache) return cityCache;
  if (cityLoadPromise) return cityLoadPromise;

  cityLoadPromise = (async () => {
    for (const source of CITY_DATA_SOURCES) {
      try {
        const response = await fetch(source);
        if (!response.ok) continue;
        const data = await response.json();
        const list = Array.isArray(data) ? data.map(normalizeCityItem).filter(Boolean) as CityOption[] : [];
        cityCache = unique(list).sort((a, b) => a.value.localeCompare(b.value, 'ru'));
        return cityCache;
      } catch {
        // try next source
      }
    }
    cityCache = [];
    return cityCache;
  })();

  return cityLoadPromise;
}

export async function searchRussianCities(query: string, limit = 12) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const cities = await loadRussianCities();
  return cities.filter((city) => city.value.toLowerCase().includes(q)).slice(0, limit);
}

function getCountryOption(countryCode: string) {
  return COUNTRY_OPTIONS.find((item) => item.code === countryCode) || COUNTRY_OPTIONS[0];
}

export function normalizePhoneDigits(value: string) {
  return stripDigits(value);
}

export function formatPhoneDigits(digits: string, countryCode: string) {
  const country = getCountryOption(countryCode);
  const rawDigits = normalizePhoneDigits(digits);
  const maxDigits = country.phoneGroups.reduce((sum, size) => sum + size, 0);
  const normalized = country.code === 'RU' && rawDigits.length > maxDigits
    ? rawDigits.replace(/^8/, '').replace(/^7/, '').slice(0, maxDigits)
    : rawDigits.slice(0, maxDigits);

  if (country.code === 'RU') {
    const parts = [
      normalized.slice(0, 3),
      normalized.slice(3, 6),
      normalized.slice(6, 8),
      normalized.slice(8, 10),
    ].filter(Boolean);
    if (parts.length <= 2) return parts.join(' ');
    if (parts.length === 3) return `${parts[0]} ${parts[1]} - ${parts[2]}`;
    return `${parts[0]} ${parts[1]} - ${parts[2]} - ${parts[3]}`;
  }

  const groups: string[] = [];
  let offset = 0;
  country.phoneGroups.forEach((size, index) => {
    const part = normalized.slice(offset, offset + size);
    if (part) {
      groups.push(part);
    }
    offset += size;
  });
  return groups.join(' ');
}

export function buildPhonePreview(countryCode: string, digits: string) {
  const country = getCountryOption(countryCode);
  const formattedDigits = formatPhoneDigits(digits, countryCode);
  return formattedDigits ? `${country.dialCode} ${formattedDigits}` : country.dialCode;
}

export function getPhonePlaceholder(countryCode: string) {
  return getCountryOption(countryCode).phonePlaceholder;
}

export function getCountryByCode(code: string) {
  return getCountryOption(code);
}

export async function fetchYandexAddressSuggestions(query: string, countryIso = 'ru') {
  const apiKey = import.meta.env.VITE_YANDEX_SUGGEST_API_KEY as string | undefined;
  const baseUrl = (import.meta.env.VITE_YANDEX_SUGGEST_BASE_URL as string | undefined) || 'https://suggest-maps.yandex.ru/v1/suggest';
  if (!apiKey || !query.trim()) return [];

  try {
    const url = new URL(baseUrl);
    url.searchParams.set('apikey', apiKey);
    url.searchParams.set('text', query.trim());
    url.searchParams.set('lang', 'ru_RU');
    url.searchParams.set('results', '8');
    url.searchParams.set('print_address', '1');
    url.searchParams.set('types', 'country,province,locality,street,house');
    url.searchParams.set('countries', countryIso);

    const response = await fetch(url.toString());
    if (!response.ok) return [];

    const data = (await response.json()) as {
      results?: Array<{
        title?: { text?: string };
        subtitle?: { text?: string };
        address?: { formatted_address?: string };
      }>;
    };

    return (data.results || [])
      .map((item) => ({
        value: item.address?.formatted_address || item.title?.text || '',
        subtitle: item.subtitle?.text,
      }))
      .filter((item) => item.value);
  } catch {
    return [];
  }
}
