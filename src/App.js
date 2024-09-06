import './App.css'
import { useEffect, useState, useRef, useCallback } from 'react'
import ImageMapper from 'react-img-mapper'
import KeyboardInfo from './Components/KeyboardInfo.js'
import ChooseFile from './Components/ChooseFile.js'
import * as kbEvents from "./utils/keyboardEvents.js"
import * as maps from "./utils/mapObject"
import GameboyJS from './dist/gameboy' // Import the GameboyJS library

function App() {
  const soundEnableRef = useRef(null) // Ref for the sound checkbox
  const gameboyInstance = useRef(null) // Ref to store the Gameboy instance
  const [run, setRun] = useState(false)
  const [canvasWidth, setCanvasWidth] = useState(160)
  const [canvasHeight, setCanvasHeight] = useState(144)
  const hoverRef = useRef(null)
  const canvasRef = useRef(null)
  const scrollKeys = useRef(false)

  // Initialize GameboyJS instance
  useEffect(() => {
    const options = {
      pad: { class: GameboyJS.Keyboard, mapping: null },
      romReaders: [
        new GameboyJS.RomFileReader(),
        new GameboyJS.RomDropFileReader(canvasRef.current)
      ]
    }

    const canvas = canvasRef.current
    gameboyInstance.current = new GameboyJS.Gameboy(canvas, options)
    gameboyInstance.current.setScreenZoom(2)
  }, [])

  // Set sound and canvas dimensions
  useEffect(() => {
    const gameboy = gameboyInstance.current
    if (gameboy) {
      gameboy.setSoundEnabled(soundEnableRef.current.checked)

      const { width, height } = canvasRef.current.getBoundingClientRect()
      setCanvasWidth(width)
      setCanvasHeight(height)
    }

    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown":
          if (!scrollKeys.current) e.preventDefault()
          break
        default:
          break
      }
    }

    // Prevent scrolling for arrow keys
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const enterArea = useCallback((area) => {
    hoverRef.current = area.name
  }, [])

  const leaveArea = useCallback(() => {
    hoverRef.current = null
  }, [])

  const handleFileLoad = (event) => {
    const file = event.target.files[0]
    if (file && file.name.split(".")[1] === "gb") {
      setRun(true)
    } else {
      setRun(false)
    }
  }

  const handleClick = useCallback(() => {
    const action = hoverRef.current
    if (action) {
      const eventMapping = {
        A: [kbEvents.aEvent, kbEvents.aEventUp],
        B: [kbEvents.bEvent, kbEvents.bEventUp],
        Up: [kbEvents.upEvent, kbEvents.upEventUp],
        Down: [kbEvents.downEvent, kbEvents.downEventUp],
        Left: [kbEvents.leftEvent, kbEvents.leftEventUp],
        Right: [kbEvents.rightEvent, kbEvents.rightEventUp],
        Start: [kbEvents.startEvent, kbEvents.startEventUp],
        Select: [kbEvents.selectEvent, kbEvents.selectEventUp]
      }

      const [eventDown, eventUp] = eventMapping[action] || []
      if (eventDown && eventUp) {
        document.dispatchEvent(eventDown)
        setTimeout(() => {
          document.dispatchEvent(eventUp)
        }, 100)
      }
    }
  }, [])

  return (
    <div>
      {/*<header className="App-header">
                <h1 className="headerTitle">React Boy</h1>
            </header>*/}
      <div id="container" className="App">
        <KeyboardInfo/>
        <div className="canvasOuter">
          <div className="canvasInner" id="canvasInner">
            <ImageMapper
              src={run ? "/gameboy-on.png" : "/gameboy-off.png"}
              map={maps.MAP}
              width={canvasWidth * 2 * 0.9}
              height={canvasHeight * 3.35}
              responsive={true}
              parentWidth={500}
              imgWidth={500}
              onMouseEnter={enterArea}
              onMouseLeave={leaveArea}
              onClick={handleClick}
            />
            <canvas
              ref={canvasRef}
              className="canvas"
              width="160"
              height="144"
            >
              Your browser does not seem to support canvas.
            </canvas>
          </div>
        </div>
        <ChooseFile handleFileLoad={handleFileLoad} />
      </div>
      <div className="miscOptions">
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
      </div>
    </div>
  )
}

export default App
