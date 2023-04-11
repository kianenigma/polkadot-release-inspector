import React, { useEffect, useState } from 'react';

interface Release {
	id: number;
	name: string;

	tag_name: string;
	prev_tag_name: string;

	substrate_commit: string;
	prev_substrate_commit: string;

	pull_requests: PullRequest[];
}

interface PullRequest {
	id: number;
	title: string;
	author: string;
	repo: "substrate" | "polkadot"
}

const headers = {
	Authorization: `Bearer ${process.env.REACT_APP_GH_API}`,
}

function ReleaseList(): JSX.Element {
	const [releases, setReleases] = useState<Release[]>([]);
	const [filteredReleases, setFilteredReleases] = useState<Release[]>([]);
	const [searchQuery, setSearchQuery] = useState('');

	const getPrsBetween = async (repo: string, from: string, to: string): Promise<PullRequest[]> => {
		const commitsUrl = `https://api.github.com/repos/paritytech/${repo}/compare/${from}...${to}`;
		const commitsResponse = await fetch(commitsUrl, { headers });
		const diff = await commitsResponse.json();
		// @ts-ignore
		return diff.commits.map((c) => {
			return {
				author: c.author ? c.author.login : "UNKNOWN",
				id: c.commit.message.id,
				title: c.commit.message.replace(/\n/g, ""),
				repo
			}
		});
	};

	const getSubstrateVersion = async (commitHash: string): Promise<string | undefined> => {
		const content = await fetch(`https://api.github.com/repos/paritytech/polkadot/contents/Cargo.lock?ref=${commitHash}`, { headers })
			.then((d) => d.json())
			.then((data) => atob(data.content));
		return content.split("\n").find((l) => l.includes("https://github.com/paritytech/substrate?branch"))?.split("#")[1].slice(0, -1);
	};

	useEffect(() => {
		const process = async () => {
			const rawReleases: Release[] = await fetch('https://api.github.com/repos/paritytech/polkadot/releases', { headers })
				.then(response => response.json());
			let prevTagName = "";
			let prevSubstrateCommit = "";
			rawReleases.reverse()

			for (let release of rawReleases) {
				let substrate_commit = await getSubstrateVersion(release.tag_name);
				if (prevTagName.length) {
					let polkadot_prs = await getPrsBetween("polkadot", prevTagName, release.tag_name);
					let substrate_prs: PullRequest[] = prevSubstrateCommit.length ? await getPrsBetween("substrate", prevSubstrateCommit, substrate_commit!) : [];

					release.pull_requests = polkadot_prs.concat(substrate_prs);
					release.prev_tag_name = prevTagName;
					release.prev_substrate_commit = prevSubstrateCommit;
					release.substrate_commit = substrate_commit || "UNKNOWN";
				}

				prevSubstrateCommit = substrate_commit!;
				prevTagName = release.tag_name;
			}


			setReleases(rawReleases);
			setFilteredReleases(rawReleases);
		};
		process()
	}, []);

	useEffect(() => {
		const filtered = releases
			.filter((r) => r.pull_requests) // ideally should not be needed, I am not doing this right.
			.map((release) => {
				const filteredPRs = release.pull_requests.filter(pr => {
					return pr.title.includes(searchQuery) || pr.author.includes(searchQuery)
				});
				return {
					...release,
					pull_requests: filteredPRs
				};
			})
			.filter((release) => release.pull_requests.length)
		setFilteredReleases(filtered);
	}, [searchQuery, releases])

	return (
		<div>
			<h1>Polkadot Releases</h1>
			<input
				type="text"
				placeholder="Search PR titles"
				value={searchQuery}
				onChange={e => setSearchQuery(e.target.value)}
			/>
			{filteredReleases.reverse().map(release => {
				return (
					<div>
						<h2>
							{release.name} ({release.tag_name})
						</h2>
						<p>tag: {release.prev_tag_name}...{release.tag_name}</p>
						<p>substrate tag: {release.prev_substrate_commit}...{release.substrate_commit}</p>
						{/* <p>total PRs: {release.pull_requests ? "0" : release.pull_requests.length}</p> */}

						{
							release.pull_requests ? release.pull_requests.map(pr => (
								<pre>
									[{pr.repo}] PR {pr.id} by {pr.author}: {pr.title}
								</pre>
							)) : "..Loading"
						}
					</div>
				);
			})
			}
		</div>
	)
}

export default ReleaseList
