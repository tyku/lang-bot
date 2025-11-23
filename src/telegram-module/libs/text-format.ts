export const escapeText = (original: string) => original
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replaceAll('.', '\\.')
    .replaceAll('+', '\\+')
    .replaceAll('!', '\\!')
    .replaceAll('-', '\\-');