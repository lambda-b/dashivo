export const createUniqueIndexedName = (
  existingNames: Iterable<string>,
  prefix: string,
  suffix = "",
) => {
  const existing = new Set(existingNames);
  let index = 1;
  while (existing.has(`${prefix}${index}${suffix}`)) index += 1;
  return `${prefix}${index}${suffix}`;
};
