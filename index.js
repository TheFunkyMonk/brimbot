import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from the .env file
dotenv.config();

// Create a new Discord client with specified intents
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,            // Allows the bot to receive events related to guilds
		GatewayIntentBits.GuildMessages,     // Allows the bot to receive message events in guilds
		GatewayIntentBits.MessageContent,    // Allows the bot to read the content of messages
		GatewayIntentBits.GuildMembers,      // Allows the bot to receive events related to guild members
	]
});

// Load all command files from the ./commands directory
const commands = {};
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Iterate over each command file and import it
for (const file of commandFiles) {
	const command = await import(`./commands/${file}`); // Dynamically import the command file
	const commandName = file.replace('.js', ''); // Get the command name by removing the .js extension
	commands[commandName] = command.default;     // Store the command function in the commands object
}

// Event listener for when the bot is ready and logged in
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`); // Log the bot's username
});

const prefix = "!"; // Define the command prefix

// Function to convert a command array (e.g., ['cat', 'fact']) to kebab case (e.g., 'cat-fact')
function toKebabCase(commandArray) {
	return commandArray.join('-').toLowerCase(); // Join array elements with '-' and convert to lowercase
}

// Event listener for new messages
client.on("messageCreate", function (message) {
	// Ignore messages sent by bots
	if (message.author.bot) return;

	// Ignore messages that don't start with the command prefix
	if (!message.content.startsWith(prefix)) return;

	// Extract the command body (e.g., "cat fact") by removing the prefix
	const commandBody = message.content.slice(prefix.length);

	// Split the command body into arguments (e.g., ['cat', 'fact'])
	const args = commandBody.split(' ');

	// Convert the full command to kebab case (e.g., 'cat fact' -> 'cat-fact')
	const command = toKebabCase(args);

	// If the command exists in the commands object, execute the corresponding function
	if (commands[command]) {
		commands[command](message, args.slice(command.split('-').length)); // Pass the message and any extra arguments to the command function
	} else {
		console.log(`Command "${command}" not found.`); // Log if the command does not exist
	}
});

// Log in to Discord using the BOT_TOKEN from the .env file
client.login(process.env.BOT_TOKEN);
