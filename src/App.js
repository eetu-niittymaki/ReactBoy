/* eslint-disable default-case */
import './App.css';
import { useEffect, useState, useRef } from 'react';
import ImageMapper from 'react-img-mapper';
import * as maps from "./utils/mapObject.js"
import GameboyJS from './dist/gameboy'; // Import the GameboyJS library

let g

function App() {
  const soundEnableRef = useRef(null);   // Ref for the sound checkbox
  const gameboyInstance = useRef(null);  // Ref to store the Gameboy instance
  const [zoom, setZoom] = useState("2")
  const [run, setRun] = useState(false)
  const [canvasWidth, setCanvasWidth] = useState(160)
  const [canvasHeight, setCanvasHeight] = useState(144)
  const scrollKeys = false


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
    g = new GameboyJS.Gameboy(canvas, options);

  }, [])

  useEffect(() => {
    // Set sound and screen zoom from the DOM elements
    g.setSoundEnabled(document.getElementById('sound-enable').checked);
    g.setScreenZoom(zoom);
    const canvas = document.getElementById("canvas")
    const position = canvas.getBoundingClientRect()
    setCanvasWidth(position.width)
    setCanvasHeight(position.height)
    // Disable keyboard scrolling
    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown":
          if (!scrollKeys) e.preventDefault();
          break;
        default: return true
      }
    })
  })

  const pauseGame = (pause) => {
    if (gameboyInstance.current) {
      gameboyInstance.current.pause(pause);
    }
  }

  const handleChange = (event) => {
    const file = event.target.files[0]
    file && file.name.split(".")[1] === "gb" ? setRun(true) : setRun(false)
  }

  return (
    <div>
      <header className="App-header">
        <h1 className="headerTitle">ReactBoy</h1>
      </header>
        <div className="canvasOuter">
          <div className="canvasInner" id="canvasInner">
          <ImageMapper src={run ? "/gameboy-on.png" : "/gameboy-off.png"}
                        map={maps.MAP}
                        width={canvasWidth * 2 * 0.90}
                        height={canvasHeight * 3.35}
                        alt="Gameboy"
                        responsive={true}
                        parentWidth={500}
                        />
            <canvas id="canvas"
              className="canvas"
              width="160"
              height="144">
              Your browser does not seem to support canvas.
            </canvas>
          </div>
        </div>
        <div id="container" className="App" >
          {/*<p className="commands">
            <button onClick={() => pauseGame(true)}>Pause</button>
            <button onClick={() => pauseGame(false)}>Run</button>
          </p>*/}
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
