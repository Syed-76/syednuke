import logger from '../utils/logger.js';

export const command = {
  name: 'syedcancel',
  description: 'Cancel an active operation',
  async execute(message) {
    try {
      const embed = {
        color: 0xffa500,
        title: '⏸️ Cancel Request',
        description:
          'Currently, this command would cancel an active SYEDNUKE operation if one exists. Use the CANCEL button on the confirmation prompt instead.',
        timestamp: new Date(),
      };

      logger.logOperation(message.author.id, message.guild.id, 'syedcancel', 'INFO', 'Cancel command invoked');
      return message.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(`syedcancel command error: ${error.message}`);
      logger.logOperation(message.author.id, message.guild.id, 'syedcancel', 'ERROR', error.message);
      return message.reply('❌ An error occurred. Check logs for details.');
    }
  },
};
