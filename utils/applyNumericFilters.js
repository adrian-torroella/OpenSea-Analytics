const parseFiltersString = require("./parseNumericFilterString");

const isNumber = (x) => typeof x === "number";

module.exports = (assets, numericfiltersString) => {
  if (numericfiltersString === null) return { ...assets };
  const numericFilters = parseFiltersString(numericfiltersString);
  const filteredAssets = {};
  let removeAsset;
  for (const tokenId in assets) {
    removeAsset = false;
    for (const traitName in assets[tokenId].traits) {
      if (isNumber(assets[tokenId].traits[traitName])) {
        if (
          assets[tokenId].traits[traitName] <
          numericFilters[`${traitName}__min`]
        ) {
          removeAsset = true;
          break;
        }
        if (
          assets[tokenId].traits[traitName] >
          numericFilters[`${traitName}__max`]
        ) {
          removeAsset = true;
          break;
        }
      }
    }
    if (removeAsset) continue;
    filteredAssets[tokenId] = assets[tokenId];
  }
  return filteredAssets;
};
