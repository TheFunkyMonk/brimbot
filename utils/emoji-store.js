import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Custom emoji counts, in SQLite. In production the file lives on a Kamal
// volume (config/deploy.yml), so it survives deploys.
//
// One row per message, emoji and kind, holding a count rather than an event:
// `message` is 1 if the emoji is in the message's text (a message with the
// emoji five times still counts once), `reaction` is how many people reacted
// with it. Writing the count for a message is the same operation whether it
// comes from a live event or the backfill, so running the backfill twice, or
// over messages already counted live, never counts anything twice.
//
// used_at is when the message was sent, reactions included, so a time range
// means "messages from those days and the reactions on them".
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '../storage');
fs.mkdirSync(STORAGE_DIR, { recursive: true });

const db = new DatabaseSync(path.join(STORAGE_DIR, 'brimbot.sqlite'));

db.exec(`
	PRAGMA journal_mode = WAL;

	CREATE TABLE IF NOT EXISTS emoji_uses (
		guild_id TEXT NOT NULL,
		message_id TEXT NOT NULL,
		emoji_id TEXT NOT NULL,
		kind TEXT NOT NULL CHECK (kind IN ('message', 'reaction')),
		uses INTEGER NOT NULL CHECK (uses > 0),
		used_at INTEGER NOT NULL,
		PRIMARY KEY (message_id, emoji_id, kind)
	);

	CREATE INDEX IF NOT EXISTS emoji_uses_by_guild_and_time ON emoji_uses (guild_id, used_at);
`);

const statements = {
	clearMessageEmojis: db.prepare(`DELETE FROM emoji_uses WHERE message_id = ? AND kind = 'message'`),
	insertMessageEmoji: db.prepare(`INSERT OR REPLACE INTO emoji_uses (guild_id, message_id, emoji_id, kind, uses, used_at) VALUES (?, ?, ?, 'message', 1, ?)`),
	upsertReaction: db.prepare(`INSERT OR REPLACE INTO emoji_uses (guild_id, message_id, emoji_id, kind, uses, used_at) VALUES (?, ?, ?, 'reaction', ?, ?)`),
	deleteReaction: db.prepare(`DELETE FROM emoji_uses WHERE message_id = ? AND emoji_id = ? AND kind = 'reaction'`),
	deleteReactions: db.prepare(`DELETE FROM emoji_uses WHERE message_id = ? AND kind = 'reaction'`),
	forgetMessage: db.prepare(`DELETE FROM emoji_uses WHERE message_id = ?`),
	totals: db.prepare(`
		SELECT emoji_id,
			SUM(CASE WHEN kind = 'message' THEN uses ELSE 0 END) AS in_messages,
			SUM(CASE WHEN kind = 'reaction' THEN uses ELSE 0 END) AS reactions,
			SUM(uses) AS total
		FROM emoji_uses
		WHERE guild_id = ? AND used_at >= ?
		GROUP BY emoji_id
		ORDER BY total DESC
	`),
};

// The custom emojis in a message's text, replacing whatever was recorded for
// it before, so an edit that removes one takes it off the count.
export function setMessageEmojis(guildId, messageId, usedAt, emojiIds) {
	transaction(() => {
		statements.clearMessageEmojis.run(messageId);
		for (const emojiId of new Set(emojiIds)) {
			statements.insertMessageEmoji.run(guildId, messageId, emojiId, usedAt);
		}
	});
}

export function setReactionCount(guildId, messageId, usedAt, emojiId, count) {
	if (count > 0) {
		statements.upsertReaction.run(guildId, messageId, emojiId, count, usedAt);
	} else {
		statements.deleteReaction.run(messageId, emojiId);
	}
}

export function clearReactions(messageId, emojiId = null) {
	if (emojiId) {
		statements.deleteReaction.run(messageId, emojiId);
	} else {
		statements.deleteReactions.run(messageId);
	}
}

export function forgetMessage(messageId) {
	statements.forgetMessage.run(messageId);
}

// Every emoji used since `since` (a timestamp, 0 for all time), most first.
export function emojiTotals(guildId, since) {
	return statements.totals.all(guildId, since);
}

// Nests: the backfill wraps a page of messages in one, and each message's
// own write joins it rather than starting a second.
let depth = 0;

export function transaction(work) {
	if (depth > 0) return work();

	depth++;
	db.exec('BEGIN');
	try {
		work();
		db.exec('COMMIT');
	} catch (error) {
		db.exec('ROLLBACK');
		throw error;
	} finally {
		depth--;
	}
}
