import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toKebabCase, toSpaceSeparated } from './utils/index.js';

// Load environment variables from the .env file
dotenv.config();

// Resolve __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new Discord client with specified intents
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

// Load all command files from the ./commands directory
const commands = {};
const commandMetadata = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const commandPath = path.join(__dirname, 'commands', file);
	const command = await import(commandPath);
	const commandName = file.replace('.js', ''); // File name without extension

	commands[toKebabCase([commandName])] = command.default;
	commandMetadata.push({ name: toKebabCase([commandName]), description: command.description || 'No description provided.' });
}

// Event listener for when the bot is ready and logged in
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

// Define possible command prefixes
const prefixes = ["!", "brim "];

// Sort prefixes in descending order by length to match longer prefixes first
prefixes.sort((a, b) => b.length - a.length);

// Event listener for new messages
client.on("messageCreate", async function (message) {
	if (message.author.bot) return;
	const messageContent = message.content.toLowerCase();

	// Find the longest prefix that matches the start of the message
	const prefix = prefixes.find(p => messageContent.startsWith(p.toLowerCase()));
	if (!prefix) return;

	// Extract the command and arguments
	const commandBody = message.content.slice(prefix.length).trim();
	const args = commandBody.split(' ');
	const commandName = toKebabCase(args); // Convert command input to kebab-case

	// Execute the command if it exists
	if (commands[commandName]) {
		await commands[commandName](message, args.slice(commandName.split('-').length), commandMetadata, prefix);
	} else {
		console.log(`Command "${commandName}" not found.`);
		message.reply(`\`${commandName}\`? I don't know how to do that. Maybe you could [teach me](https://github.com/TheFunkyMonk/brimbot)?`);
	}
});

// Log in to Discord using the BOT_TOKEN from the .env file
client.login(process.env.BOT_TOKEN);
