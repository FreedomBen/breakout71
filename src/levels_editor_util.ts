import {RawLevel} from "./types";

export function resizeLevel(level: RawLevel, sizeDelta: number) {
    const {size, bricks} = level
    const newSize = Math.max(1, size + sizeDelta)
    const newBricks = new Array(newSize * newSize).fill('_')
    for (let x = 0; x < Math.min(size, newSize); x++) {
        for (let y = 0; y < Math.min(size, newSize); y++) {
            newBricks[y * newSize + x] = bricks.split('')[y * size + x] || '_'
        }
    }
    return {
        size: newSize,
        bricks: newBricks.join('')
    }
}

export function moveLevel(level: RawLevel, dx: number, dy: number) {
    const {size, bricks} = level
    const newBricks = new Array(size * size).fill('_')
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            newBricks[y * size + x] = bricks.split('')[(y - dy) * size + (x - dx)] || '_'
        }
    }
    return {
        bricks: newBricks.join('')
    }
}

export function setBrick(level: RawLevel, index: number, colorCode: string) {
    let bricksString = level.bricks.slice(0, level.size * level.size)

    if (bricksString.length < level.size * level.size) {
        bricksString += '_'.repeat(level.size * level.size - bricksString.length)
    }
    const bricks = bricksString.split('')
    bricks[index] = colorCode
    return {bricks: bricks.join('')}
}