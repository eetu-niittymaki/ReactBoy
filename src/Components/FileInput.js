import React from "react"
import { useRef } from "react";
import "./FileInput.css";

const FileInput = ({ handleChange }) => {
  const fileInputRef = useRef(null);

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  }

  const handleFileDrop = (event) => {
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleChange(event.dataTransfer.files[0])
    }
  }

  return (
    <div className="fileContainer">
      <div className="dropZone"
            onClick={handleFileUploadClick}
      >
        <div id="rom-drop">
            <div id="dropzone"
                onDrop={handleFileDrop}>
                <span>Choose ROM or drag it here</span>
            </div>
        </div>
        <div id="rom-file">
            <input id="file"
                    ref={fileInputRef}
                    type="file"
                    accept={".gb"}
                    style={{ display: "none" }}
                    onChange={event => handleChange(event.target.files[0])}
            />
        </div>
      </div>
    </div>
  );
}

export default FileInput
