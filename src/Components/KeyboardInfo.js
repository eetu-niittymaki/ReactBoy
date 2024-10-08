import React from "react";

const KeyboardInfo = () => {
    return (
        <div>
          <h3>Use Keyboard or on screen <br/> buttons to control game</h3>
          <table>
            <thead>
              <tr>
                <th>Gameboy pad</th>
                <th>Keyboard mapping</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>A</td>
                <td>G</td>
              </tr>
              <tr>
                <td>B</td>
                <td>B</td>
              </tr>
              <tr>
                <td>START</td>
                <td>H or Enter</td>
              </tr>
              <tr>
                <td>SELECT</td>
                <td>N</td>
              </tr>
              <tr>
                <td>Directional pad</td>
                <td>Arrow keys</td>
              </tr>
            </tbody>
          </table>
        </div>
    )
}

export default KeyboardInfo