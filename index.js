import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from the .env file
dotenv.config();

// Resolve __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Every command is a slash command, so Brimbot needs no permission to read
// messages: it never sees ordinary chat, and mentioning Brim or Brimley can't
// wake it.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Load every command from the ./commands directory. Each file exports `data`
// (its definition), `execute`, and `autocomplete` if an option suggests
// values. Kept on the client so /help can list them.
client.commands = new Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = await import(path.join(__dirname, 'commands', file));
	client.commands.set(command.data.name, command);
}

// Event listener for when the bot is ready and logged in
client.on(Events.ClientReady, async () => {
	console.log(`Logged in as ${client.user.tag}!`);

	// Tells Discord which commands exist, on every start, so the list in
	// Discord always matches this code. It replaces the whole set, so a file
	// removed from ./commands disappears from Discord too.
	try {
		await client.application.commands.set(client.commands.map(command => command.data.toJSON()));
		console.log(`Registered commands: ${[...client.commands.keys()].join(', ')}`);
	} catch (error) {
		console.error('Error registering commands:', error);
	}
});

// Event listener for commands and their autocomplete suggestions
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	if (interaction.isAutocomplete()) {
		try {
			await command.autocomplete?.(interaction);
		} catch (error) {
			console.error(`Error suggesting for /${interaction.commandName}:`, error);
		}
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(`Error running /${interaction.commandName}:`, error);

		// Only the person who asked sees this.
		const reply = { content: 'Something went wrong. Please try again.', flags: MessageFlags.Ephemeral };
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(reply).catch(() => {});
		} else {
			await interaction.reply(reply).catch(() => {});
		}
	}
});

// Log in to Discord using the BOT_TOKEN from the .env file
client.login(process.env.BOT_TOKEN);
