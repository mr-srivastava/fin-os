import { isFundPair, type FundPair, type FundResearch, type MetricKey } from "./fund.types";
import type { ApiError } from "./fund.schema";

const validError = {
  error: "not_found",
  message: "Fund unavailable",
} satisfies ApiError;

const validMetricKey: MetricKey = "fiveYear";

// @ts-expect-error API errors must use a documented code.
const invalidError: ApiError = { error: "invalid_response", message: "Client-only code" };

// @ts-expect-error Metric maps must use one of the known keys.
const invalidMetricKey: MetricKey = "totalReturn";

const funds: FundResearch[] = [];
if (isFundPair(funds)) {
  const pair: FundPair<FundResearch> = funds;
  void pair;
}

void validError;
void validMetricKey;
void invalidError;
void invalidMetricKey;
