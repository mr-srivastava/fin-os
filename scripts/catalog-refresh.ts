/** CLI entrypoint for a scheme catalogue refresh. All logic lives in lib/catalog-service.ts. */
import { catalogService } from "../lib/catalog-service.ts";

async function main() {
  const summary = await catalogService.refresh();
  console.table(
    Object.entries(summary.byCategory).map(([category, eligibleSchemes]) => ({
      category,
      eligibleSchemes,
    })),
  );
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
