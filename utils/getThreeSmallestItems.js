const filterRequiredTraits = (
  prices,
  traits,
  requiredTraitIndex,
  requiredTraitValue,
  isPair
) => {
  if (isPair)
    return Object.entries(prices).filter(
      ([key, value]) =>
        Object.keys(traits[key]).includes(requiredTraitIndex) &&
        traits[key][requiredTraitIndex].includes(requiredTraitValue)
    );
  return Object.entries(prices).filter(([key, value]) =>
    Object.values(traits[key]).includes(requiredTraitIndex)
  );
};

module.exports = (
  prices,
  traits,
  requiredTraitIndex,
  requiredTraitValue,
  isPair
) => {
  let minOneValue = Infinity;
  let minOneKey = null;
  let minTwoValue = Infinity;
  let minTwoKey = null;
  let minThreeValue = Infinity;
  let minThreeKey = null;
  for (const [key, value] of filterRequiredTraits(
    prices,
    traits,
    requiredTraitIndex,
    requiredTraitValue,
    isPair
  )) {
    if (value < minOneValue) {
      minThreeValue = minTwoValue;
      minThreeKey = minTwoKey;
      minTwoValue = minOneValue;
      minTwoKey = minOneKey;
      minOneValue = value;
      minOneKey = key;
    } else if (value < minTwoValue) {
      minThreeValue = minTwoValue;
      minThreeKey = minTwoKey;
      minTwoValue = value;
      minTwoKey = key;
    } else if (value < minThreeValue) {
      minThreeValue = value;
      minThreeKey = key;
    }
  }
  return [
    `${minOneKey}:${minOneValue}`,
    `${minTwoKey}:${minTwoValue}`,
    `${minThreeKey}:${minThreeValue}`,
  ];
};
