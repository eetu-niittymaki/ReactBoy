import React from "react";

const ChooseFile = ({handleFileLoad}) => {
    return (
        <div className="rom-section">
          <div id="rom-file">
          <p>Choose ROM file:</p>
            <label>
              <input type="file" id="file" onChange={handleFileLoad} />
            </label>
          </div>
          <p>
            <span id="status"></span> <span id="game-name"></span>
          </p>
          <p id="error" className="hide"></p>
        </div>
    )
}

export default ChooseFile