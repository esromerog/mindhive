export const serverGraphqlUrl =
  process.env.NODE_ENV === "production"
    ? "https://backend.mindhive.science/api/graphql"
    : "http://localhost:4444/api/graphql";

export const SAVE_AGGREGATED_RESULTS = `
  mutation createSummaryResult(
    $input: SummaryResultCreateInput!
  ) {
    createSummaryResult(
      data: $input
    ) {
      id
    }
  }
`;
