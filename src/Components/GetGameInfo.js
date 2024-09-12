import React, { useState, useEffect } from "react"
import axios from "axios"

const GetGameInfo = ({ title }) => {
  const [image, setImage] = useState()
  const [developer, setDeveloper] = useState()
  const [year, setYear] = useState()
  
  const getData = async () => {
    if (title) {
      try {
        const res = await axios.get(process.env.REACT_APP_API_ENDPOINT, {
          params: {
            title: title,
          },
        })
        setImage(res.data.image)
        setDeveloper(res.data.developer_name)
        setYear(res.data.release_year)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => { // Delay to not flood API
      getData()
    }, 50)
    return () => clearTimeout(timeout)
  }, [title])

  return (
    <div>
      {image && year ? (
        <div>
          <img className="gameCover" src={image} alt="Game cover" />
          <p>{developer}</p>
          <p>{year}</p>
        </div>
      ) : (
        <></>
      )}
    </div>
  )
}

export default GetGameInfo
