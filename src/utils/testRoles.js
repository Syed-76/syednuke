import config from '../config.js';
import logger from './logger.js';
import { shouldProtectRole } from './permissions.js';

export async function getTestRoles(guild) {
  try {
    const roles = await guild.roles.fetch();
    return roles.filter(
      (role) =>
        role.name &&
        role.name.startsWith(config.testRolePrefix) &&
        !shouldProtectRole(role)
    );
  } catch (error) {
    logger.error(`Failed to fetch test roles: ${error.message}`);
    return [];
  }
}

export async function deleteTestRoles(guild) {
  const testRoles = await getTestRoles(guild);
  const results = { success: 0, failed: 0, errors: [] };

  for (const role of testRoles.values()) {
    try {
      await role.delete();
      results.success++;
      logger.info(`Deleted test role: ${role.name}`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        role: role.name,
        error: error.message,
      });
      logger.error(`Failed to delete role ${role.name}: ${error.message}`);
    }
  }

  return results;
}

export async function createTestRoles(guild, count) {
  const results = { success: 0, failed: 0, errors: [], roles: [] };

  for (let i = 1; i <= count; i++) {
    try {
      const roleName = `${config.testRolePrefix}${String(i).padStart(3, '0')}`;
      const role = await guild.roles.create({
        name: roleName,
        reason: 'SYEDNUKE Test Role',
      });
      results.success++;
      results.roles.push(role);
      logger.info(`Created test role: ${role.name}`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        roleNumber: i,
        error: error.message,
      });
      logger.error(
        `Failed to create role ${config.testRolePrefix}${String(i).padStart(
          3,
          '0'
        )}: ${error.message}`
      );
    }
  }

  return results;
}

export function getTestRoleCount(guild, roles) {
  return roles.filter(
    (role) =>
      role.name &&
      role.name.startsWith(config.testRolePrefix) &&
      !shouldProtectRole(role)
  ).length;
}
