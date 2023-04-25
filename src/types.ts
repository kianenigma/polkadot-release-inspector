export interface Release {
  id: number;
  name: string;
  created_at: string;
  tag_name: string;
  prev_tag_name: string;
  substrate_commit: string;
  prev_substrate_commit: string;
  pull_requests: PullRequest[];
  searchResults?: any;
}

export interface PullRequest {
  id: number;
  title: string;
  author: string;
  repo: "substrate" | "polkadot" | "cumulus"
}
