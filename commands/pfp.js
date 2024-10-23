// commands/pfp.js
export const name = 'pfp';
export const description = 'Get the profile picture of a tagged user.';

export default async function (message, args) {
	// Check if a user is mentioned in the message
	const userMention = message.mentions.users.first();
	if (!userMention) {
		return message.reply("Please mention a user to get their profile picture.");
	}

	// Get the user's avatar URL in the highest resolution (the "dynamic" option gives .gif if it's animated)
	const avatarURL = userMention.displayAvatarURL({ dynamic: true, size: 4096 });

	// Reply with the avatar URL
	await message.channel.send(`${avatarURL}`);
}
