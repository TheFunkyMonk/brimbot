import { toKebabCase, toSpaceSeparated } from '../utils/index.js';

export const name = 'help';
export const description = 'Displays a list of available commands.';

export default async function helpCommand(message, args, commandMetadata, prefix) {
	const helpMessage = commandMetadata
		.filter(cmd => cmd.name !== 'help')  // Exclude the "help" command from the list
		.map(cmd => {
			const formattedPrefix = prefix === "!" ? prefix : `${prefix} `;
			return `\`${formattedPrefix}${toSpaceSeparated(cmd.name)}\` ${cmd.description}`;
		})
		.join('\n');

	message.reply(`Here's what I can do:\n${helpMessage}`);
}
