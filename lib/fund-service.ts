/** UI-facing facade for live, per-scheme fund lookups. Wraps finapiService; never touched directly by app/. */
import { finapiService } from "./finapi-service.ts";

export const fundService = {
  getFundResearch: finapiService.getFundResearch,
  getFundResearchBatch: finapiService.getFundResearchBatch,
  resolveIsin: finapiService.resolveIsin,
};
