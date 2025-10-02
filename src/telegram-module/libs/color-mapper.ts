export enum EColorMapper {
  GINGER = 'color_ginger',
  BROWN = 'color_brown',
  BLONDE = 'color_blonde',
  DEFAULT = 'color_default',
}

const colorMap = {
  [EColorMapper.DEFAULT]: 'Как есть',
  [EColorMapper.GINGER]: 'Рыжие',
  [EColorMapper.BROWN]: 'Коричневые',
  [EColorMapper.BLONDE]: 'Белые',
};

export function colorMapper(color: EColorMapper) {
  if (!color.includes('color')) {
    return colorMap[`color_${color}`] ?? 'Неизвестный цвет';
  }

  return colorMap[color] ?? 'Неизвестный цвет';
}
