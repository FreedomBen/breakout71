import {Palette, RawLevel} from "./types";
import _backgrounds  from './backgrounds.json'
const backgrounds=_backgrounds as string[];
import _palette from './palette.json'
const palette=_palette as Palette;
import _allLevels from './levels.json'
let allLevels = _allLevels as RawLevel[];



let currentCode = '_'

const paletteEl = document.getElementById('palette') as HTMLDivElement;

Object.entries(palette).forEach(([code, color]) => {
    const btn = document.createElement('button')
    Object.assign(btn.style, {
        background: color || 'linear-gradient(45deg,black,white)',
        display: 'inline-block',
        width: '40px',
        height: '40px',
        border: '1px solid black'
    })
    if (code === currentCode) {
        btn.className = 'active'
    }
    paletteEl.appendChild(btn)
    btn.addEventListener('click', (e) => {
        currentCode = code
        e.preventDefault()
        document.querySelector('#palette button.active')?.classList.remove('active');
        btn.classList.add('active')
    })
})

function renderAllLevels() {
    allLevels.forEach((level, levelIndex) => {
        addLevelEditorToList(level, levelIndex)
    })
}
const levelsListEl = document?.getElementById('levels') as HTMLDivElement
function addLevelEditorToList(level:RawLevel, levelIndex:number) {
    const {name, bricks, size, svg, color} = level
    let div = document.createElement('div')


    div.innerHTML = ` 
            <button data-level="${levelIndex}" data-rename="yep">${name}</button>
            <div>
            <button data-level="${levelIndex}" data-delete="yep">Delete</button>
            <button data-offset-level-size="-1" data-level="${levelIndex}">-</button>
            <button data-offset-level-size="1" data-level="${levelIndex}">+</button>
            <button data-offset-x="-1"  data-offset-y="0" data-level="${levelIndex}">L</button>
            <button data-offset-x="1"  data-offset-y="0" data-level="${levelIndex}">R</button>
            <button data-offset-x="0"  data-offset-y="-1" data-level="${levelIndex}">U</button>
            <button data-offset-x="0"  data-offset-y="1" data-level="${levelIndex}">D</button>
            <input type="color" value="${level.color || ''}" data-level="${levelIndex}" />
            <input type="number" value="${level.svg || (hashCode(level.name) % backgrounds.length)}" data-level="${levelIndex}" data-num-val="svg" />
            
            <button data-level="${levelIndex}" data-set-bg-svg="true" >${svg ? 'replace' : 'set'}</button> 
 
           
            </div>
            
            <div class="level-bricks-preview" id="bricks-of-${levelIndex}" > 
            </div>
       `;


    levelsListEl.appendChild(div)

    renderLevelBricks(levelIndex)
    updateLevelBackground(levelIndex)

}

function updateLevelBackground(levelIndex:number) {
    const div = document.getElementById("bricks-of-" + levelIndex) as HTMLDivElement
    const level = allLevels[levelIndex]
    const {svg, color} = level
    if (color) {
        Object.assign(div.style, {backgroundImage: 'none', backgroundColor: color})
    } else {
        const index = svg || (hashCode(level.name) % backgrounds.length)
        const svgSource=backgrounds[index]
        console.log(index)
        div.setAttribute('data-svg',svgSource)
        Object.assign(div.style, {
            backgroundImage: `url("data:image/svg+xml;UTF8,${encodeURIComponent(svgSource)}")`,
            backgroundColor: 'transparent'
        })
    }

}

function renderLevelBricks(levelIndex:number) {
    const {size, bricks} = allLevels[levelIndex]

    const buttons = []
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const index = y * size + x
            buttons.push(`<button style="background: ${palette[bricks[index]] || 'transparent'}; left:${x * 40}px;top:${y * 40
            }px;width:40px;height: 40px; position: absolute" data-set-color-of="${index}" data-level="${levelIndex}"></button>`)
        }
    }
    const div = document.getElementById("bricks-of-" + levelIndex) as HTMLDivElement
    div.innerHTML = buttons.join('')
    Object.assign(div.style, {
        width: size * 40 + 'px',
        height: size * 40 + 'px'
    })
}


