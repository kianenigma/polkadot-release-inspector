import { useState } from 'react';
import './PrCollapse.scss';
import Collapsible from 'react-collapsible';
import { CircleLoader } from 'react-spinners';

interface PrInterface {
  repo: string
  id: string
  author: string
  title: string
}

export const PrCollapse = ({ release }: any) => {
  console.log('release.pull_requests.length', release.pull_requests.length)

  const [open, setOpen] = useState<boolean>(false);

  if (release.pull_requests.length === 0) {
    return <div className='prs_title_loading'>
      <CircleLoader
        color="#eb0000"
        size={20}
      />
      <span className="loading">Loading...</span>
    </div>
  }

  return (
    <Collapsible
      trigger={<div className={`prs_title${open ? '_open' : '_close'}`}>Release's PRs</div>}
      onTriggerOpening={() => setOpen(true)}
      onTriggerClosing={() => setOpen(false)}
    >
      <div className="prs">
        {
          release.pull_requests?.map((pr: PrInterface) => (
            <div className="pr">
              <span className="repo">[{pr.repo}]</span> PR{' '}
              <span className="id">{pr.id}</span> by{' '}
              <span className="author">{pr.author}</span>: {pr.title}
            </div>
          ))
        }
      </div>
    </Collapsible >
  )
}