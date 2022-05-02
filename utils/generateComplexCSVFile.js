const path = require("path");
const fs = require("fs");

const containsRequiredTraits = (requiredTraits, assetTraits) => {
  return (
    Object.keys(requiredTraits).every(
      (requiredTraitName) =>
        assetTraits.hasOwnProperty(requiredTraitName) ||
        requiredTraits[requiredTraitName].includes("{none}")
    ) &&
    Object.keys(requiredTraits).every(
      (requiredTraitName) =>
        requiredTraits[requiredTraitName].includes(
          assetTraits[requiredTraitName]
        ) || !assetTraits.hasOwnProperty(requiredTraitName)
    )
  );
};

module.exports = async (
  enteredCollection,
  collectionTraits,
  requiredTraits
) => {
  const completed = [];
  const id = Number(Date.now());
  for (const tokenId of Object.keys(collectionTraits)) {
    const assetTraits = collectionTraits[tokenId];
    let traitsFound = null;
    if (containsRequiredTraits(requiredTraits, assetTraits)) {
      traitsFound = Object.keys(requiredTraits).reduce(
        (acc, requiredTraitName) =>
          `${acc} ${requiredTraitName}:${
            assetTraits[requiredTraitName] !== undefined
              ? assetTraits[requiredTraitName]
              : "{none}"
          }`,
        ""
      );
    }
    if (traitsFound !== null)
      completed.push(
        fs.promises.appendFile(
          path.join(".", `${enteredCollection}-${id}.csv`),
          `${enteredCollection}, ${tokenId}, ${
            Object.keys(requiredTraits).length
          }, ${traitsFound}\n`
        )
      );
  }
  await Promise.all(completed);
  return id;
};
