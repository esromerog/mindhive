import gql from "graphql-tag";

// The bank grid. Deliberately does NOT ask for `codeFiles` or `docs` — the
// whole point of moving source text onto a child list was to keep it off the
// rows a list view projects.
export const MY_VISUALS = gql`
  query MY_VISUALS($where: VisualWhereInput) {
    visuals(where: $where, orderBy: [{ lastTimeEdited: desc }, { createdAt: desc }]) {
      id
      title
      description
      privacy
      published
      participationMode
      createdAt
      lastTimeEdited
      cover {
        publicUrlTransformed(transformation: { width: "600" })
      }
      author {
        id
        username
      }
      collaborators {
        id
        username
      }
      viewers {
        id
        username
      }
    }
  }
`;

// Everything the builder shell needs in one round trip.
export const VISUAL = gql`
  query VISUAL($id: ID!) {
    visual(where: { id: $id }) {
      id
      title
      description
      privacy
      published
      participationMode
      docs
      docsVisible
      parameters
      createdAt
      lastTimeEdited
      cover {
        publicUrlTransformed(transformation: { width: "600" })
      }
      code {
        url
      }
      author {
        id
        username
      }
      collaborators {
        id
        username
      }
      viewers {
        id
        username
      }
      codeFiles {
        id
        name
        language
        role
        order
        content
        lastTimeEdited
      }
    }
  }
`;

// Powers the collaborator search in the Settings tab's Editing section.
export const SEARCH_PROFILES = gql`
  query SEARCH_PROFILES($search: String!) {
    profiles(
      where: { username: { contains: $search, mode: insensitive } }
      take: 8
    ) {
      id
      username
    }
  }
`;
