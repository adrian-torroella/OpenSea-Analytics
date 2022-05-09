const parseNumericFilterString = require("../utils/parseNumericFilterString");

test("Parses a correct string", () => {
  const input1 = "price__min: 15; price__max: 30; blood lust__max: 20";

  expect(parseNumericFilterString(input1)).toEqual({
    price__min: 15,
    price__max: 30,
    "blood lust__max": 20,
  });

  const input2 = "price__min: 15; price__max: 30.7; blood lust__max: 20.99";

  expect(parseNumericFilterString(input2)).toEqual({
    price__min: 15,
    price__max: 30.7,
    "blood lust__max": 20.99,
  });
});

test("Throws an error in case of incorrect string", () => {
  const input1 = "shyness__max 50 loveliness__min ";

  expect(() => parseNumericFilterString(input1)).toThrow();

  const input2 = "shyness__max: hi; loveliness__min: 128.8";

  expect(() => parseNumericFilterString(input2)).toThrow();
});
