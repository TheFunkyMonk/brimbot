import { Events, PermissionFlagsBits, SnowflakeUtil } from 'discord.js';
import { clearBisbopts, clearReactions, forgetMessage, setBisbopts, setMessageEmojis, setReactionCount, transaction } from './emoji-store.js';

// Counts the server's own custom emojis, in messages and in reactions, for
// /emojis. Only the counts are stored: never the text of a message, nor who
// sent it or reacted. The one exception is :bisbopt:, the server's reaction
// to a typo: for /bisbopt, it also keeps who wrote each message that got one.
const CUSTOM_EMOJI = /<a?:\w{2,32}:(\d{17,21})>/g;
const BISBOPT = 'bisbopt';

// When a message was sent, read from its id, so a reaction on an uncached
// message needs no fetch to be placed in time.
function sentAt(messageId) {
	return Number(SnowflakeUtil.timestampFrom(messageId));
}

function isOwnEmoji(guild, emojiId) {
	return Boolean(emojiId) && guild.emojis.cache.has(emojiId);
}

function isBisbopt(guild, emoji) {
	return emoji.name === BISBOPT && isOwnEmoji(guild, emoji.id);
}

// A message with no author yet arrived partial, so it's fetched to find out
// who wrote it. Only for :bisbopt:, which is rare enough not to matter.
async function recordBisbopts(guild, message, count) {
	if (count > 0 && !message.author) message = await message.fetch();
	setBisbopts(guild.id, message.id, message.author?.id, count);
}

export function recordMessage(message) {
	if (!message.guild || message.author?.bot || message.system) return;

	const ids = [...(message.content ?? '').matchAll(CUSTOM_EMOJI)]
		.map(match => match[1])
		.filter(id => isOwnEmoji(message.guild, id));

	setMessageEmojis(message.guild.id, message.id, sentAt(message.id), ids);
}

export function trackEmojis(client) {
	client.on(Events.MessageCreate, message => {
		try {
			recordMessage(message);
		} catch (error) {
			console.error('Error counting emojis in a message:', error);
		}
	});

	client.on(Events.MessageUpdate, async (_old, message) => {
		try {
			if (message.partial) message = await message.fetch();
			recordMessage(message);
		} catch (error) {
			console.error('Error counting emojis in an edited message:', error);
		}
	});

	client.on(Events.MessageDelete, message => forgetMessage(message.id));
	client.on(Events.MessageBulkDelete, messages => transaction(() => messages.forEach(message => forgetMessage(message.id))));

	// Sets the reaction's current count rather than adding or taking one, so
	// a missed event corrects itself the next time anybody reacts.
	const reactionChanged = async reaction => {
		const guild = client.guilds.cache.get(reaction.message.guildId);
		if (!guild || !isOwnEmoji(guild, reaction.emoji.id)) return;

		let count = 0;
		try {
			if (reaction.partial) await reaction.fetch();
			count = reaction.count ?? 0;
		} catch {
			// The last one was taken off, so the reaction is gone.
		}

		try {
			setReactionCount(guild.id, reaction.message.id, sentAt(reaction.message.id), reaction.emoji.id, count);
			if (isBisbopt(guild, reaction.emoji)) await recordBisbopts(guild, reaction.message, count);
		} catch (error) {
			console.error('Error counting a reaction:', error);
		}
	};

	client.on(Events.MessageReactionAdd, reactionChanged);
	client.on(Events.MessageReactionRemove, reactionChanged);
	client.on(Events.MessageReactionRemoveAll, message => {
		clearReactions(message.id);
		clearBisbopts(message.id);
	});
	client.on(Events.MessageReactionRemoveEmoji, reaction => {
		clearReactions(reaction.message.id, reaction.emoji.id);
		if (reaction.emoji.name === BISBOPT) clearBisbopts(reaction.message.id);
	});
}

// Reads every message Brimbot can see in the server, oldest included, and
// records its :bisbopt: reactions, for the ones from before /bisbopt kept
// who wrote what. Safe to run more than once.
export async function backfillBisbopts(guild, onProgress = () => {}) {
	const channels = await readableChannels(guild);
	let messages = 0;

	for (const [index, channel] of channels.entries()) {
		let before;

		while (true) {
			let page;
			try {
				page = await channel.messages.fetch({ limit: 100, before });
			} catch (error) {
				console.error(`Error reading #${channel.name}:`, error.message);
				break;
			}
			if (!page.size) break;

			transaction(() => {
				for (const message of page.values()) {
					const reaction = message.reactions.cache.find(reaction => isBisbopt(guild, reaction.emoji));
					setBisbopts(guild.id, message.id, message.author.id, reaction?.count ?? 0);
				}
			});

			messages += page.size;
			before = page.reduce((oldest, message) => (BigInt(message.id) < BigInt(oldest) ? message.id : oldest), page.firstKey());
			onProgress({ channel, done: index, total: channels.length, messages });

			if (page.size < 100) break;
		}
	}

	return { channels: channels.length, messages };
}

// Text channels Brimbot may read the history of, and the threads under them,
// archived public ones included.
async function readableChannels(guild) {
	const me = guild.members.me ?? await guild.members.fetchMe();
	const canRead = channel => channel.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]);
	const found = new Map();

	for (const channel of guild.channels.cache.values()) {
		if (channel.isThread() || !canRead(channel)) continue;
		if (channel.isTextBased()) found.set(channel.id, channel);

		if (channel.threads) {
			const active = await channel.threads.fetchActive().catch(() => null);
			const archived = await channel.threads.fetchArchived({ type: 'public', fetchAll: true }).catch(() => null);

			for (const thread of [...(active?.threads.values() ?? []), ...(archived?.threads.values() ?? [])]) {
				if (thread.parentId === channel.id) found.set(thread.id, thread);
			}
		}
	}

	return [...found.values()];
}
