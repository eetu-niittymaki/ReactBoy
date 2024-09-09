import axios from "axios"

const GetGameData = async (url, title) => {
    const checkReleaseYear = (array) => {
       let minVal = array.reduce((val, min) => {
            return val.release_year < min.release_year ? val : min
       }, array[0])

       return minVal
    }

    const parseRes = (res) => {
        let results = []

        for (let x = 0; x < res.length; x++) {
            for (let y = 0; y < res[x].platforms.length; y++) {
                if (res[x].platforms[y].platform_name === "Game Boy" 
                    && res[x].sample_cover.image.includes("game-boy")) {
                        let image = res[x].sample_cover.image
                        //let company = res[x].releases[0].companies[0].company_name
                        let release_year = res[x].platforms[y].first_release_date.split("-")[0]
                        results.push({image, release_year})
                }
            }
        }
        
        if (results.length === 1) return results[0]
        return results.length > 1 ? checkReleaseYear(results) : "Game data not found"
    }

    const result = await axios.get(url, {
        params: {
            title: title,
        }
    })
    
    return parseRes(result.data)

}

export default GetGameData