export enum ESizeMapper {
  SMALL = 'size_small',
  MIDDLE = 'size_normal',
  BIG = 'size_big',
}

const sizeMap = {
  [ESizeMapper.SMALL]: 'Маленькие',
  [ESizeMapper.MIDDLE]: 'Средние',
  [ESizeMapper.BIG]: 'Большие',
};

export function sizeMapper(size: ESizeMapper) {
  if (!size.includes('size')) {
    return sizeMap[`size_${size}`] ?? 'Неизвестный размер';
  }

  return sizeMap[size] ?? 'Неизвестный размерчик';
}
