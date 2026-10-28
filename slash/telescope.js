import { SlashCommandBuilder } from 'discord.js';
import { findPlace, placeChoice, searchPlaces } from '../utils/geocode.js';
import { LEVELS, defaultLevel, fetchViewing, viewingReply } from '../utils/viewing.js';

export const data = new SlashCommandBuilder()
	.setName('telescope')
	.setDescription('Is tonight worth taking the telescope out?')
	.addStringOption(option => option
		.setName('location')
		.setDescription('A city or town.')
		.setRequired(true)
		.setAutocomplete(true))
	.addStringOption(option => option
		.setName('level')
		.setDescription('What you are observing with.')
		.addChoices(...Object.entries(LEVELS).map(([value, name]) => ({ name, value }))));

// Discord gives an autocomplete answer three seconds, so a slow or failed
// search offers nothing rather than an error. Typing a name and sending it
// without picking still works: execute searches for it.
export async function autocomplete(interaction) {
	let places = [];
	try {
		places = await searchPlaces(interaction.options.getFocused());
	} catch (error) {
		console.error('Error searching places:', error);
	}
	await interaction.respond(places.map(placeChoice));
}

export async function execute(interaction) {
	const typed = interaction.options.getString('location');
	const viewingLevel = interaction.options.getString('level') || defaultLevel();

	// The API can take longer than the three seconds Discord allows for a
	// first answer, so this shows "Brimbot is thinking…" until it is back.
	await interaction.deferReply();

	const place = await findPlace(typed).catch(() => null);
	if (!place) {
		return interaction.editReply({
			content: `I couldn't find "${typed}". Try picking a place from the list as you type.`,
			allowedMentions: { parse: [] },
		});
	}

	try {
		await interaction.editReply(viewingReply(await fetchViewing(place, viewingLevel), place.label));
	} catch (error) {
		console.error('Error fetching viewing data:', error);
		await interaction.editReply("I couldn't check the sky right now. Please try again in a bit.");
	}
}
