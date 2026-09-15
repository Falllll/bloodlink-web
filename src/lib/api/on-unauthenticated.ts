export async function onUnauthenticated(): Promise<void> {
  await fetch('/api/session/logout', { method: 'POST' });
  window.location.replace('/login');
}
