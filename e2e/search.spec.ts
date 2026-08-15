import { expect, test } from "@playwright/test";
import searchResponse from "../test/fixtures/scheme-search.json" with { type: "json" };

test("searches for a fund and opens its research route", async ({ page }) => {
  await page.route("**/api/schemes**", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(searchResponse) });
  });

  await page.goto("/");
  await page.getByLabel("Search mutual funds").fill("Parag Parikh");
  await page.getByRole("button", { name: "Search" }).click();

  const fundLink = page.getByRole("link", {
    name: "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
  });
  await expect(fundLink).toBeVisible();
  await fundLink.click();
  await expect(page).toHaveURL(/\/fund\/122639$/);
});
