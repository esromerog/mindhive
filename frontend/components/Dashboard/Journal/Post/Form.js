import JoditEditor from "../../../Jodit/Editor";
import StyledNote from "../../../styles/StyledNote";

export default function CreatePost({
  journal,
  user,
  content,
  setContent,
  title,
  setTitle,
  handleSave,
  headerTitle,
}) {
  return (
    <StyledNote>
      <h1>{headerTitle}</h1>
      <label htmlFor="title">
        <p>Title</p>
        <input
          type="text"
          id="title"
          name="title"
          value={title}
          onChange={({ target }) => setTitle(target?.value)}
          required
        />
      </label>
      <JoditEditor content={content} setContent={setContent} />
      <button onClick={handleSave}>Save</button>
    </StyledNote>
  );
}
