// Usage: >syedkick confirm
// Requires Administrator permission and the Members intent.
module.exports = {
	name: "syedkick",
	description: "Kick all members that the bot is allowed to kick.",

	async execute(message, args) {
		if (!message.guild) return message.reply("This command can only be used in a server.");

		if (!message.member.permissions.has("Administrator")) {
			return message.reply("You need Administrator permission to use this command.");
		}

		if (args[0]?.toLowerCase() !== "confirm") {
			return message.reply("This will kick every kickable member. Type `>syedkick confirm` to continue.");
		}

		await message.guild.members.fetch();
		const botMember = message.guild.members.me || message.guild.me;
		const members = message.guild.members.cache.filter(
			(member) =>
				member.id !== message.guild.ownerId &&
				member.id !== message.client.user.id &&
				member.kickable &&
				(!botMember || member.roles.highest.position < botMember.roles.highest.position)
		);

		let kicked = 0;
		for (const member of members.values()) {
			try {
				await member.kick("Mass kick requested by syedkick");
				kicked++;
			} catch (_) {
				// Ignore members that become unkickable during the operation.
			}
		}

		return message.channel.send(`Finished. Kicked ${kicked} member(s).`);
	},
};
