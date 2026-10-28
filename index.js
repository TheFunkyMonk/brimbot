import { Client, Events, GatewayIntentBits } from 'discord.js';
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

// Load all slash commands from the ./slash directory. Each exports `data`
// (its definition), `execute`, and `autocomplete` if an option suggests.
const slashCommands = {};
const slashFiles = fs.readdirSync(path.join(__dirname, 'slash')).filter(file => file.endsWith('.js'));

for (const file of slashFiles) {
	const command = await import(path.join(__dirname, 'slash', file));
	slashCommands[command.data.name] = command;
	commandMetadata.push({ name: command.data.name, description: command.data.description, slash: true });
}

// Event listener for when the bot is ready and logged in
client.on(Events.ClientReady, async () => {
	console.log(`Logged in as ${client.user.tag}!`);

	// Tells Discord which slash commands exist, on every start, so the list in
	// Discord always matches this code. It replaces the whole set, so a file
	// removed from ./slash disappears from Discord too.
	try {
		await client.application.commands.set(Object.values(slashCommands).map(command => command.data.toJSON()));
		console.log(`Registered slash commands: ${Object.keys(slashCommands).join(', ')}`);
	} catch (error) {
		console.error('Error registering slash commands:', error);
	}
});

// Event listener for slash commands and their autocomplete suggestions
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;

	const command = slashCommands[interaction.commandName];
	if (!command) return;

	try {
		if (interaction.isAutocomplete()) {
			await command.autocomplete?.(interaction);
		} else {
			await command.execute(interaction);
		}
	} catch (error) {
		console.error(`Error running /${interaction.commandName}:`, error);
	}
});

// Commands start with "!" and nothing else, so mentioning Brim or Brimley in
// conversation never wakes the bot. A letter must follow straight away, so
// "!!!" or a lone "!" in ordinary chat is left alone too.
const prefix = "!";
const commandPattern = /^![a-z]/i;

// Event listener for new messages
client.on("messageCreate", async function (message) {
	if (message.author.bot) return;
	if (!commandPattern.test(message.content)) return;

	// Extract the command and arguments
	const commandBody = message.content.slice(prefix.length).trim();
	const args = commandBody.split(/\s+/); // Split by whitespace to keep mentions intact
	const commandName = toKebabCase([args[0]]); // Convert first word to kebab-case as command name

	// Execute the command if it exists
	if (commands[commandName]) {
		await commands[commandName](message, args.slice(1), commandMetadata, prefix); // Pass arguments excluding the command itself
	} else {
		console.log(`Command "${commandName}" not found.`);
		message.reply(`\`${commandName}\`? I don't know how to do that. Maybe you could [teach me](https://github.com/TheFunkyMonk/brimbot)?`);
	}
});

// Log in to Discord using the BOT_TOKEN from the .env file
client.login(process.env.BOT_TOKEN);
