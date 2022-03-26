module.exports = (traitsString) => {
  if (traitsString.includes(":")) {
    const resultTraits = {
      pairs: true,
    };
    const traitsPairs = traitsString
      .toLowerCase()
      .split(";")
      .map((traitPair) => traitPair.trim())
      .filter((traitPair) => traitPair.length !== 0);
    for (const traitPair of traitsPairs) {
      const [traitName, traitValues] = traitPair
        .split(":")
        .map((traitVariable) => traitVariable.trim())
        .filter((trait) => trait.length !== 0);
      resultTraits[traitName] = traitValues
        .split(",")
        .map((traitValue) => traitValue.trim())
        .filter((traitValue) => traitValue.length !== 0);
    }
    return resultTraits;
  } else {
    const resultTraits = {
      pairs: false,
    };
    const traits = traitsString
      .toLowerCase()
      .split(";")
      .map((trait) => trait.trim())
      .filter((trait) => trait.length !== 0);
    for (const trait of traits) {
      resultTraits[trait] = null;
    }
    return resultTraits;
  }
};
