import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('pfp')
	.setDescription("I show you someone's profile picture.")
	.addUserOption(option => option
		.setName('user')
		.setDescription('Whose picture.')
		.setRequired(true));

export async function execute(interaction) {
	const user = interaction.options.getUser('user');

	// Full size, and animated when the picture is.
	await interaction.reply(user.displayAvatarURL({ size: 4096 }));
}
