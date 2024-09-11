import './App.scss'
import { useEffect, useState, useRef, useCallback } from 'react'
import ImageMapper from 'react-img-mapper'
import KeyboardInfo from './Components/KeyboardInfo.js'
import ChooseFile from './Components/ChooseFile.js'
import GetGameInfo from './Components/GetGameInfo.js'
import * as kbEvents from "./utils/keyboardEvents.js"
import * as maps from "./utils/mapObject"
import GameboyJS from './dist/gameboy' // Import the GameboyJS library
import { Petal, BlossomScene } from './Components/Petal'

function App() {
  const imgWidth = 500

  const [run, setRun] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [windowWidth, setWindowWidth] = useState((window.innerWidth > imgWidth) ? imgWidth : window.innerWidth)
  const [gameTitle, setGameTitle] = useState()
  const gameboyInstance = useRef(null) // Ref to store the Gameboy instance
  const blossomInstance = useRef(null)
  const hoverRef = useRef(null)
  const canvasRef = useRef(null)
  const scrollKeys = useRef(false)

  // Initialize GameboyJS instance and Petal
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

    const petalsTypes = [
      new Petal({ customClass: 'petal-style1' }),
      new Petal({ customClass: 'petal-style2' }),
      new Petal({ customClass: 'petal-style3' }),
      new Petal({ customClass: 'petal-style4' }),
    ]
    const myBlossomSceneConfig = {
      id: 'blossom-container',
      petalsTypes
    }
    blossomInstance.current = new BlossomScene(myBlossomSceneConfig)
  }, [])

  // Set sound and canvas dimensions
  useEffect(() => {
    window.addEventListener("resize", handleResize)
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

  useEffect(() => {
    const title = document.getElementById("game-name")
    if (title) {
      setTimeout(() => {
        setGameTitle(title.innerText)
      }, 10)
    }
  })

  // Makes sure resized images width isn't larger than images original width
  const handleResize = () => {
    setWindowWidth((window.innerWidth > imgWidth) ? imgWidth : window.innerWidth)
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
    <div className="App" style={{ backgroundImage: `url(${process.env.PUBLIC_URL + "/bg.jpg"})` }} id="blossom-container">
      <div className="content" id="blossom-container">
        <div id="keyboard-info"
          onClick={() => setShowInfo(!showInfo)}>
          {!showInfo ? <h2>Info</h2>
            : <KeyboardInfo />
          }
        </div>
        <div className="canvasOuter" >
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
        <div className="gameSection">
          <ChooseFile handleFileLoad={handleFileLoad} />
          {gameTitle ? <GetGameInfo title={gameTitle} />
            : <></>
          }
        </div>
      </div>
    </div>
  )
}

export default App
