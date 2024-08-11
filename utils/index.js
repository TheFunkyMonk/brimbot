export function toKebabCase(commandArray) {
	return commandArray.join('-').toLowerCase();
}

export function toSpaceSeparated(commandName) {
	return commandName.replace(/-/g, ' ');
}
