import { Events, SnowflakeUtil } from 'discord.js';
import { clearReactions, forgetMessage, setMessageEmojis, setReactionCount, transaction } from './emoji-store.js';

// Counts the server's own custom emojis, in messages and in reactions, for
// /emojis. Only the counts are stored: never the text of a message, nor who
// sent it or reacted.
const CUSTOM_EMOJI = /<a?:\w{2,32}:(\d{17,21})>/g;

// When a message was sent, read from its id, so a reaction on an uncached
// message needs no fetch to be placed in time.
function sentAt(messageId) {
	return Number(SnowflakeUtil.timestampFrom(messageId));
}

function isOwnEmoji(guild, emojiId) {
	return Boolean(emojiId) && guild.emojis.cache.has(emojiId);
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
		} catch (error) {
			console.error('Error counting a reaction:', error);
		}
	};

	client.on(Events.MessageReactionAdd, reactionChanged);
	client.on(Events.MessageReactionRemove, reactionChanged);
	client.on(Events.MessageReactionRemoveAll, message => clearReactions(message.id));
	client.on(Events.MessageReactionRemoveEmoji, reaction => clearReactions(reaction.message.id, reaction.emoji.id));
}
