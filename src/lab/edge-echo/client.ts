// edge-echo client: fetch the Function and render the answer (≤ 3 KB gzipped).
// Builds DOM nodes with textContent only; never injects HTML.

const FIELDS = ['environment', 'colo', 'servedAt', 'message'] as const;

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-edge-echo]')) {
  const output = form.querySelector('output');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!output || !button) continue;
  const labels = JSON.parse(form.dataset.labels ?? '{}') as Record<(typeof FIELDS)[number], string>;

  const show = (node: Node) => output.replaceChildren(node);
  const text = (value: string, className = '') => {
    const p = document.createElement('p');
    p.textContent = value;
    p.className = className;
    return p;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    show(text(form.dataset.loading ?? '…'));
    try {
      const response = await fetch(form.action, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as Record<string, unknown>;
      const dl = document.createElement('dl');
      dl.className = 'grid grid-cols-[auto_1fr] gap-x-6 gap-y-2';
      for (const key of FIELDS) {
        const dt = document.createElement('dt');
        dt.className = 'text-foreground-muted';
        dt.textContent = labels[key] ?? key;
        const dd = document.createElement('dd');
        dd.className = 'text-foreground break-words';
        dd.textContent = data[key] == null ? '—' : String(data[key]);
        dl.append(dt, dd);
      }
      show(dl);
    } catch {
      show(text(form.dataset.error ?? 'Error', 'text-[#F5B83D]'));
    } finally {
      button.disabled = false;
    }
  });
}
