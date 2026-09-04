import config from '../config.js';
import logger from '../utils/logger.js';

export const command = {
	name: 'syedkick',
	description: 'Kick one selected member after confirmation',
	async execute(message) {
		if (!message.guild) {
			return message.reply('❌ This command can only be used in a server.');
		}

		const target = message.mentions.members.first();
		if (!target) {
			return message.reply(`Usage: ${config.prefix}syedkick @member`);
		}

		if (target.id === message.guild.ownerId || target.id === message.client.user.id) {
			return message.reply('❌ The server owner and bot cannot be kicked.');
		}

		const botMember = message.guild.members.me;
		if (!target.kickable || (botMember && target.roles.highest.position >= botMember.roles.highest.position)) {
			return message.reply('❌ This member cannot be kicked because of Discord permissions or role hierarchy.');
		}

		const confirmation = await message.reply(
			`⚠️ Confirm kicking **${target.user.tag}** by replying \`${config.prefix}syedkick confirm\` within 30 seconds.`
		);

		const collected = await message.channel.awaitMessages({
			filter: (response) => response.author.id === message.author.id,
			max: 1,
			time: 30000,
			errors: ['time'],
		}).catch(() => null);

		const response = collected?.first();
		if (!response || response.content.trim().toLowerCase() !== `${config.prefix}syedkick confirm`) {
			return confirmation.edit('❌ Kick cancelled.');
		}

		try {
			await target.kick(`Targeted kick requested by ${message.author.tag}`);
			logger.logOperation(message.author.id, message.guild.id, 'syedkick', 'SUCCESS', `Kicked ${target.user.tag}`);
			return confirmation.edit(`✅ Kicked **${target.user.tag}**.`);
		} catch (error) {
			logger.error(`syedkick command error: ${error.message}`);
			return confirmation.edit('❌ The member could not be kicked.');
		}
	},
};
