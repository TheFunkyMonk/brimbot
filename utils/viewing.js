import { EmbedBuilder } from 'discord.js';

// Asks Astronomy Buddy's API about tonight and lays out its answer, for
// /telescope. The API decides everything and writes every
// sentence; see "Rules for consumers" in that repo's README: worthObserving
// answers "should I go out?", severity picks the colour, and the copy is
// shown as it comes.
const API_URL = process.env.ASTRONOMY_BUDDY_API_URL || 'https://rjlacount.dev/astronomy-buddy';
const TARGETS_SHOWN = 3;

// The API's own names for its four levels.
export const LEVELS = {
	'naked-eye': 'Naked eye',
	entry: 'Entry-level telescope (60-80mm)',
	intermediate: 'Intermediate telescope (100-150mm)',
	advanced: 'Advanced telescope (200mm+)',
};

const SEVERITY_COLOURS = {
	positive: 0x2e9e5b,
	neutral: 0x8a8f98,
	caution: 0xe0b23c,
	warning: 0xe07a2c,
	critical: 0xd64545,
};

const ICONS = {
	sparkles: '✨',
	star: '⭐',
	'partly-cloudy': '⛅',
	cloudy: '☁️',
	rain: '🌧️',
	smoke: '🌫️',
	dust: '🌫️',
	health: '😷',
};

export function defaultLevel() {
	return process.env.TELESCOPE_LEVEL || 'entry';
}

export async function fetchViewing({ latitude, longitude, elevation }, viewingLevel) {
	const query = new URLSearchParams({ latitude, longitude, elevation, viewingLevel });
	const response = await fetch(`${API_URL}/viewing-data?${query}`, { signal: AbortSignal.timeout(30000) });
	if (!response.ok) throw new Error(`Astronomy Buddy answered ${response.status}`);
	return response.json();
}

// A reply for message.reply or interaction.editReply.
export function viewingReply(data, placeName) {
	const { weather, targets = {}, location = {}, viewingCapabilities = {} } = data;
	const display = weather.display || {};

	const embed = new EmbedBuilder()
		.setColor(SEVERITY_COLOURS[display.severity] ?? SEVERITY_COLOURS.neutral)
		.setTitle(`${ICONS[display.icon] ?? ''} ${display.heading || weather.quality}`.trim())
		.setDescription([weather.verdict, weather.summary].filter(Boolean).join('\n'));

	const notices = (weather.notices || []).map(notice => `${ICONS[notice.icon] ?? '•'} ${notice.text}`);
	if (notices.length) embed.addFields({ name: 'Heads up', value: notices.join('\n') });

	const best = [...(targets.excellent || []), ...(targets.good || [])].slice(0, TARGETS_SHOWN);
	if (weather.worthObserving && best.length) {
		embed.addFields({
			name: display.targetsHeading || 'Best targets tonight',
			value: best.map(target => `**${target.name}**, best around ${clock(target.peakHour)} in the ${target.peakDirection}. ${sentence(target.reason)}`).join('\n'),
		});
	}

	embed.setFooter({ text: [placeName || location.name, viewingCapabilities.description].filter(Boolean).join(' · ') });

	const where = placeName ? ` in ${placeName.split(',')[0]}` : '';
	const content = weather.worthObserving
		? `Yes, tonight is worth taking the telescope out${where}.`
		: `Not tonight${where}. Leave the telescope in.`;

	return { content, embeds: [embed] };
}

function sentence(text = '') {
	return /[.!?]$/.test(text) ? text : `${text}.`;
}

function clock(hour) {
	if (typeof hour !== 'number') return 'tonight';
	const suffix = hour < 12 ? 'am' : 'pm';
	return `${hour % 12 || 12}${suffix}`;
}
