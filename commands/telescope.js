import { LEVELS, defaultLevel, fetchViewing, homePlace, viewingReply } from '../utils/viewing.js';

export const name = 'telescope';
export const description = 'I tell you whether tonight is worth taking the telescope out at home.';

// The quick version for home. /telescope takes any place and offers the
// levels as a list.
export default async function (message, args) {
	const place = homePlace();
	if (!place) return message.reply("I don't know where home is yet. Try `/telescope` with a location.");

	const asked = (args.join('-') || defaultLevel()).toLowerCase();
	const viewingLevel = asked === 'eye' ? 'naked-eye' : asked;
	if (!LEVELS[viewingLevel]) {
		return message.reply(`Try \`!telescope\` on its own, or with one of: ${Object.keys(LEVELS).join(', ')}.`);
	}

	await message.channel.sendTyping();

	try {
		return message.reply(viewingReply(await fetchViewing(place, viewingLevel)));
	} catch (error) {
		console.error('Error fetching viewing data:', error);
		return message.reply("I couldn't check the sky right now. Please try again in a bit.");
	}
}
