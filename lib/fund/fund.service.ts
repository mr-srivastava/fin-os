/** UI-facing facade for live, per-scheme fund lookups. Wraps finapiService; never touched directly by app/. */
import { finapiService } from "../providers/finapi.service";

export const fundService = {
  getFundResearch: finapiService.getFundResearch,
  getFundResearchBatch: finapiService.getFundResearchBatch,
  getFundSnapshots: finapiService.getFundSnapshots,
  resolveIsin: finapiService.resolveIsin,
};
