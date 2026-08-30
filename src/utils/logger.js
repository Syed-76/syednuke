import fs from 'fs';
import path from 'path';
import config from '../config.js';

class Logger {
  constructor() {
    this.logsDir = config.logsDir;
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  getLogFileName() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logsDir, `bot-${date}.log`);
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    console.log(logMessage.trim());
    
    try {
      fs.appendFileSync(this.getLogFileName(), logMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message) {
    this.log(message, 'INFO');
  }

  error(message) {
    this.log(message, 'ERROR');
  }

  warn(message) {
    this.log(message, 'WARN');
  }

  debug(message) {
    this.log(message, 'DEBUG');
  }

  logOperation(userId, guildId, command, status, details = '') {
    const message = `OPERATION | User: ${userId} | Guild: ${guildId} | Command: ${command} | Status: ${status} | ${details}`;
    this.info(message);
  }
}

export default new Logger();
