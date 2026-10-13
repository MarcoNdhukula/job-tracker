import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Clear the rendered DOM after each test so forms don't pile up between tests
afterEach(() => {
  cleanup();
});