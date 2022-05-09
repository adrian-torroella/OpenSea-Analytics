module.exports = (numericFiltersString) => {
  const numericFiltersPairs = numericFiltersString
    .toLowerCase()
    .trim()
    .split(";")
    .map((numericFilterPair) => numericFilterPair.trim())
    .filter((numericFilterPair) => numericFilterPair.length !== 0);

  const numericFilters = {};

  for (const numericFilterPair of numericFiltersPairs) {
    if (numericFilterPair.split(":").length !== 2)
      throw new Error("Error parsing filters string.");

    const [traitName, filterValue] = numericFilterPair.split(":");
    if (!traitName.includes("__min") && !traitName.includes("__max"))
      throw new Error("Error parsing filters string.");
    if (filterValue) {
      if (isNaN(parseFloat(filterValue)))
        throw new Error("Error parsing filters string.");
    }
    numericFilters[traitName] = parseFloat(filterValue);
  }

  return numericFilters;
};
