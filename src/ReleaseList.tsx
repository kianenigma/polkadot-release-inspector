import { useEffect, useState } from 'react';

interface Release {
	id: number;
	name: string;
	created_at: string;

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
	repo: "substrate" | "polkadot" | "cumulus"
}

// const headers = process.env.REACT_APP_GH_API ? {
// 	Authorization: `Bearer ${process.env.REACT_APP_GH_API}`,
// } : {}
const headers = {};

function releaseLink(tag: string): string {
	return `https://github.com/paritytech/polkadot/releases/tag/${tag}`
}

function tagLink(tag: string): string {
	return `https://github.com/paritytech/polkadot/tree/${tag}`
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

	const getVersionFromCargo = async (repo: string, commitHash: string): Promise<string | undefined> => {
		const content = await fetch(`https://api.github.com/repos/paritytech/polkadot/contents/Cargo.lock?ref=${commitHash}`, { headers })
			.then((d) => d.json())
			.then((data) => atob(data.content));
		return content.split("\n").find((l) => l.includes(`https://github.com/paritytech/${repo}?branch`))?.split("#")[1].slice(0, -1);
	}

	useEffect(() => {
		const getReleases = async (): Promise<Release[]> => {
			const rawReleases: Release[] = await fetch('https://api.github.com/repos/paritytech/polkadot/releases', { headers })
				.then(response => response.ok ? response.json() : [])

			for (let i = 0; i < rawReleases.length; i++) {
				if (i !== (rawReleases.length - 1)) {
					rawReleases[i].prev_tag_name = rawReleases[i + 1].tag_name;
				}

				rawReleases[i].substrate_commit = "loading..";
				rawReleases[i].prev_substrate_commit = "loading..";

				rawReleases[i].pull_requests = []
			}

			setReleases(rawReleases);
			return rawReleases;
		}

		const getSubstrateCommits = async (givenReleases: Release[]) => {
			const newReleases = await Promise.all(givenReleases.map(async (r: Release) => {
				let substrate_commit = await getVersionFromCargo("substrate", r.tag_name);
				r.substrate_commit = substrate_commit!;
				return r
			}));

			for (let i = 0; i < newReleases.length; i++) {
				if (i !== newReleases.length - 1) {
					newReleases[i].prev_substrate_commit = newReleases[i + 1].substrate_commit
				}
			}

			// arrays are passed by ref.
			givenReleases = newReleases;
			setReleases(newReleases);
		};

		const getPrs = async (givenReleases: Release[]) => {
			const newReleases = await Promise.all(givenReleases.map(async (r: Release) => {
				if (r.prev_tag_name && r.prev_substrate_commit) {
					let polkadot_prs = await getPrsBetween("polkadot", r.prev_tag_name, r.tag_name);
					let substrate_prs = await getPrsBetween("substrate", r.prev_substrate_commit, r.substrate_commit);
					r.pull_requests = polkadot_prs.concat(substrate_prs);
				}
				return r
			}));

			givenReleases = newReleases;
			setReleases(newReleases);
		}


		const process = async () => {
			const fetchedReleases = await getReleases();
			await getSubstrateCommits(fetchedReleases);
			await getPrs(fetchedReleases);
		}

		process()
	}, []);

	useEffect(() => {
		if (!releases) { return; }
		const filtered = releases
			.map((release) => {
				const filteredPRs = release.pull_requests.filter(pr => {
					return pr.title.includes(searchQuery) || pr.author.includes(searchQuery)
				});
				return {
					...release,
					pull_requests: filteredPRs
				};
			})
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
			{filteredReleases.map(release => {
				return (
					<div>
						<h2>
							{release.name} ({release.tag_name})
						</h2>
						<p>tag: {release.prev_tag_name}...{release.tag_name}</p>
						<p>
							{releaseLink(release.tag_name)} / {tagLink(release.tag_name)}
						</p>
						<p>Release date: {release.created_at}</p>
						<p>substrate tag: {release.prev_substrate_commit}...{release.substrate_commit}</p>
						{
							release.pull_requests ? release.pull_requests.map(pr => (
								<pre>
									[{pr.repo}] PR {pr.id} by {pr.author}: {pr.title}
								</pre>
							)) : "..Loading"
						}
					</div>
				);
			})}
		</div>
	)
}

export default ReleaseList
