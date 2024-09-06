import React from "react";

const ChooseFile = ({handleFileLoad}) => {
    return (
        <div className="rom-section">
          <div id="rom-file">
            <label>
              Choose a ROM file on your computer:
              <input type="file" id="file" onChange={handleFileLoad} />
            </label>
          </div>
        </div>
    )
}

export default ChooseFile