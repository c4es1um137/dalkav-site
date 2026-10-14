// Builds the email link and copy button from encoded parts (§5).
// The HTML only contains reversed+base64 parts and a "name [at] dalkav [dot] uk" fallback.

const decode = (part: string) => [...atob(part)].reverse().join('');
// The scheme is assembled at runtime so the page source never contains it.
const SCHEME = ['mail', 'to'].join('') + ':';

for (const el of document.querySelectorAll<HTMLElement>('[data-email]')) {
  const { u, d, copied = 'Copied' } = el.dataset;
  if (!u || !d) continue;
  let address: string;
  try {
    address = `${decode(u)}@${decode(d)}`;
  } catch {
    continue;
  }

  const link = el.querySelector<HTMLAnchorElement>('[data-email-link]');
  const text = el.querySelector<HTMLElement>('[data-email-text]');
  if (link && text) {
    link.href = SCHEME + address;
    text.textContent = address;
    link.hidden = false;
    el.querySelector<HTMLElement>('[data-email-fallback]')?.setAttribute('hidden', '');
  }

  const button = el.querySelector<HTMLButtonElement>('[data-email-copy]');
  const status = el.querySelector<HTMLElement>('[data-email-status]');
  if (button && navigator.clipboard) {
    button.hidden = false;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(address);
        if (status) status.textContent = copied;
        button.dataset.copied = '';
        setTimeout(() => {
          if (status) status.textContent = '';
          delete button.dataset.copied;
        }, 2500);
      } catch {
        // Clipboard denied: the address is still visible and selectable.
      }
    });
  }
}
