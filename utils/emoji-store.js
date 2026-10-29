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
// with it. Writing a count rather than adding one means a repeated or missed
// event never leaves the total wrong for long. The history from before
// Brimbot counted was read in once, by a command since removed (git history
// has it as commands/emoji-backfill.js).
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

	-- The one place a person is stored: for /bisbopt, who wrote each message
	-- that got :bisbopt: reactions, and how many. Nothing for other emojis.
	CREATE TABLE IF NOT EXISTS bisbopts (
		guild_id TEXT NOT NULL,
		message_id TEXT PRIMARY KEY,
		author_id TEXT NOT NULL,
		reactions INTEGER NOT NULL CHECK (reactions > 0)
	);

	CREATE INDEX IF NOT EXISTS bisbopts_by_guild ON bisbopts (guild_id);
`);

const statements = {
	clearMessageEmojis: db.prepare(`DELETE FROM emoji_uses WHERE message_id = ? AND kind = 'message'`),
	insertMessageEmoji: db.prepare(`INSERT OR REPLACE INTO emoji_uses (guild_id, message_id, emoji_id, kind, uses, used_at) VALUES (?, ?, ?, 'message', 1, ?)`),
	upsertReaction: db.prepare(`INSERT OR REPLACE INTO emoji_uses (guild_id, message_id, emoji_id, kind, uses, used_at) VALUES (?, ?, ?, 'reaction', ?, ?)`),
	deleteReaction: db.prepare(`DELETE FROM emoji_uses WHERE message_id = ? AND emoji_id = ? AND kind = 'reaction'`),
	deleteReactions: db.prepare(`DELETE FROM emoji_uses WHERE message_id = ? AND kind = 'reaction'`),
	forgetMessage: db.prepare(`DELETE FROM emoji_uses WHERE message_id = ?`),
	upsertBisbopt: db.prepare(`INSERT OR REPLACE INTO bisbopts (guild_id, message_id, author_id, reactions) VALUES (?, ?, ?, ?)`),
	forgetBisbopt: db.prepare(`DELETE FROM bisbopts WHERE message_id = ?`),
	bisboptTotals: db.prepare(`
		SELECT author_id, SUM(reactions) AS reactions, COUNT(*) AS messages
		FROM bisbopts
		WHERE guild_id = ?
		GROUP BY author_id
		ORDER BY reactions DESC, messages DESC
	`),
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
	statements.forgetBisbopt.run(messageId);
}

// How many :bisbopt: reactions a message has, and who wrote it.
export function setBisbopts(guildId, messageId, authorId, count) {
	if (count > 0) {
		statements.upsertBisbopt.run(guildId, messageId, authorId, count);
	} else {
		statements.forgetBisbopt.run(messageId);
	}
}

export function clearBisbopts(messageId) {
	statements.forgetBisbopt.run(messageId);
}

// Each person whose messages got :bisbopt: reactions, most first.
export function bisboptTotals(guildId) {
	return statements.bisboptTotals.all(guildId);
}

// Every emoji used since `since` (a timestamp, 0 for all time), most first.
export function emojiTotals(guildId, since) {
	return statements.totals.all(guildId, since);
}

// Nests: a bulk delete wraps its messages in one, and any write inside joins
// it rather than starting a second.
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