levelsListEl.addEventListener('change', e => {
    const target=  e.target as HTMLInputElement
    const levelIndexStr = target.getAttribute('data-level')
    if (levelIndexStr) {
        const levelIndex = parseInt(levelIndexStr)
        const level = allLevels[levelIndex]
        if (target.getAttribute('type') === 'color') {
            level.color = target.value
            level.svg = null
            updateLevelBackground(levelIndex)
        }
        save()
    }

})
levelsListEl.addEventListener('click', e => {
    const target=  e.target as HTMLButtonElement
    if (target.tagName !== 'BUTTON') return

    const resize = target.getAttribute('data-offset-level-size')
    const moveX = target.getAttribute('data-offset-x')
    const moveY = target.getAttribute('data-offset-y')
    const levelIndexStr = target.getAttribute('data-level')
    if (!levelIndexStr) return

    const levelIndex = parseInt(levelIndexStr)
    const level = allLevels[levelIndex]
    const {bricks, size} = level;

    if (resize) {
        const newSize = size + parseInt(resize)
        const newBricks = new Array(newSize * newSize).fill('_')
        for (let x = 0; x < Math.min(size, newSize); x++) {
            for (let y = 0; y < Math.min(size, newSize); y++) {
                newBricks[y * newSize + x] = bricks.split('')[y * size + x] || '_'
            }
        }
        level.size = newSize;
        level.bricks = newBricks.map(b => b || '_').join('');
    } else if (moveX && moveY) {
        const dx = parseInt(moveX), dy = parseInt(moveY)
        const newBricks = new Array(size * size).fill('_')
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                newBricks[(y + dy) * size + (x + dx)] = bricks.split('')[y * size + x] || '_'
            }
        }
        level.bricks = newBricks.map(b => b || '_').join('');
    } else if (target.getAttribute('data-rename')) {
        const newName = prompt('Name ? ', level.name)
        if (newName) {
            level.name = newName
            target.textContent = newName
        }
    } else if (target.getAttribute('data-delete')) {
        if (confirm('Delete level')) {
            allLevels = allLevels.filter((l, i) => i !== levelIndex)
            save().then(() => window.location.reload())
        }
    }
    renderLevelBricks(levelIndex)
    save()


}, true)

let applying = ''

function colorPixel(e:Event) {
    const target=  e.target as HTMLButtonElement
    if (applying === '') return
    console.log('colorPixel', applying)
    const index = target.getAttribute('data-set-color-of')
    const level = target.getAttribute('data-level')
    if (index && level) {
        const levelIndex = parseInt(level)
        target.style.background = palette[applying] || 'transparent'
        setBrick(levelIndex, parseInt(index), applying)
    }
}

function setBrick(levelIndex:number, index:number, chr:string) {
    const bricks = allLevels[levelIndex].bricks
    allLevels[levelIndex].bricks = bricks.substring(0, index) + chr + bricks.substring(index + 1);
}

let changed=0
levelsListEl.addEventListener('mousedown', e => {
    const target=  e.target as HTMLButtonElement
    const index =  target.getAttribute('data-set-color-of')
    const level = target.getAttribute('data-level')
    if (  index   && level) {
        changed=0
        const before = allLevels[parseInt(level)].bricks[parseInt(index)] || ''
        applying = before === currentCode ? '_' : currentCode
        console.log({before, applying, currentCode})
        colorPixel(e)
    }
})

levelsListEl.addEventListener('mouseenter', e => {
    if (applying !== '') {
        colorPixel(e)
        changed++
    }
}, true);

document.addEventListener('mouseup', (e:Event) => {
    applying = '';
    if(changed) {
        save()
    };
});


(document.getElementById('new-level') as HTMLButtonElement).addEventListener('click', (e:Event) => {

    const name = prompt("Name ? ")
    if (!name) return;

    allLevels.push({
        name,
        size: 8,
        bricks: '________________________________________________________________',
        svg: null,
        color:''
    })
    const levelIndex = allLevels.length - 1
    addLevelEditorToList(allLevels[levelIndex], levelIndex)
    save()
}, true)

renderAllLevels()

function save() {
    return fetch('http://localhost:4400/src/levels.json', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify(allLevels, null, 2)
    })
}

function hashCode(string:string) {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        let code = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + code;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}
