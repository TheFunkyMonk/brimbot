import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('meow')
	.setDescription('I meow.');

export async function execute(interaction) {
	await interaction.reply('Meow.');
}
