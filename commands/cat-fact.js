import fetch from 'node-fetch';

export const name = "cat fact";
export const description = "I tell you a random cat fact.";

export default async function (message, args) {
	try {
		const response = await Promise.race([
			fetch('https://catfact.ninja/fact'),
			new Promise((_, reject) =>
				setTimeout(() => {
					reject(new Error('API is taking too long'))
					message.reply('Sorry, the API is taking too long and I\'m not very patient. Please try again later.');
				}, 3000)
			)
		]);

		const data = await response.json();
		const { fact } = data;
		message.reply(fact);
	} catch (error) {
		console.error('Error fetching cat fact:', error);
		message.reply('Sorry, I couldn\'t fetch a cat fact right now. Please try again later.');
	}
}
