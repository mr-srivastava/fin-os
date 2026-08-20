import { expect, test } from "@playwright/test";
import searchResponse from "../test/fixtures/scheme-search.json" with { type: "json" };
import { fundResearchViewFixture } from "../test/fixtures/fundResearchView";

const scheme = searchResponse.schemes[0]!;

test("adds a fund to a new watchlist and finds it there", async ({ page }) => {
  const watchlists: { id: string; name: string; count: number }[] = [];
  const items: Record<string, string[]> = {};

  await page.route("**/api/schemes**", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(searchResponse) });
  });

  await page.route(`**/api/funds/${scheme.schemeCode}`, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(fundResearchViewFixture(scheme)),
    });
  });

  await page.route("**/api/watchlists", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ watchlists }),
      });
      return;
    }
    if (request.method() === "POST") {
      const { name } = request.postDataJSON() as { name: string };
      const watchlist = {
        id: "wl1",
        name,
        count: 0,
        createdAt: "2026-08-19T00:00:00.000Z",
        updatedAt: "2026-08-19T00:00:00.000Z",
      };
      watchlists.push(watchlist);
      items[watchlist.id] = [];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ watchlist }),
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/watchlists/wl1/items", async (route) => {
    const { schemeCode } = route.request().postDataJSON() as { schemeCode: string };
    items.wl1!.push(schemeCode);
    watchlists[0]!.count = items.wl1!.length;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ watchlist: watchlists[0] }),
    });
  });

  await page.route("**/api/watchlists/wl1", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        watchlist: watchlists[0],
        funds: items.wl1!.map((schemeCode) => ({
          schemeCode,
          schemeName: scheme.schemeName,
          amc: scheme.amc,
          category: scheme.category,
          riskLabel: "Very High",
          aum: 45000,
          oneYearReturn: 18.4,
          threeYearReturn: 22.1,
          currentNav: 82.5,
        })),
        unavailableSchemeCodes: [],
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("Search mutual funds").fill("Parag Parikh");
  await page.getByRole("option", { name: scheme.schemeName }).click();
  await expect(page).toHaveURL(new RegExp(`/fund/${scheme.schemeCode}$`));

  await page.getByRole("button", { name: "Add to watchlist" }).click();
  await page.getByLabel("New watchlist name").fill("Core Picks");
  await page.getByRole("button", { name: "Create watchlist" }).click();

  const watchlistRow = page.getByText("Core Picks").locator("..");
  await expect(watchlistRow.getByRole("checkbox")).toBeChecked();

  await page.goto("/watchlists");
  await expect(page.getByRole("link", { name: "Core Picks" })).toBeVisible();

  await page.getByRole("link", { name: "Core Picks" }).click();
  await expect(page).toHaveURL(/\/watchlists\/wl1$/);
  await expect(page.getByRole("link", { name: scheme.schemeName })).toBeVisible();
});
