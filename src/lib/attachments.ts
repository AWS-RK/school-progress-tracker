export function attachmentDisplayName(pathOrUrl: string): string {
  const tail = pathOrUrl.split('/').pop() ?? pathOrUrl;
  return tail.replace(/^\d+-/, '');
}
