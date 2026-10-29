import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { backfillBisbopts } from '../utils/emoji-tracking.js';

// A one-off, like the /emoji-backfill before it: run it once, then remove
// this file. Hidden from everyone but people who can manage the server.
export const data = new SlashCommandBuilder()
	.setName('bisbopt-backfill')
	.setDescription('Count :bisbopt: reactions on the messages sent before I kept track of who wrote them.')
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
		const { channels, messages } = await backfillBisbopts(guild, onProgress);
		await interaction.channel.send(`Done reading this server's history: ${messages.toLocaleString('en-US')} messages across ${channels} channels. \`/bisbopt\` includes them now.`);
	} catch (error) {
		console.error('Error during bisbopt backfill:', error);
		await interaction.channel.send("I stopped partway through reading this server's history. Running `/bisbopt-backfill` again is safe: nothing gets counted twice.").catch(() => {});
	} finally {
		running.delete(guild.id);
	}
}
