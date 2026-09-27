import { expect, test } from "@playwright/test";
import { createUniqueIndexedName } from "@dashlet/shared/utils/createUniqueIndexedName";

test("uses the first available number", () => {
  expect(createUniqueIndexedName(["logic-1", "logic-3", "logic-4"], "logic-")).toBe("logic-2");
});

test("supports file path prefixes and suffixes", () => {
  expect(
    createUniqueIndexedName(
      ["logic/analysis_1.py", "logic/analysis_2.py"],
      "logic/analysis_",
      ".py",
    ),
  ).toBe("logic/analysis_3.py");
});
