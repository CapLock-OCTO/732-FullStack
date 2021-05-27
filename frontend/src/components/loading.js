import React from "react";
const loadingImg =
  "https://cdn.auth0.com/blog/auth0-react-sample/assets/loading.svg";

const Loading = () => (
  <div
    className="spinner"
    style={{
      position: "absolute",
      display: "flex",
      justifyContent: "center",
      height: "100vh",
      width: "100vw",
      backgroundColor: "white",
    }}
  >
    <img src={loadingImg} alt="Loading..." />
  </div>
);

export default Loading;
