import fs from "fs"
import readline from "readline"
const { convertArrayToCSV } = require("convert-array-to-csv")

function segments(breakPoints: number[], line: string): string[] {
    if (breakPoints.length > 1) {
        const seg = []

        seg.push(line.slice(0, breakPoints[1]))

        for (let i = 1; i < breakPoints.length; i++) {
            seg.push(line.slice(breakPoints[i], breakPoints[i + 1]))
        }

        return seg
    } else {
        return [line]
    }
}

function parseSegment(segment: string): { amount: number | undefined; desc: string } {
    let amount = undefined
    const amountMatch = segment.match(/([0-9]+)×/g)
    if (amountMatch) {
        amount = parseInt(amountMatch[0].replace("x", ""))
    }

    return {
        amount: amount,
        desc: segment.split("× ")[1]?.replace('"', ""),
    }
}

function fixedSizeSegmentsArr(size: number, segments: string[]) {
    const arr: string[] = Array(size)
    for (let i = 0; i < arr.length; i++) {
        if (segments[i]) {
            arr[i] = segments[i]
        }
    }
    return arr
}

async function run() {
    let nrOfNeededExtraColums: number = 0
    const oldRows = []
    const newRows = []
    const segmentRows: { amount: number | undefined; desc: string }[][] = []

    const rd = readline.createInterface({
        input: fs.createReadStream("./data.csv"),
    })

    let rowCount = 0
    for await (const line of rd) {
        if (rowCount > 0) {
            const columns = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)

            if (columns) {
                oldRows.push(columns)

                const columnToSplit = columns[6]

                const breakPositions: number[] = []

                for (let i = 0; i < columnToSplit.length; i++) {
                    const char = columnToSplit[i]

                    if (char === "×") {
                        if (breakPositions.length > 0) {
                            let c = i - 1

                            while (c >= 0) {
                                if (c === 0) {
                                    break
                                }

                                if (columnToSplit[c] === ",") {
                                    breakPositions.push(c)
                                    break
                                }

                                c--
                            }
                        } else {
                            breakPositions.push(i)
                        }
                    }
                }

                const segmentsArray = segments(breakPositions, columnToSplit)
                if (nrOfNeededExtraColums < segmentsArray.length) nrOfNeededExtraColums = segmentsArray.length

                const rrss = []
                for (const segment of segmentsArray) {
                    rrss.push(parseSegment(segment))
                }
                segmentRows.push(rrss)
            }
        }

        rowCount++
    }

    // Build new csv
    for (let i = 1; i < rowCount - 1; i++) {
        const merged: any[] = [
            oldRows[i][0],
            oldRows[i][1],
            oldRows[i][2],
            oldRows[i][3],
            oldRows[i][4],
            oldRows[i][5],
            // position 6 removed and replaced with new stuff below
            oldRows[i][7],
            oldRows[i][8],
            oldRows[i][9],
        ]

        const insert = []
        for (let j = 0; j < nrOfNeededExtraColums; j++) {
            if (segmentRows[i][j]) {
                insert.push(segmentRows[i][j].amount)
                insert.push(segmentRows[i][j].desc)
            } else {
                insert.push(null)
                insert.push(null)
            }
        }

        merged.splice(6, 0, ...insert)
        newRows.push(merged)
    }

    const csvFromArrayOfArrays = convertArrayToCSV(newRows, {
        separator: ",",
    })

    fs.writeFile("./refactored_data.csv", csvFromArrayOfArrays, (err) => {
        if (err) {
            console.error(err)
            return
        }
    })

    console.log("\nDONE\n", nrOfNeededExtraColums)
}

run()
