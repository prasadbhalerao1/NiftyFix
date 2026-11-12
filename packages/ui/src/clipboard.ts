/**
 * Copy text to the clipboard. The tool frame is cross-origin, where some
 * browsers block the Clipboard API; the older copy command still works there.
 */
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.className = 'fixed -left-[9999px] top-0';
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}
