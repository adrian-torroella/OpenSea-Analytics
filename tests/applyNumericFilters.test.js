const applyNumericFilters = require("../utils/applyNumericFilters");

test("Test if numeric filters apply", () => {
  const assets = {
    0: {
      traits: {
        eyes: "bloody",
        mouth: "red",
        loveliness: 0,
        shyness: 19,
      },
    },
    1: {
      traits: {
        eyes: "bloody",
        mouth: "red",
        loveliness: 190,
        shyness: 60,
      },
    },
    2: {
      traits: {
        eyes: "hot",
        mouth: "blue",
        loveliness: 10,
        shyness: 70,
      },
    },
    3: {
      traits: {
        eyes: "hot",
        mouth: "1234",
        loveliness: 150,
        shyness: 50,
      },
    },
  };

  const numericFiltersString =
    "loveliness__min: 5; loveliness__max: 150; shyness__min: 50; mouth__max: 10";

  expect(applyNumericFilters(assets, numericFiltersString)).toEqual({
    // 0: {
    //   traits: {
    //     eyes: "bloody",
    //     mouth: "red",
    //     loveliness: 0,
    //     shyness: 19,
    //   },
    // },
    // 1: {
    //   traits: {
    //     eyes: "bloody",
    //     mouth: "red",
    //     loveliness: 190,
    //     shyness: 60,
    //   },
    // },
    2: {
      traits: {
        eyes: "hot",
        mouth: "blue",
        loveliness: 10,
        shyness: 70,
      },
    },
    3: {
      traits: {
        eyes: "hot",
        mouth: "1234",
        loveliness: 150,
        shyness: 50,
      },
    },
  });
});
