import fs from "fs"
import readline from "readline"

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

async function run() {
    let nrOfNeededExtraColums: number = 0
    const oldRows = []
    const newRows = []
    const newContent: { amount: number | undefined; desc: string }[] = []

    const rd = readline.createInterface({
        input: fs.createReadStream("./data.csv"),
    })

    for await (const line of rd) {
        const columns = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
        oldRows.push(columns)

        if (columns) {
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

            for (const segment of segmentsArray) {
                newContent.push(parseSegment(segment))
            }
        }
    }

    console.log("\nDONE\n", nrOfNeededExtraColums)
}

run()
