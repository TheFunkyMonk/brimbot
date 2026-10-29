import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { bisboptTotals } from '../utils/emoji-store.js';

// One embed per person, so each can carry their picture, and Discord allows
// ten embeds in a message.
const SHOWN = 10;

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

	// Looking people up can take longer than the three seconds Discord waits
	// for a first answer.
	await interaction.deferReply();

	const shown = rows.slice(0, SHOWN);
	const people = await Promise.all(shown.map(row => findPerson(interaction, row.author_id)));

	const embeds = shown.map((row, index) => {
		const messages = `${row.messages} ${row.messages === 1 ? 'message' : 'messages'}`;
		return new EmbedBuilder().setAuthor({
			name: `${index + 1}. ${people[index].name}: ${row.reactions}, on ${messages}`,
			iconURL: people[index].avatar,
		});
	});

	const others = rows.length - shown.length;
	if (others) {
		embeds.at(-1).setFooter({ text: `…and ${others} more ${others === 1 ? 'person' : 'people'}.` });
	}

	await interaction.editReply({ content: `${emoji} **bisbopt counter**: reactions on each person's messages, all time`, embeds });
}

// Their name and picture in this server, or everywhere if they've left it.
async function findPerson(interaction, userId) {
	const member = await interaction.guild.members.fetch(userId).catch(() => null);
	if (member) return { name: member.displayName, avatar: member.displayAvatarURL() };

	const user = await interaction.client.users.fetch(userId).catch(() => null);
	if (user) return { name: user.displayName, avatar: user.displayAvatarURL() };

	return { name: 'Somebody I can no longer find', avatar: undefined };
}
