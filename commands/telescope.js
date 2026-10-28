import { EmbedBuilder } from 'discord.js';

export const name = 'telescope';
export const description = 'I tell you whether tonight is worth taking the telescope out.';

// Astronomy Buddy's API decides everything here and writes every sentence;
// this only lays its answer out. See "Rules for consumers" in that repo's
// README: worthObserving answers "should I go out?", severity picks the
// colour, and the copy is shown as it comes.
const API_URL = process.env.ASTRONOMY_BUDDY_API_URL || 'https://rjlacount.dev/astronomy-buddy';
const LEVELS = ['naked-eye', 'entry', 'intermediate', 'advanced'];
const TARGETS_SHOWN = 3;

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

export default async function (message, args) {
	const { OBSERVING_LATITUDE: latitude, OBSERVING_LONGITUDE: longitude, OBSERVING_ELEVATION: elevation } = process.env;
	if (!latitude || !longitude || !elevation) {
		return message.reply("I don't know where you're observing from yet.");
	}

	const asked = (args.join('-') || process.env.TELESCOPE_LEVEL || 'entry').toLowerCase();
	const viewingLevel = asked === 'eye' ? 'naked-eye' : asked;
	if (!LEVELS.includes(viewingLevel)) {
		return message.reply(`Try \`!telescope\` on its own, or with one of: ${LEVELS.join(', ')}.`);
	}

	await message.channel.sendTyping();

	let data;
	try {
		const query = new URLSearchParams({ latitude, longitude, elevation, viewingLevel });
		const response = await fetch(`${API_URL}/viewing-data?${query}`, { signal: AbortSignal.timeout(30000) });
		if (!response.ok) throw new Error(`Astronomy Buddy answered ${response.status}`);
		data = await response.json();
	} catch (error) {
		console.error('Error fetching viewing data:', error);
		return message.reply("I couldn't check the sky right now. Please try again in a bit.");
	}

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

	embed.setFooter({ text: [location.name, viewingCapabilities.description].filter(Boolean).join(' · ') });

	const answer = weather.worthObserving
		? 'Yes, tonight is worth taking the telescope out.'
		: 'Not tonight. Leave the telescope in.';

	return message.reply({ content: answer, embeds: [embed] });
}

function sentence(text = '') {
	return /[.!?]$/.test(text) ? text : `${text}.`;
}

function clock(hour) {
	if (typeof hour !== 'number') return 'tonight';
	const suffix = hour < 12 ? 'am' : 'pm';
	return `${hour % 12 || 12}${suffix}`;
}
