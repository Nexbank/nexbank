import { formatCurrency } from "./utils/currency";

test("formats currency values for banking screens", () => {
  expect(formatCurrency(1250.5)).toContain("1");
  expect(formatCurrency(1250.5)).toContain("250");
});
