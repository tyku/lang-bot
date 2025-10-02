export function pluralize(count) {
  let message = '';
  if (count === 1) {
    message += `${count} бесплатную обработку`;
  } else if (count >= 2 && count <= 4) {
    message += `${count} бесплатные обработки`;
  } else {
    message += `${count} бесплатных обработок`;
  }

  return message;
}
