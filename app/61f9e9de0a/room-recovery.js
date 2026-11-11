// Saves only a room locator. Scores and privileges always come from Firebase.
export const ROOM_BOOKMARK_KEY = 'dagger_active_money_room';

function normalize(value) {
  if (!value || value.version !== 1 || typeof value.uid !== 'string' ||
      !value.uid.length || value.uid.length > 128 ||
      !/^[a-f0-9]{32}$/.test(value.id || '') || !/^[a-f0-9]{16}$/.test(value.invite || '') ||
      typeof value.name !== 'string' || !value.name.trim() || value.name.length > 24) return null;
  return {version: 1, uid: value.uid, id: value.id, invite: value.invite, name: value.name.trim()};
}

export function readRoomBookmark(storage, uid) {
  try {
    const value = normalize(JSON.parse(storage.getItem(ROOM_BOOKMARK_KEY) || 'null'));
    return value?.uid === uid ? value : null;
  } catch { return null; }
}

export function rememberRoom(storage, value) {
  const bookmark = normalize({...value, version: 1});
  if (!bookmark) return false;
  try { storage.setItem(ROOM_BOOKMARK_KEY, JSON.stringify(bookmark)); return true; }
  catch { return false; }
}

export function forgetRoom(storage, uid, id) {
  const current = readRoomBookmark(storage, uid);
  if (!current || (id && current.id !== id)) return false;
  try { storage.removeItem(ROOM_BOOKMARK_KEY); return true; } catch { return false; }
}

export async function readWithDeadline(read, timeoutMs = 15000) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(read),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(Error('Live room verification timed out'), {code: 'unavailable'})), timeoutMs); })
    ]);
  } finally { clearTimeout(timer); }
}

export async function recoverRoom({storage, uid, incoming, readRoom, isCurrent}) {
  const bookmark = readRoomBookmark(storage, uid);
  if (!bookmark || (incoming && (incoming.id !== bookmark.id || incoming.code !== bookmark.invite))) return null;
  try {
    const room = await readRoom(bookmark.id);
    if (!isCurrent()) return null;
    if (!room || room.archived || room.invite !== bookmark.invite) {
      forgetRoom(storage, uid, bookmark.id);
      return null;
    }
    return {bookmark, room};
  } catch (error) {
    if (!isCurrent()) return null;
    if (['permission-denied', 'not-found'].includes(error.code)) forgetRoom(storage, uid, bookmark.id);
    throw error;
  }
}
