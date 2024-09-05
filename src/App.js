/* eslint-disable default-case */
import './App.css';
import { useEffect, useState, useRef } from 'react';
import GameboyJS from './dist/gameboy'; // Import the GameboyJS library

let g

function App() {
  const soundEnableRef = useRef(null);   // Ref for the sound checkbox
  const gameboyInstance = useRef(null);  // Ref to store the Gameboy instance
  const [zoom, setZoom] = useState("1")
  const [run, setRun] = useState(false)
  const [canvasWidth, setCanvasWidth] = useState(160)
  const [canvasHeight, setCanvasHeight] = useState(144)

  const positionLeftSwitch = () => {
    switch(zoom) {
      case "1": return "15%"
      case "2": return "5%"
      case "3": return "-5%"
    }
  }

  console.log(zoom)
  
  useEffect(() => {
    // Configuration of the GameboyJS emulator
    const options = {
      pad: { class: GameboyJS.Keyboard, mapping: null },
      romReaders: [
        new GameboyJS.RomFileReader(),
        new GameboyJS.RomDropFileReader(document.getElementById('dropzone'))
      ]
    };
    const canvas = document.getElementById('canvas')
    const c = canvas.getContext("2d")
    const image = document.getElementById("gb-image")
    g = new GameboyJS.Gameboy(canvas, options);
    c.drawImage(image, 0,0)
  }, [])

  useEffect(() => {
    // Set sound and screen zoom from the DOM elements
    g.setSoundEnabled(document.getElementById('sound-enable').checked);
    g.setScreenZoom(zoom);
    const canvas = document.getElementById("canvas")
    const position = canvas.getBoundingClientRect()
    setCanvasWidth(position.width)
    setCanvasHeight(position.height)
  })

  const pauseGame = (pause) => {
    if (gameboyInstance.current) {
      gameboyInstance.current.pause(pause);
    }
  };

  const handleChange = (event) => {
    const file = event.target.files[0]
    file && file.name.split(".")[1] === "gb" ? setRun(true) : setRun(false)
  }

  return (
    <div>
      <header className="App-header">
        <h1 className="headerTitle">ReactBoy</h1>
      </header>
      <div id="container" className="App">
        <div className="canvasOuter">
            <div className="canvasInner">
              <img id="gb-image"
                    className="gb-img"
                    src={run ? "/gameboy-on.png" : "/gameboy-off.png"}
                    width={canvasWidth * 3}
                    height={canvasHeight * 3} 
                    alt="Gameboy"
                    style={{left: positionLeftSwitch()}}/>
              <canvas id="canvas" 
                      className="canvas"
                      width="160"
                      height="144">
                    Your browser does not seem to support canvas.
              </canvas>
            </div>
          </div>
        <p className="commands">
          <button onClick={() => pauseGame(true)}>Pause</button>
          <button onClick={() => pauseGame(false)}>Run</button>
        </p>

        <p className="commands">
          <label>
            <input
              ref={soundEnableRef}
              id="sound-enable"
              type="checkbox"
              defaultChecked={false}
            /> 
            Enable sound (experimental)
          </label>
        </p>

        <p className="commands" >
          <label>
            Screen zoom
            <select id="screen-zoom" 
                    defaultValue="1" 
                    onChange={(e) => setZoom(e.target.value)}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </label>
        </p>

        <p>
          <span id="status"></span> <span id="game-name"></span>
        </p>
        <p id="error" className="hide"></p>

        <div className="rom-section">
          <div id="rom-file">
            <label>
              Choose a ROM file on your computer:
              <input type="file" 
                     id="file" 
                     onChange={handleChange}
              />
            </label>
          </div>

          <div id="rom-drop">
            <div id="dropzone">
              <p>Or drop a ROM file here</p>
            </div>
          </div>
        </div>

        <div id="keyboard-info" >
          <p>Current keyboard mapping:</p>
          <table>
            <thead>
              <tr><th>Gameboy pad</th><th>Keyboard mapping</th></tr>
            </thead>
            <tbody>
              <tr><td>A</td><td>G</td></tr>
              <tr><td>B</td><td>B</td></tr>
              <tr><td>START</td><td>H | Enter</td></tr>
              <tr><td>SELECT</td><td>N</td></tr>
              <tr><td>Directional pad</td><td>Arrow keys</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
