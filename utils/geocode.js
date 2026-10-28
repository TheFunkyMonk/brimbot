// Turns a place name into the latitude, longitude and elevation the
// Astronomy Buddy API needs, through Open-Meteo's geocoding API: keyless, and
// the elevation comes in the same answer.
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1';

// Autocomplete hands back a place's id with this prefix, so the command
// looks up exactly the place that was picked rather than searching again.
const ID_PREFIX = 'geo:';

export async function searchPlaces(name, count = 10) {
	if (name.trim().length < 2) return [];

	const query = new URLSearchParams({ name: name.trim(), count, language: 'en', format: 'json' });
	const response = await fetch(`${GEOCODING_URL}/search?${query}`, { signal: AbortSignal.timeout(2500) });
	if (!response.ok) throw new Error(`Open-Meteo geocoding answered ${response.status}`);

	const { results = [] } = await response.json();
	return results.map(toPlace);
}

// A picked suggestion ("geo:5809844") or whatever was typed ("Seattle").
export async function findPlace(input) {
	if (input.startsWith(ID_PREFIX)) {
		const response = await fetch(`${GEOCODING_URL}/get?id=${encodeURIComponent(input.slice(ID_PREFIX.length))}`, { signal: AbortSignal.timeout(5000) });
		if (!response.ok) return null;
		return toPlace(await response.json());
	}

	const [first] = await searchPlaces(input, 1);
	return first ?? null;
}

export function placeChoice(place) {
	return { name: place.label.slice(0, 100), value: `${ID_PREFIX}${place.id}` };
}

function toPlace(result) {
	return {
		id: result.id,
		label: [result.name, result.admin1, result.country_code].filter(Boolean).join(', '),
		latitude: result.latitude,
		longitude: result.longitude,
		elevation: result.elevation ?? 0,
	};
}
