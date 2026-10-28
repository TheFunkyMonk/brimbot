
# Brimbot

Brimbot is a Discord bot designed to add fun and utility to your Discord server. It's based on my cat, but you could use it as a base for any kind of bot that responds to messages. It responds to commands that start with `!`, so mentioning Brim in conversation never wakes it. Brimbot is built using Node.js and the Discord.js library.

## Features

- Responds only to `!` commands
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

### Deploying

Brimbot runs in Docker, deployed with [Kamal](https://kamal-deploy.org) (`config/deploy.yml`). The bot token and the container registry password come from a Bitwarden item through `.kamal/secrets`, which holds names only.

```bash
bin/kamal deploy
bin/kamal app logs -f
```

`bin/kamal` asks for the Bitwarden master password before it starts, then runs Kamal. Changes must be committed before a deploy, since Kamal builds from a clean clone of the last commit.

Only run one copy of the bot at a time. Two copies logged in with the same token will both answer every command.

## Usage

### Available Commands

Brimbot supports various commands, including:

- `!help`: Displays a list of available commands.
- `!cat fact`: Responds with a random cat fact.
- `/telescope`: Says whether tonight is worth taking the telescope out, from [Astronomy Buddy](https://github.com/TheFunkyMonk/astronomy-buddy-api). Pick a city as you type (or leave it empty for home) and, optionally, a telescope level.
- `!telescope`: The same for home. Add a level (`naked eye`, `entry`, `intermediate`, `advanced`) to ask for a different setup. Home is `OBSERVING_LATITUDE`, `OBSERVING_LONGITUDE` and `OBSERVING_ELEVATION` (metres) in `.env`.

To use a command, type `!` followed by the command name, for example:

```
!help
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

Slash commands live in the `slash` directory, one file each, exporting `data` (a `SlashCommandBuilder`), `execute(interaction)`, and `autocomplete(interaction)` if an option suggests values. Brimbot registers them with Discord every time it starts.

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
