import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const name = "wyd";
export const description = "I tell you what I'm up to.";

export default function(message, args) {
    const filePath = path.join(__dirname, '../data/wyd.json');
    const responses = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    message.reply(randomResponse);
}
