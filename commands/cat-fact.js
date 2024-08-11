import fetch from 'node-fetch';

export default async function (message, args) {
	try {
		// Fetch a random cat fact from the Cat Facts API
		const response = await fetch('https://catfact.ninja/fact');
		const data = await response.json();

		// Extract the fact from the API response
		const { fact } = data;

		// Reply to the message with the cat fact
		message.reply(fact);

	} catch (error) {
		console.error('Error fetching cat fact:', error);

		// Send an error message if the API request fails
		message.reply('Sorry, I couldn\'t fetch a cat fact right now. Please try again later.');
	}
}
