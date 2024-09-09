import React, { useState, useEffect } from "react";
import GetGameData from "../utils/GetGameData";

const ShowGameInfo = ({title}) => {
    const [image, setImage] = useState()
    const [year, setYear] = useState()
    const url = ["http://localhost:8080/api/games", "https://reactboy.onrender.com/api/games"]
    title = title.toLowerCase()

    if (title.includes("pokemon")) {
        title = title.toLowerCase()
        title = title.replace("pokemon", "pokémon") // Small cheat to make image fetching work correctly
    }

    if (title.includes("marioland")) { // Another cheat help me god
        title = title.split("mario")
        title = title[0] + "mario " + title[1]
    }

    useEffect(() => {
        const getData = async () => {
            if (title) {
                const res = await GetGameData(url[1], title)
                setImage(res.image)
                setYear(res.release_year)
            }
        }
       getData()
    }, [title])

    return (
        <div>
            {image && year ? <div> 
                                <img className="gameCover"
                                    src={image} alt="Game cover"/>
                                <p>{year}</p>
                             </div> 
                            : <></>

            }
        </div>
    )
}

export default ShowGameInfo