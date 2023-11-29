import absoluteUrl from "next-absolute-url";
import { useState } from "react";

import debounce from "lodash.debounce";

import DownloadRawData from "../Download/RawData";
import DownloadSummaryData from "../Download/Summary";
import DownloadByComponent from "../Download/ByComponent";

export default function Header({ study, slug, participants, components }) {
  const { origin } = absoluteUrl();

  const fileDirs =
    study?.datasets?.map(
      (dataset) => dataset?.date.replaceAll("-", "/") + "/" + dataset?.token
    ) || [];

  const [keyword, setKeyword] = useState("");

  const copyLink = () => {
    const copyLink = `${origin}/studies/${slug}`;
    const temp = document.createElement("input");
    document.body.append(temp);
    temp.value = copyLink;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    alert("The link is copied");
  };

  const debouncedSearch = debounce((value) => {
    // this.setState({
    //   search: value,
    //   page: 1,
    //   guestPage: 1,
    // });
  }, 1000);

  const saveToState = (e) => {
    // this.setState({
    //   [e.target.name]: e.target.value,
    // });
    setKeyword(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className="header">
      <div className="study">
        <div className="shareStudy">
          <p>
            Share the link below with your participants to invite them to join
            your study
          </p>
          <h3>
            {origin}/studies/{slug}
          </h3>
          <div className="buttons">
            <div>
              <button onClick={() => copyLink()}>Copy study link</button>
            </div>
            <div>
              <a
                target="_blank"
                href={`${origin}/studies/${slug}`}
                rel="noreferrer"
              >
                <button>Test your study</button>
              </a>
            </div>
          </div>
        </div>
        <div className="downloadOptions">
          <h3>All data in one file</h3>
          <DownloadSummaryData
            by=""
            study={study}
            participantsInStudy={participants}
            components={components}
          />

          <DownloadSummaryData
            by="by participant"
            study={study}
            participantsInStudy={participants}
          />

          {fileDirs.length > 0 && (
            <DownloadRawData
              slug={slug}
              fileDirs={fileDirs}
              components={components}
            />
          )}
        </div>
        <DownloadByComponent
          studyId={study?.id}
          study={study}
          components={components}
          participantsInStudy={participants}
        />
      </div>
      {/* <div className="searchArea">
        <input
          type="text"
          name="keyword"
          value={keyword}
          onChange={saveToState}
          placeholder="Search for participants"
        />
      </div> */}
    </div>
  );
}