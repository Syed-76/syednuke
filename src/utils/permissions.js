export function canUserExecuteCommand(member, isOwner) {
  if (!member) {
    return false;
  }

  if (isOwner) {
    return true;
  }

  if (member.permissions.has('Administrator')) {
    return true;
  }

  return true;
}

export function canBotModerateChannel(channel, bot) {
  if (!channel || !bot) {
    return false;
  }

  const botMember = channel.guild.members.me;
  if (!botMember) {
    return false;
  }

  return botMember.permissionIn(channel).has('ManageChannels');
}

export function canBotModerateRoles(guild, bot) {
  if (!guild || !bot) {
    return false;
  }

  const botMember = guild.members.me;
  if (!botMember) {
    return false;
  }

  return botMember.permissions.has('ManageRoles');
}

export function canBotManageMessages(channel, bot) {
  if (!channel || !bot) {
    return false;
  }

  const botMember = channel.guild.members.me;
  if (!botMember) {
    return false;
  }

  return botMember.permissionIn(channel).has('SendMessages');
}

export function shouldProtectRole(role) {
  if (!role) {
    return true;
  }

  if (role.name === '@everyone') {
    return true;
  }

  if (role.managed) {
    return true;
  }

  if (role.position > role.guild.members.me.roles.highest.position) {
    return true;
  }

  return false;
}
