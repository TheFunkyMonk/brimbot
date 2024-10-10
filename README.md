
# Brimbot

Brimbot is a Discord bot designed to add fun and utility to your Discord server. It's based on my cat, but you could use it as a base for any kind of bot that responds to messages. It responds to various commands using either the `!` or `brim` prefix. Brimbot is built using Node.js and the Discord.js library.

## Features

- Supports multiple command prefixes (`!`, `brim`)
- Automatically loads commands from the `commands` directory
- Easily extendable with new commands
- Modular architecture with separate command files

## Getting Started

### Prerequisites

To run Brimbot, you'll need:

- [Node.js](https://nodejs.org/) (version 20.11)
- A [Discord account](https://discord.com/)
- A [Discord server](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server-) where you have administrative rights
- A [Discord bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) created and added to your server with Administrator and Privileged Gateway intents

### Installation

1. **Clone the repository:**

	```bash
	git clone https://github.com/TheFunkyMonk/brimbot.git
	cd brimbot
	```

2. **Install dependencies:**

	```bash
	npm install
	```

3. **Set up your environment variables:**

	Create a `.env` file in the root of your project with the following content:

	```env
	BOT_TOKEN=your-discord-bot-token
	```

	Replace `your-discord-bot-token` with the token of your Discord bot, which you can find in the [Discord Developer Portal](https://discord.com/developers/applications).

### Running Brimbot

Once you've set up your environment variables, you can start the bot with:

```bash
npm start
```

Brimbot should now be online and responding to commands in your Discord server.

## Usage

### Available Commands

Brimbot supports various commands, including:

- `!help` or `brim help`: Displays a list of available commands.
- `!cat fact` or `brim cat fact`: Responds with a random cat fact.

To use a command, simply type the command prefix followed by the command name, for example:

```
!help
```

Or:

```
brim help
```

### Adding New Commands

You can add new commands to Brimbot by creating a new `.js` file in the `commands` directory. The file should export a name and description (used for the `help` command) and a default function that handles the command.

Example of a new command file (`commands/woof.js`):

```javascript
export const name = 'woof';
export const description = 'I bark like a dog.';

export default function(message, args) {
	message.reply('Woof! 🐶');
}
```

Brimbot will automatically load and recognize this new command.

## Contributing

1. **Create a new branch for your feature or bug fix:**

	```bash
	git checkout -b your-feature-branch
	```

2. **Make your changes and commit them:**

	```bash
	git add .
	git commit -m "Add your message here"
	```

3. **Push your changes to your forked repository:**

	```bash
	git push origin your-feature-branch
	```

4. **Submit a pull request:** Go to the repository on GitHub and submit a pull request with a description of your changes.

## Useful Links

- [How to Create a Discord Server](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server-)
- [How to Create a Discord Bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)
- [Discord.js Documentation](https://discord.js.org/#/)

## License

This project is licensed under the [WTFPL](https://en.wikipedia.org/wiki/WTFPL) license.
