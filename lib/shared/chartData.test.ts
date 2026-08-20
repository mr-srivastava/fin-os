import { assert, test } from "vitest";
import { alignSeriesByMonth } from "./chartData";

test("aligns differently dated series to their latest shared monthly values", () => {
  assert.deepEqual(
    alignSeriesByMonth([
      [
        { date: "2024-12-24", value: 100 },
        { date: "2024-12-31", value: 104 },
        { date: "2025-01-30", value: 108 },
      ],
      [
        { date: "2024-12-27", value: 200 },
        { date: "2025-01-31", value: 210 },
        { date: "2025-02-28", value: 220 },
      ],
    ]),
    [
      { month: "2024-12", values: [104, 200] },
      { month: "2025-01", values: [108, 210] },
    ],
  );
});
