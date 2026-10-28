import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const responses = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/wyd.json'), 'utf8'));

export const data = new SlashCommandBuilder()
	.setName('wyd')
	.setDescription("I tell you what I'm up to.");

export async function execute(interaction) {
	await interaction.reply(responses[Math.floor(Math.random() * responses.length)]);
}
