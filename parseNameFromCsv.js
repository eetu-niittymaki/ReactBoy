const dsc = require("./back_utils/DiceSorensenCoefficient")
const fs = require('fs')
const file = "./back_utils/games.csv"

const parseNameFromCsv =  (title) => {
    const inputFile = file // API doesn't allow fetching of all games on a platform, so have to do this stupid thing
    const data = fs.readFileSync(inputFile).toLocaleString();

    let diff = 0
    let str = ""

    const rows = data.split("\n")
    diff = dsc.compare(rows[0], title) // Base values
    str = rows[0]

    rows.forEach((row) => {
        let columns = row.split("\n")
        columns[0] = columns[0].replace(/[^\w']|_/g, "") // Replace all punctuation and whitespaces
        title = title.replace(" ", "")
        let compare = dsc.compare(columns[0], title)
        if (compare > diff) {
            diff = compare
            str = row
        }
    })
    return str
}

module.exports = { parseNameFromCsv }
