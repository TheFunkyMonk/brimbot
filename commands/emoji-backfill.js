import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { backfill } from '../utils/emoji-tracking.js';

// Hidden from everyone but people who can manage the server.
export const data = new SlashCommandBuilder()
	.setName('emoji-backfill')
	.setDescription('Count custom emojis in the messages sent before I started counting.')
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
	.setDMPermission(false);

const running = new Set();

export async function execute(interaction) {
	const { guild } = interaction;

	if (running.has(guild.id)) {
		return interaction.reply({ content: "I'm already reading this server's history.", flags: MessageFlags.Ephemeral });
	}

	running.add(guild.id);
	await interaction.reply({
		content: "Reading this server's history. Big servers can take a while; I'll post here when I'm done.",
		flags: MessageFlags.Ephemeral,
	});

	// The reply can only be edited for 15 minutes, so progress goes there
	// while it can and the result goes to the channel.
	let lastUpdate = 0;
	const onProgress = ({ channel, done, total, messages }) => {
		if (Date.now() - lastUpdate < 5000) return;
		lastUpdate = Date.now();
		interaction.editReply(`Reading #${channel.name} (channel ${done + 1} of ${total}). ${messages.toLocaleString('en-US')} messages so far.`).catch(() => {});
	};

	try {
		const { channels, messages } = await backfill(guild, onProgress);
		await interaction.channel.send(`Done reading this server's history: ${messages.toLocaleString('en-US')} messages across ${channels} channels. \`/emojis\` includes them now.`);
	} catch (error) {
		console.error('Error during emoji backfill:', error);
		await interaction.channel.send("I stopped partway through reading this server's history. Running `/emoji-backfill` again is safe: nothing gets counted twice.").catch(() => {});
	} finally {
		running.delete(guild.id);
	}
}
