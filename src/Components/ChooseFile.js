import React from "react";
import FileInput from "./FileInput";

const ChooseFile = ({ handleFileLoad }) => {
  return (
    <div className="rom-section">
      <div id="rom-file">
        <FileInput handleChange={handleFileLoad} />
      </div>
      <div style={{paddingTop:  "5%"}}>
        <span id="status"></span> <span id="game-name"></span>
        <p id="error" className="hide"></p>
      </div>
    </div>
  )
}

export default ChooseFile