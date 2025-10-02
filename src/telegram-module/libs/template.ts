export function templateReplace(
  text: string,
  placeholder: Record<string, any>,
): string {
  const values = text.matchAll(/\${([a-zA-Z0-9]+)}/g);

  let result = text;

  for (const item of [...values]) {
    result = result.replace(item[0], placeholder[item[1]]);
  }

  return result;
}
