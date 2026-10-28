
# Brimbot

Brimbot is a Discord bot designed to add fun and utility to your Discord server. It's based on my cat, but you could use it as a base for any kind of bot. Everything it does is a slash command: type `/` in Discord to see them. It never reads ordinary chat, so mentioning Brim in conversation never wakes it. Brimbot is built using Node.js and the Discord.js library.

## Features

- Slash commands, listed in Discord's `/` menu with their descriptions
- Automatically loads commands from the `commands` directory, and registers them with Discord on every start
- Easily extendable with new commands, one file each
- Needs no privileged permissions: it never reads messages

## Getting Started

### Prerequisites

To run Brimbot, you'll need:

- [Node.js](https://nodejs.org/) (version 20.11)
- A [Discord account](https://discord.com/)
- A [Discord server](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server-) where you have administrative rights
- A [Discord bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) added to your server with the `bot` and `applications.commands` scopes. It needs no privileged gateway intents.

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

Type `/` in Discord to see every command. They include:

- `/help`: Lists what Brimbot can do.
- `/cat-fact`: Responds with a random cat fact.
- `/pfp`: Shows someone's profile picture at full size.
- `/telescope`: Says whether tonight is worth taking the telescope out, from [Astronomy Buddy](https://github.com/TheFunkyMonk/astronomy-buddy-api). Pick a city as you type and, optionally, a telescope level.

### Adding New Commands

Add a `.js` file to the `commands` directory. It exports `data`, the command's name, description and options as a `SlashCommandBuilder`, and an `execute(interaction)` function that answers it. A command whose option suggests values as you type also exports `autocomplete(interaction)`; see `commands/telescope.js`.

Example (`commands/woof.js`):

```javascript
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('woof')
	.setDescription('I bark like a dog.');

export async function execute(interaction) {
	await interaction.reply('Woof! 🐶');
}
```

Brimbot loads it on its next start, registers it with Discord, and lists it in `/help`. Discord wants a first answer within three seconds, so a command that waits on another service calls `interaction.deferReply()` first and answers with `interaction.editReply()`.

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
