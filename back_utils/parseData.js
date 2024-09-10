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
                const id = res[x].game_id
                const image = res[x].sample_cover.image
                const release_year = res[x].platforms[y].first_release_date.split("-")[0]
                results.push({id, image, release_year })
            }
        }
    }

    if (results.length === 1) return results[0] // Return if only 1 result
    return results.length > 1 ? checkReleaseYear(results) : "Game data not found" // Else loop through and find the first released one or return error
}

const parseCompanies = (companies) => {
    for (let i = 0; i < companies.length; i++) {
        if (companies[i].role === "Developed by") {
            return companies[i].company_name
        }
    }
}

module.exports =  { parseRes, parseCompanies }