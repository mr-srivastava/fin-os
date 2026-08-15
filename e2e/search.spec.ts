import { expect, test } from "@playwright/test";
import searchResponse from "../test/fixtures/scheme-search.json" with { type: "json" };

test("searches for a fund and opens its research route", async ({ page }) => {
  await page.route("**/api/schemes**", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(searchResponse) });
  });

  await page.goto("/");
  await page.getByLabel("Search mutual funds").fill("Parag Parikh");
  await page.getByRole("button", { name: "Search" }).click();

  const fundResult = page.getByRole("button", {
    name: "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
  });
  await expect(fundResult).toBeVisible();
  await fundResult.click();
  await expect(page).toHaveURL(/\/fund\/122639$/);
});
