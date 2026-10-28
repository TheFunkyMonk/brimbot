import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('cat-fact')
	.setDescription('I tell you a random cat fact.');

export async function execute(interaction) {
	// Deferred because Discord wants a first answer within three seconds,
	// and catfact.ninja is not always that quick.
	await interaction.deferReply();

	try {
		const response = await fetch('https://catfact.ninja/fact', { signal: AbortSignal.timeout(5000) });
		if (!response.ok) throw new Error(`catfact.ninja answered ${response.status}`);
		const { fact } = await response.json();
		await interaction.editReply(fact);
	} catch (error) {
		console.error('Error fetching cat fact:', error);
		await interaction.editReply("Sorry, I couldn't fetch a cat fact right now. Please try again later.");
	}
}
