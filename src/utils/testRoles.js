import config from '../config.js';
import logger from './logger.js';
import { shouldProtectRole } from './permissions.js';

export async function getTestRoles(guild) {
  try {
    const allRoles = await guild.roles.fetch();
    logger.debug(`📊 Total roles in guild: ${allRoles.size}`);
    
    const testRoles = allRoles.filter((role) => {
      const matchesPrefix = role.name && role.name.startsWith(config.testRolePrefix);
      const isProtected = shouldProtectRole(role);
      
      if (matchesPrefix) {
        if (isProtected) {
          logger.debug(`  🔒 Found test role (PROTECTED): "${role.name}" - Reason: ${getProtectionReason(role)}`);
        } else {
          logger.debug(`  ✅ Found deletable test role: "${role.name}" (ID: ${role.id})`);
        }
      }
      return matchesPrefix && !isProtected;
    });
    
    logger.info(`🔍 Test role detection: Found ${testRoles.size} deletable roles matching prefix "${config.testRolePrefix}"`);
    return testRoles;
  } catch (error) {
    logger.error(`Failed to fetch test roles: ${error.message}`);
    return new Map();
  }
}

function getProtectionReason(role) {
  if (role.name === '@everyone') return 'is @everyone role';
  if (role.managed) return 'is managed by Discord/integration';
  if (role.position > role.guild.members.me.roles.highest.position)
    return 'is above bot role in hierarchy';
  return 'unknown protection';
}

export async function deleteTestRoles(guild) {
  const testRoles = await getTestRoles(guild);
  const results = { success: 0, failed: 0, errors: [] };

  if (testRoles.size === 0) {
    logger.info(`📋 No test roles to delete (prefix: "${config.testRolePrefix}")`);
    return results;
  }

  logger.info(`🗑️ Attempting to delete ${testRoles.size} test role(s)...`);

  for (const [roleId, role] of testRoles) {
    try {
      logger.info(`  🗑️ Deleting role: "${role.name}" (ID: ${roleId})`);
      await role.delete();
      results.success++;
      logger.info(`  ✅ Successfully deleted: "${role.name}"`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        role: role.name,
        roleId: roleId,
        error: error.message,
      });
      logger.error(`  ❌ Failed to delete "${role.name}" (${roleId}): ${error.message}`);
    }
  }

  logger.info(`📊 Role deletion complete: ${results.success} deleted, ${results.failed} failed`);
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
