import React, { useState, useEffect } from "react";
import GetGameData from "../utils/GetGameData";

const ShowGameInfo = ({title}) => {
    const [image, setImage] = useState()
    const [year, setYear] = useState()
    const url = "http://localhost:8080"
    title = title.toLowerCase()
    title = title.replace("pokemon", "pokémon") // Small cheat to make image fetching work correctly

    useEffect(() => {
        const getData = async () => {
            if (title) {
                const res = await GetGameData(url, title)
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