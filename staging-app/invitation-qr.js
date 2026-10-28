import qrcode from './vendor/qrcode-generator.js';
import {invitationFrom} from './room-session.js';

export function invitationMatrix(input) {
  const url = new URL(input);
  const local = ['127.0.0.1', 'localhost'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      url.username || url.password || !invitationFrom(url.href) || url.href.length > 2048) {
    throw Error('A complete, secure Money Room invitation is required.');
  }
  const code = qrcode(0, 'M');
  code.addData(url.href, 'Byte');
  code.make();
  return {
    url: url.href,
    size: code.getModuleCount(),
    dark: (row, column) => code.isDark(row, column)
  };
}

export async function invitationQrFile(input) {
  const matrix = invitationMatrix(input);
  const quiet = 4, scale = 8;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = (matrix.size + quiet * 2) * scale;
  const context = canvas.getContext('2d');
  if (!context) throw Error('QR image creation is unavailable.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#000';
  for (let row = 0; row < matrix.size; row++) {
    for (let column = 0; column < matrix.size; column++) {
      if (matrix.dark(row, column)) context.fillRect((column + quiet) * scale, (row + quiet) * scale, scale, scale);
    }
  }
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(Error('QR image could not be saved.')), 'image/png'));
  return new File([blob], 'dagger-money-room-invitation.png', {type: 'image/png'});
}

function saveQrFile(file) {
  const objectUrl = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
}

export function createInvitationSharing({navigator: nav = globalThis.navigator, makeFile = invitationQrFile, saveFile = saveQrFile} = {}) {
  let active = null;
  function prepare(url) {
    if (active?.url === url) return active.ready;
    const entry = {url, file: null};
    active = entry;
    // Warm the PNG before a tap so native sharing retains user activation.
    entry.ready = Promise.resolve().then(() => makeFile(url)).then(file => {
      if (active === entry) entry.file = file;
      return active === entry ? file : null;
    }).catch(() => null);
    return entry.ready;
  }
  async function share(url, {qr = false} = {}) {
    const file = qr && active?.url === url ? active.file : null;
    if (file) {
      const payload = {title: 'Dagger Money Room', url, files: [file]};
      try {
        if (nav.share && nav.canShare?.(payload)) {
          await nav.share(payload);
          return {kind: 'qr-share'};
        }
      } catch (error) {
        if (error.name === 'AbortError') return {kind: 'cancelled'};
      }
      // Browsers without native file sharing can save the scannable image.
      saveFile(file);
      let linkCopied = false;
      try { await nav.clipboard.writeText(url); linkCopied = true; } catch {}
      return {kind: 'qr-download', linkCopied};
    }
    if (qr) prepare(url);
    if (nav.share) {
      try { await nav.share({title: 'Dagger Money Room', url}); return {kind: 'link-share'}; }
      catch (error) { if (error.name === 'AbortError') return {kind: 'cancelled'}; }
    }
    await nav.clipboard.writeText(url);
    return {kind: 'link-copy'};
  }
  return {prepare, share, clear: () => { active = null; }};
}
