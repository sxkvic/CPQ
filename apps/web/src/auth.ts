export type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  roleCode: string;
};

const userKey = 'cpq_user';

export function setCurrentUser(user: CurrentUser) {
  localStorage.setItem(userKey, JSON.stringify(user));
}

export function getCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem(userKey);
  return raw ? JSON.parse(raw) : null;
}

export function hasRole(roles: string[] | undefined, roleCode: string | undefined) {
  if (!roles?.length) return true;
  if (!roleCode) return false;
  return roleCode === 'admin' || roles.includes(roleCode);
}
