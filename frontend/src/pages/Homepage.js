import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import "../styles/Homepage.css";
// import CloudinaryUploadWidget from './components/CloudinaryUploadWidget';

const API_BASE_URL = "http://localhost:5000/api";

const HomePage = () => {
  const [posts, setPosts] = useState(["not connected"]);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [newFile, setNewFile] = useState(null);
  const { user } = useAuth0();
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/threads`);
        const data = await response.json();
        
        // Sort posts by Likes in descending order (highest first)
        const sortedPosts = data.sort((a, b) => b.Likes - a.Likes);

        setPosts(sortedPosts); // Set sorted posts in state
      } catch (error) {
        console.error("Error fetching threads:", error);
      }
    };
    loadPosts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {    
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", "default");
      if (file) {
        try {
          const response = await fetch("https://api.cloudinary.com/v1_1/dpbfdejni/image/upload", {
            method: "POST",
            // for some reason headers breaks it. Probably becauses cloudinary upload is an http request?
            // headers: { "Content-Type": "application/json"},
            body: form
          });
          const data = await response.json();
          let secureURL = JSON.stringify(data.secure_url);
          setNewFile(secureURL);
        }
        catch (error) {
          console.log(error);
        }
      }
    }
  };

	// send post information to database as json
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    console.log(newFile);
    if (newPost.title && newPost.content) {
      try {
        const response = await fetch(`${API_BASE_URL}/threads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ThreadID: Date.now(),
            U_UserID: user ? user.sub : null,
						Username: user ? user.nickname : "Anon",
            Title: newPost.title,
            TextContent: newPost.content,
            Likes: 0,
            ImageContent: JSON.parse(newFile),
          }),
        });
        const createdPost = await response.json();
        console.log(createdPost.ImageContent);
        // Add the newly created post to the front of the list and sort
        setPosts((prev) => {
          const updatedPosts = [createdPost, ...prev];
          updatedPosts.sort((a, b) => b.Likes - a.Likes); // Re-sort after new post creation
          return updatedPosts;
        });
        // Reset form
        setNewPost({ title: "", content: "" });
        setNewFile(null);
        document.getElementById("file-upload").value = null;

				window.location.reload(); // FIXME: ?
      } catch (error) {
        console.error("Error creating post:", error);
      }
    }
  };

  return (
    <div className="homepage">
			{/* new post form */}
      <h1>Create a New Post</h1>
      <form onSubmit={handlePostSubmit} className="post-form">
				<div className="post-profile">
					{user ?
						<>
							<img src={user.picture} alt="Profile" id="pfp"/>
							<h6>{user.nickname}</h6>
						</>:
							<h6>Not Logged in. Posting as "Anon".</h6>
					}
				</div>
        <input
          type="text"
          name="title"
          placeholder="Enter post title"
          value={newPost.title}
          onChange={handleInputChange}
          required
        />
        <textarea
          name="content"
          placeholder="Write your post here..."
          value={newPost.content}
          onChange={handleInputChange}
          required
        />
        <input
          type="file"
          name="file-upload"
          id="file-upload"
          onChange={handleFileUpload}
        />
        <button type="submit">Create Post</button>
      </form>

			{/* all posts from database */}
      <div className="posts-container">
        <h2>All Posts</h2>
        <div className="posts">
          {posts[0] === "not connected" ?
						<div>Not connected to database.</div>
						: posts.map((post) => (
            <Link to={`/post/${post.ThreadID}`} state={post} key={post.ThreadID} className="post-link">
              <div className="post">
								<div className="post-profile">
									{/*<img src={user.picture} id="pfp"/> TODO: pfp*/}
									<h6>{post.User ? post.User : "Anon"}</h6>
								</div>
                <h3>{post.Title}</h3>
                <p>{post.TextContent}</p>
                {post.ImageContent && post.ImageContent !== "" && (
                  <img
                    src={post.ImageContent}
                    alt="Post Attachment"
                    style={{ width: "100%", maxHeight: "50%", objectFit: "contain" }}
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
