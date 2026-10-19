export function forumBasePath(role) {
  return role === 'consultant' ? '/consultant/forum' : '/patient/forum';
}
