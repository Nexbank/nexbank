import API from "./services/api";

test("resolves a usable API base URL", () => {
  expect(API.defaults.baseURL).toBeTruthy();
});
