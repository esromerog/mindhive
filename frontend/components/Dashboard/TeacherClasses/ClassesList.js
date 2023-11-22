import { useQuery } from "@apollo/client";
import Link from "next/link";
import moment from "moment";

import { GET_CLASSES } from "../../Queries/Classes";

export default function ClassesList({ query, user }) {
  const { data, error, loading } = useQuery(GET_CLASSES, {
    variables: {
      input: {
        OR: [
          {
            creator: {
              id: { equals: user?.id },
            },
          },
          {
            mentors: {
              some: { id: { equals: user?.id } },
            },
          },
        ],
      },
    },
  });

  const classes = data?.classes || [];

  if (classes.length === 0) {
    return (
      <>
        <h3>You haven’t created any classes yet.</h3>
        <p>Once you create a class, it will appear here.</p>
      </>
    );
  }

  return (
    <>
      <div className="classListHeader">
        <div>Class name</div>
        <div>Teacher</div>
        <div>Number of students</div>
        <div>Date created</div>
      </div>

      <div className="board">
        {classes?.map((myclass, i) => (
          <Link
            key={i}
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
            }}
          >
            <div className="classListRow">
              <div>{myclass?.title}</div>
              <div>{myclass?.creator?.username}</div>
              <div>{myclass?.students?.length}</div>
              <div>{moment(myclass?.createdAt).format("MMMM D, YYYY")}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
