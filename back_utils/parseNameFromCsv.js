const fs = require('fs')
const natural = require('natural')
const stemmer = natural.PorterStemmer

const stopwords = new Set(["the", "is", "in", "and", "of", "to"])

const diceSorensteinCoefficient = (ngrams1, ngrams2) => {
    const set1 = new Set(ngrams1)
    const set2 = new Set(ngrams2)

    const intersectionSize = [...set1].filter(ngram => set2.has(ngram)).length
    const totalNgrams = set1.size + set2.size

    return (2 * intersectionSize) / totalNgrams
}

const getNgrams = (str, n) => {
    const ngrams = []
    for (let i = 0; i <= str.length - n; i++) {
        ngrams.push(str.slice(i, i + n))
    }
    return ngrams
}

const tokenBasedComparison = (set1, set2) => {
    const intersection = [...set1].filter(x => set2.has(x)).length
    const union = set1.size + set2.size - intersection
    return intersection / union
}

const transformString = (str) => { // Remove punctuation, whitespaces and stopwords
    const normalized = str.toLowerCase().replace(/[^\w\s]|_/g, "").trim()
    const tokens = normalized.split(" ").filter(word => !stopwords.has(word))
    return tokens.map(word => stemmer.stem(word)).join(" ")
}

const precomputeNgramsAndTokens = (str, ngramSize = 3) => {
    const transformed = transformString(str)
    const tokens = new Set(transformed.split(" "))
    const ngrams = getNgrams(transformed, ngramSize)
    return { tokens, ngrams }
}

let cachedData = null
const loadDataOnce = (filePath) => { // Reads and loads csv data only once and not everytime function is called
    if (!cachedData) {
        const data = fs.readFileSync(filePath, 'utf8')
        cachedData = data.split("\n").map(row => row.trim()).filter(row => row.length > 0)
    }
    return cachedData
}

const parseNameFromCsv = (title, inputFile = "./back_utils/games.csv") => {
    const csvRows = loadDataOnce(inputFile)
    const { tokens: titleTokens, ngrams: titleNgrams } = precomputeNgramsAndTokens(title)

    let bestMatch = ""
    let highestScore = 0

    csvRows.forEach(row => {
        const { tokens: rowTokens, ngrams: rowNgrams } = precomputeNgramsAndTokens(row)
        
        const tokenComp = tokenBasedComparison(titleTokens, rowTokens)
        const diceScore = diceSorensteinCoefficient(titleNgrams, rowNgrams)
        
        const compareScore = (tokenComp + diceScore) / 2
        
        if (compareScore > highestScore) {
            highestScore = compareScore
            bestMatch = row
        }
    })
    return bestMatch
}

module.exports = { parseNameFromCsv }
