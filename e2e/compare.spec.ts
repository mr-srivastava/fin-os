import { expect, test } from "@playwright/test";
import { fundResearchViewFixture } from "../test/fixtures/fundResearchView";

const fundA = {
  schemeCode: "100001",
  schemeName: "Alpha Flexi Cap Fund - Direct Plan - Growth",
  amc: "Alpha Mutual Fund",
  category: "Flexi Cap",
  plan: "Direct Plan",
  option: "Growth",
};
const fundB = {
  schemeCode: "100002",
  schemeName: "Beta Flexi Cap Fund - Direct Plan - Growth",
  amc: "Beta Mutual Fund",
  category: "Flexi Cap",
  plan: "Direct Plan",
  option: "Growth",
};

test("selects two funds from Explore and views their comparison", async ({ page }) => {
  await page.route("**/api/explore**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        category: "Flexi Cap",
        schemes: [fundA, fundB].map((scheme) => ({
          ...scheme,
          nav: { date: "2026-08-19", nav: 82.5 },
          aum: 45000,
          riskLabel: "Very High",
          oneYearReturn: 18.4,
          threeYearReturn: 22.1,
        })),
      }),
    });
  });

  await page.route(`**/api/funds/${fundA.schemeCode}`, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(fundResearchViewFixture(fundA)),
    });
  });

  await page.route("**/api/compare**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        selections: [
          { status: "ready", scheme: fundA, currentNav: { date: "2026-08-19", nav: 82.5 } },
          { status: "ready", scheme: fundB, currentNav: { date: "2026-08-19", nav: 41.2 } },
        ],
        comparison: {
          status: "ready",
          data: {
            fundNames: [fundA.schemeName, fundB.schemeName],
            performance: { status: "unavailable", message: "Performance data is not available." },
            metrics: { status: "unavailable", message: "Metric data is not available." },
            facts: [],
            portfolio: { status: "unavailable", message: "Portfolio data is not available." },
          },
        },
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("checkbox", { name: `Select ${fundA.schemeName}` }).check();
  await page.getByRole("checkbox", { name: `Select ${fundB.schemeName}` }).check();

  await expect(page.getByText("2 selected")).toBeVisible();
  const compareButton = page.getByRole("button", { name: "Compare" });
  await expect(compareButton).toBeEnabled();
  await compareButton.click();

  await expect(page).toHaveURL(
    new RegExp(`/fund/${fundA.schemeCode}\\?.*against=${fundB.schemeCode}`),
  );
  await expect(page.getByText(fundA.schemeName).first()).toBeVisible();
  await expect(page.getByText(fundB.schemeName).first()).toBeVisible();
});
