import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('help')
	.setDescription('I list what I can do.');

// Lists every command index.js loaded, so a new file in ./slash shows up here
// without touching this one.
export async function execute(interaction) {
	const list = [...interaction.client.commands.values()]
		.filter(command => command.data.name !== 'help')
		.map(command => `\`/${command.data.name}\` ${command.data.description}`)
		.join('\n');

	const githubLink = 'You can view or contribute to my code on [GitHub](https://github.com/TheFunkyMonk/brimbot).';
	await interaction.reply(`Here's what I can do:\n\n${list}\n\n${githubLink}`);
}
