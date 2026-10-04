export const moveItem = <Item>(items: Item[], index: number, direction: -1 | 1) => {
  const destination = index + direction;
  if (index < 0 || index >= items.length || destination < 0 || destination >= items.length) {
    return items;
  }

  const nextItems = [...items];
  [nextItems[index], nextItems[destination]] = [nextItems[destination], nextItems[index]];
  return nextItems;
};
