import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { bisboptTotals } from '../utils/emoji-store.js';

// An embed fits about this many lines before Discord cuts it off.
const SHOWN = 25;

export const data = new SlashCommandBuilder()
	.setName('bisbopt')
	.setDescription('I count how many :bisbopt: reactions each person has earned.')
	.setDMPermission(false);

export async function execute(interaction) {
	const emoji = interaction.guild.emojis.cache.find(emoji => emoji.name === 'bisbopt');
	if (!emoji) {
		return interaction.reply("This server has no :bisbopt: emoji, so there's nothing to count.");
	}

	const rows = bisboptTotals(interaction.guildId);
	if (!rows.length) {
		return interaction.reply(`Nobody has been ${emoji}'d yet, as far as I've counted.`);
	}

	// Mentions inside an embed show the name without pinging anybody.
	const lines = rows.slice(0, SHOWN).map((row, index) => {
		const messages = `${row.messages} ${row.messages === 1 ? 'message' : 'messages'}`;
		return `${index + 1}. <@${row.author_id}> **${row.reactions}**, on ${messages}`;
	});
	if (rows.length > SHOWN) lines.push(`…and ${rows.length - SHOWN} more.`);

	const embed = new EmbedBuilder()
		.setTitle(`${emoji.name} counter`)
		.setThumbnail(emoji.imageURL())
		.setDescription(lines.join('\n'))
		.setFooter({ text: 'Every :bisbopt: reaction on your messages, all time.' });

	await interaction.reply({ embeds: [embed] });
}
