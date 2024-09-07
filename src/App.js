import './App.css'
import { useEffect, useState, useRef, useCallback } from 'react'
import ImageMapper from 'react-img-mapper'
import KeyboardInfo from './Components/KeyboardInfo.js'
import ChooseFile from './Components/ChooseFile.js'
import * as kbEvents from "./utils/keyboardEvents.js"
import * as maps from "./utils/mapObject"
import GameboyJS from './dist/gameboy' // Import the GameboyJS library

function App() {
  const imgWidth = 500
  
  const [run, setRun] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [windowWidth, setWindowWidth] = useState((window.innerWidth > imgWidth ) ? imgWidth  : window.innerWidth)
  const soundEnableRef = useRef(null) // Ref for the sound checkbox
  const gameboyInstance = useRef(null) // Ref to store the Gameboy instance
  const hoverRef = useRef(null)
  const gameNameRef = useRef()
  const canvasRef = useRef(null)
  const scrollKeys = useRef(false)

  // Initialize GameboyJS instance
  useEffect(() => {
    const options = {
      pad: { class: GameboyJS.Keyboard, mapping: null },
      romReaders: [
        new GameboyJS.RomFileReader(),
        new GameboyJS.RomDropFileReader(document.getElementById('dropzone'))
      ]
    }

    const canvas = canvasRef.current
    gameboyInstance.current = new GameboyJS.Gameboy(canvas, options)
    gameboyInstance.current.setScreenZoom(2)
  }, [])

  // Set sound and canvas dimensions
  useEffect(() => {
    window.addEventListener("resize", handleResize)
    const gameboy = gameboyInstance.current
    if (gameboy) {
      gameboy.setSoundEnabled(soundEnableRef.current.checked)
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

   // Makes sure resized images width isnt larger than images original width
   const handleResize = () => {
    setWindowWidth((window.innerWidth > imgWidth ) ? imgWidth  : window.innerWidth)
  }

  const enterArea = useCallback((area) => {
    hoverRef.current = area.name
  }, [])

  const leaveArea = useCallback(() => {
    hoverRef.current = null
  }, []) 

  const handleFileLoad = (file) => {
    if (file && file.name.split(".")[1] === "gb") {
      setRun(true)
      let gameName = document.getElementById("game-name")
      if (gameName) {
        setTimeout(() => { // Returns empty string without delay for some reason
          gameNameRef.current = gameName.innerText
          console.log(gameNameRef.current)
        }, 10)
      }
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
      <div id="container" className="App">
        <div id="keyboard-info"
            onClick={() => setShowInfo(!showInfo)}>
          {!showInfo ? <h2>Info</h2>
                     : <KeyboardInfo/>
          }
        </div>
        <div className="canvasOuter">
          <div className="canvasInner" id="canvasInner">
            <ImageMapper
              src={run ? `${process.env.PUBLIC_URL + "/gameboy-on.png"}` : `${process.env.PUBLIC_URL + "/gameboy-off.png"}`}
              map={maps.MAP}
              responsive={true}
              imgWidth={windowWidth} 
              parentWidth={windowWidth}
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
      </div>
    </div>
  )
}

export default App
