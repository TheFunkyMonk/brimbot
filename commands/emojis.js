import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { emojiTotals } from '../utils/emoji-store.js';

const DAY = 24 * 60 * 60 * 1000;
const SHOWN = 15;

const PERIODS = {
	'7': { label: 'the last 7 days', days: 7 },
	'30': { label: 'the last 30 days', days: 30 },
	'90': { label: 'the last 90 days', days: 90 },
	'365': { label: 'the last year', days: 365 },
	all: { label: 'all time', days: null },
};

export const data = new SlashCommandBuilder()
	.setName('emojis')
	.setDescription("I list this server's most used custom emojis.")
	.setDMPermission(false)
	.addStringOption(option => option
		.setName('period')
		.setDescription('How far back to count. The last 30 days unless you pick.')
		.addChoices(
			{ name: 'Last 7 days', value: '7' },
			{ name: 'Last 30 days', value: '30' },
			{ name: 'Last 90 days', value: '90' },
			{ name: 'Last year', value: '365' },
			{ name: 'All time', value: 'all' },
		));

export async function execute(interaction) {
	const period = PERIODS[interaction.options.getString('period') ?? '30'];
	const since = period.days ? Date.now() - period.days * DAY : 0;

	// Only emojis the server still has: a deleted one can't be drawn, and
	// nobody can use it any more.
	const emojis = interaction.guild.emojis.cache;
	const rows = emojiTotals(interaction.guildId, since)
		.filter(row => emojis.has(row.emoji_id))
		.slice(0, SHOWN);

	if (!rows.length) {
		return interaction.reply(`Nobody has used this server's custom emojis in ${period.label}, as far as I've counted.`);
	}

	const lines = rows.map((row, index) => {
		const parts = [];
		if (row.in_messages) parts.push(`${row.in_messages} in messages`);
		if (row.reactions) parts.push(`${row.reactions} ${row.reactions === 1 ? 'reaction' : 'reactions'}`);
		return `${index + 1}. ${emojis.get(row.emoji_id)} **${row.total}**, ${parts.join(', ')}`;
	});

	const embed = new EmbedBuilder()
		.setTitle(`Most used emojis, ${period.label}`)
		.setDescription(lines.join('\n'))
		.setFooter({ text: 'A message counts once however many times it uses an emoji.' });

	await interaction.reply({ embeds: [embed] });
}
