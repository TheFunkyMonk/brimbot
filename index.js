import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from the .env file
dotenv.config();

// Create a new Discord client with specified intents
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	]
});

// Load all command files from the ./commands directory
const commands = {};
const commandMetadata = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const commandPath = `./commands/${file}`;
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
const prefixes = ["!", "brim"];

// Function to convert a command array (e.g., ['cat', 'fact']) to kebab case (e.g., 'cat-fact')
function toKebabCase(commandArray) {
	return commandArray.join('-').toLowerCase();
}

// Function to convert a kebab-case command name to a space-separated command name
function toSpaceSeparated(commandName) {
	return commandName.replace(/-/g, ' ');
}

// Event listener for new messages
client.on("messageCreate", async function (message) {
	if (message.author.bot) return;
	const messageContent = message.content.toLowerCase();
	const prefix = prefixes.find(p => messageContent.startsWith(p.toLowerCase()));
	if (!prefix) return;

	const commandBody = message.content.slice(prefix.length).trim();
	const args = commandBody.split(' ');
	const commandName = toKebabCase(args); // Convert command input to kebab-case

	if (commands[commandName]) {
		await commands[commandName](message, args.slice(commandName.split('-').length));
	} else if (commandName === 'help') {
		const helpMessage = commandMetadata
			.map(cmd => {
				const formattedPrefix = prefix === "!" ? prefix : `${prefix} `;
				return `\`${formattedPrefix}${toSpaceSeparated(cmd.name)}\` ${cmd.description}`;
			})
			.join('\n');
		message.reply(`Here's what I can do:\n${helpMessage}`);
	} else {
		console.log(`Command "${commandName}" not found.`);
	}
});

// Log in to Discord using the BOT_TOKEN from the .env file
client.login(process.env.BOT_TOKEN);
