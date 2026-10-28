import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('dog-fact')
	.setDescription('You can try.');

export async function execute(interaction) {
	await interaction.reply('No. Gross.');
}
