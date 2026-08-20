/**
 * CLI entrypoint for a scheme catalogue refresh. All logic lives in lib/catalog.service.ts.
 * Verbose by default (logs each category and snapshot-fetch chunk as it runs); pass --quiet
 * to suppress progress output and only print the final summary.
 */
import { catalogService } from "../lib/catalog.service.ts";

async function main() {
  const quiet = process.argv.includes("--quiet");
  const summary = await catalogService.refresh(
    quiet ? {} : { log: (message) => console.log(message) },
  );
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
