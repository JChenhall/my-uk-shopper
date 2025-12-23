const UK_SUPERMARKETS = [
  "Tesco",
  "Aldi",
  "Sainsburys",
  "Lidl",
  "Asda",
  "Morrisons",
  "Waitrose",
  "MnS",
];

export const mapApiToStores = (
  apiStores: string = "",
  apiBrand: string = ""
): string[] => {
  const foundStores: string[] = [];
  const combinedData = (apiStores + " " + apiBrand).toLowerCase();

  UK_SUPERMARKETS.forEach((store) => {
    if (combinedData.includes(store.toLowerCase())) {
      foundStores.push(store);
    }
  });

  // If it's a big brand like Lurpak or Heinz, it's likely in all "Big 4"
  if (foundStores.length === 0 && apiBrand.length > 0) {
    return ["Tesco", "Sainsburys", "Asda", "Morrisons"];
  }

  return foundStores;
};
