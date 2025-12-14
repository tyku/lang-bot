export type TTariff = {
  id: string;
  name: string;
  amount: number; // количество обработок
  price: number; // цена в звездах (XTR)
  label: string; // отображаемое название
}

export const TARIFFS: TTariff[] = [
  {
    id: 'tariff_1',
    name: 'Одна неделя полного доступа',
    amount: 7,
    price: 100,
    label: 'Неделя за 100 ⭐',
  },
  {
    id: 'tariff_2',
    name: 'Две недели полного доступа',
    amount: 14,
    price: 180,
    label: 'Две недели за 180 ⭐',
  },
  {
    id: 'tariff_3',
    name: '30 дней полного доступа',
    amount: 30,
    price: 350,
    label: '30 дней за 350 ⭐',
  },
];

export function getTariffById(id: string): TTariff | undefined {
  return TARIFFS.find((tariff) => tariff.id === id);
}

