import React, { useEffect, useMemo, useState } from "react";

const COLOR = {
  bg: "#E5E5E5",
  card: "#FFFFFF",
  border: "#E0E0E0",
  text: "#111827",
  muted: "#6B7280",
  blue: "#7695EC",
  blueDark: "#5F7BDE",
  grayBtn: "#BDBDBD",
  red: "#FF5151",
  green: "#47B960",
};

const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  const m = Math.floor(diff / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} day${d > 1 ? "s" : ""} ago`;
  if (h > 0) return `${h} hour${h > 1 ? "s" : ""} ago`;
  if (m > 0) return `${m} minute${m > 1 ? "s" : ""} ago`;
  return "just now";
};

export default function App() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const u = sessionStorage.getItem("username");
    if (u) setUsername(u);
  }, []);
  const handleSignup = (u) => {
    setUsername(u);
    sessionStorage.setItem("username", u);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLOR.bg }}>
      {!username ? (
        <SignupModal onSubmit={handleSignup} />
      ) : (
        <MainScreen username={username} />
      )}
      <GlobalStyles />
    </div>
  );
}

function SignupModal({ onSubmit }) {
  const [name, setName] = useState("");
  const disabled = !name.trim();

  const submit = (e) => {
    e.preventDefault();
    if (!disabled) onSubmit(name.trim());
  };

  return (
    <div className="overlay">
      <div className="dialog" aria-modal role="dialog">
        <h3 className="h3">Welcome to CodeLeap network!</h3>
        <p className="muted">Please enter your username</p>
        <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
          <input
            className="input"
            placeholder="John doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "end" }}>
            <button className={`btn ${disabled ? "btn--disabled" : "btn--blue"}`} disabled={disabled}>
              ENTER
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MainScreen({ username }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("https://jsonplaceholder.typicode.com/posts?_limit=4")
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const now = Date.now();
        const seeded = data.map((p, i) => ({
          id: p.id,
          title: p.title,
          content: p.body ?? "Lorem ipsum dolor sit amet.",
          username: i % 2 ? "otherUser" : username,
          createdAt: now - i * 1000 * 60 * 20,
        }));
        setPosts(seeded);
      });
    return () => (alive = false);
  }, [username]);

  const sorted = useMemo(
    () => [...posts].sort((a, b) => b.createdAt - a.createdAt),
    [posts]
  );

  const canCreate = title.trim() && content.trim();

  const handleCreate = (e) => {
    e.preventDefault();
    if (!canCreate) return;
    const newPost = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      username,
      createdAt: Date.now(),
    };
    setPosts((p) => [newPost, ...p]);
    setTitle("");
    setContent("");
  };

  const handleSaveEdit = (id, newTitle, newContent) => {
    setPosts((p) =>
      p.map((x) => (x.id === id ? { ...x, title: newTitle, content: newContent } : x))
    );
    setEditing(null);
  };

  const handleConfirmDelete = () => {
    if (!deleting) return;
    setPosts((p) => p.filter((x) => x.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <>
      <header className="topbar">CodeLeap Network</header>

      <main className="container">
        <section className="card">
          <h4 className="h4">What's on your mind?</h4>

          <form onSubmit={handleCreate} className="form">
            <label className="label">Title</label>
            <input
              className="input"
              placeholder="Hello world"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label className="label">Content</label>
            <textarea
              className="textarea"
              placeholder="Content here"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "end" }}>
              <button className={`btn ${canCreate ? "btn--blue" : "btn--disabled"}`} disabled={!canCreate}>
                Create
              </button>
            </div>
          </form>
        </section>

        {sorted.map((post) => (
          <article key={post.id} className="post">
            <header className="post__header">
              <div className="post__title">{post.title}</div>
              {post.username === username && (
                <div className="post__actions">
                  <button className="iconBtn" title="Delete" onClick={() => setDeleting(post)}>
                    🗑️
                  </button>
                  <button className="iconBtn" title="Edit" onClick={() => setEditing(post)}>
                    ✏️
                  </button>
                </div>
              )}
            </header>

            <div className="post__meta">
              <span>@{post.username}</span>
              <span>{timeAgo(post.createdAt)}</span>
            </div>

            <div className="post__content">{post.content}</div>
          </article>
        ))}
      </main>

      {deleting && (
        <div className="overlay">
          <div className="dialog" role="dialog" aria-modal>
            <h3 className="h3">Are you sure you want to delete this item?</h3>
            <div className="rowEnd">
              <button className="btn btn--ghost" onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button className="btn btn--red" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <EditModal
          post={editing}
          onCancel={() => setEditing(null)}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
}

function EditModal({ post, onCancel, onSave }) {
  const [t, setT] = useState(post.title);
  const [c, setC] = useState(post.content);
  const canSave = t.trim() && c.trim();

  return (
    <div className="overlay">
      <div className="dialog" role="dialog" aria-modal>
        <h3 className="h3">Edit Item</h3>

        <div className="form" style={{ marginTop: 8 }}>
          <label className="label">Title</label>
          <input className="input" value={t} onChange={(e) => setT(e.target.value)} />

        <label className="label">Content</label>
          <textarea className="textarea" value={c} onChange={(e) => setC(e.target.value)} />
        </div>

        <div className="rowEnd">
          <button className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn ${canSave ? "btn--green" : "btn--disabled"}`}
            disabled={!canSave}
            onClick={() => onSave(post.id, t.trim(), c.trim())}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      body { margin: 0; color: ${COLOR.text}; }
      .topbar{
        position: sticky; top: 0;
        background: ${COLOR.blue};
        color: white; height: 60px; display: flex;
        align-items: center; padding: 0 24px;
        font-weight: 700; box-shadow: 0 1px 0 #dfe4ff inset;
      }
      .container{ max-width: 720px; margin: 24px auto; padding: 0 16px; }

      .card{
        background: ${COLOR.card};
        border: 1px solid ${COLOR.border};
        border-radius: 8px; padding: 16px; margin-bottom: 16px;
      }
      .h3{ font-size: 18px; margin: 0 0 12px; font-weight: 700; }
      .h4{ font-size: 16px; margin: 0 0 12px; font-weight: 700; }
      .muted{ color: ${COLOR.muted}; margin: 0 0 8px; }

      .label{ font-size: 14px; color: ${COLOR.text}; margin: 8px 0 4px; }
      .input, .textarea{
        width: 100%; border: 1px solid ${COLOR.border};
        background: #fff; border-radius: 8px; padding: 10px 12px; font-size: 14px;
      }
      .textarea{ min-height: 96px; resize: vertical; }

      .btn{
        padding: 10px 16px; border-radius: 8px; font-weight: 700;
        border: 0; cursor: pointer; transition: filter .15s ease;
      }
      .btn:disabled{ cursor: not-allowed; }
      .btn--blue{ background: ${COLOR.blue}; color: #fff; }
      .btn--green{ background: ${COLOR.green}; color: #fff; }
      .btn--red{ background: ${COLOR.red}; color: #fff; }
      .btn--ghost{ background: #fff; border: 1px solid ${COLOR.border}; color: ${COLOR.text}; }
      .btn--disabled{ background: ${COLOR.grayBtn}; color: #fff; }

      .form{ display: grid; gap: 6px; }

      .post{
        border-radius: 8px; overflow: hidden; border: 1px solid ${COLOR.border};
        background: ${COLOR.card}; margin-bottom: 16px;
      }
      .post__header{
        background: ${COLOR.blue};
        color: #fff; padding: 12px 16px; font-weight: 700;
        display: flex; justify-content: space-between; align-items: center;
      }
      .post__title{ margin-right: 8px; }
      .post__actions{ display: flex; gap: 8px; }
      .iconBtn{
        border: 1px solid rgba(255,255,255,.6);
        background: transparent; color: #fff; border-radius: 6px;
        padding: 4px 8px; cursor: pointer;
      }
      .post__meta{
        display: flex; justify-content: space-between; color: ${COLOR.muted};
        font-size: 12px; padding: 10px 16px 0;
      }
      .post__content{ padding: 8px 16px 16px; white-space: pre-wrap; }

      .overlay{
        position: fixed; inset: 0; background: rgba(0,0,0,.5);
        display: grid; place-items: center; padding: 16px; z-index: 50;
      }
      .dialog{
        width: min(520px, 92vw); background: #fff; border-radius: 8px;
        border: 1px solid ${COLOR.border}; padding: 16px;
      }
      .rowEnd{ display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
    `}</style>
  );
}
