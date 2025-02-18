let currentColor = ''

const colorsList = [
    'white',
    'black',
    '',
    '#F44848',
    '#ab0c0c',
    '#F29E4A',
    '#F0F04C',
    '#A1F051',
    '#53EE53',
    '#59EEA3',
    '#5BECEC',
    '#5DA3EA',
    '#6262EA',
    '#A664E8',
    '#E869E8',
    '#E66BA8',
    '#E67070',
    "#333",
    '#231f20',
    '#e32119',
    '#ffd300',
    '#e1c8b4',
    '#618227'
]
const palette = document.getElementById('palette');

colorsList.forEach(color => {
    const btn = document.createElement('button')
    Object.assign(btn.style, {
        background: color,
        display: 'inline-block',
        width: '40px',
        height: '40px',
        border: '1px solid black'
    })
    if (color === currentColor) {
        btn.className = 'active'
    }
    palette.appendChild(btn)
    btn.addEventListener('click', (e) => {
        currentColor = color
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

function addLevelEditorToList(level, levelIndex) {
    const {name, bricks, size, svg,color} = level
    let div = document.createElement('div')


    div.innerHTML = ` 
            <div>
            <button data-level="${levelIndex}" data-rename="yep">${name}</button>
            <button data-level="${levelIndex}" data-delete="yep">Delete</button>
            <button data-offset-level-size="-1" data-level="${levelIndex}">-</button>
            <button data-offset-level-size="1" data-level="${levelIndex}">+</button>
            <button data-offset-x="-1"  data-offset-y="0" data-level="${levelIndex}">L</button>
            <button data-offset-x="1"  data-offset-y="0" data-level="${levelIndex}">R</button>
            <button data-offset-x="0"  data-offset-y="-1" data-level="${levelIndex}">U</button>
            <button data-offset-x="0"  data-offset-y="1" data-level="${levelIndex}">D</button>
            <input type="color" value="${level.color || ''}" data-level="${levelIndex}" />
            <button data-level="${levelIndex}" data-set-bg-svg="true" >${svg?'replace':'set'}</button>
            <label>
                <input type="checkbox" data-field="squared" ${level.squared ? 'checked':''}  data-level="${levelIndex}" />
            sqare
            </label>
            <label>
                <input type="checkbox" data-field="focus"   ${level.focus ? 'checked':''}  data-level="${levelIndex}" />
            focus
            </label>
            <label>
                <input type="checkbox" data-field="black_puck"   ${level.black_puck ? 'checked':''}  data-level="${levelIndex}" />
            black_puck
            </label>
           
            </div>
            
            <div class="level-bricks-preview" id="bricks-of-${levelIndex}" > 
            </div>
       `;
    document.getElementById('levels').appendChild(div)

    renderLevelBricks(levelIndex)
    updateLevelBackground(levelIndex)

}

function updateLevelBackground(levelIndex){
    const div=document.getElementById("bricks-of-"+levelIndex)
    const {svg, color}= allLevels[levelIndex]
    Object.assign(div.style, svg ?
        {backgroundImage:`url('data:image/svg+xml,${encodeURIComponent(svg)}')`, backgroundColor:'transparent'} :
        {backgroundImage:'none', backgroundColor:color||'#111'}
   )
}

function renderLevelBricks(levelIndex) {
    const {size, bricks} = allLevels[levelIndex]

    const buttons = []
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const index = y * size + x
            buttons.push(`<button style="background: ${bricks[index] || 'transparent'}; left:${x * 40}px;top:${y * 40
            }px;width:40px;height: 40px; position: absolute" data-set-color-of="${index}" data-level="${levelIndex}"></button>`)
        }
    }
    const div = document.getElementById("bricks-of-" + levelIndex)
    div.innerHTML = buttons.join('')
    Object.assign(div.style, {
        width: size * 40 + 'px',
        height: size * 40 + 'px'
    })
}



document.getElementById('levels').addEventListener('change', e => {
    const levelIndexStr = e.target.getAttribute('data-level')
    if ( levelIndexStr) {
        const levelIndex = parseInt(levelIndexStr)
        const level = allLevels[levelIndex]
        if( e.target.getAttribute('type') === 'color'){

            level.color = e.target.value
            level.svg = ''
            updateLevelBackground(levelIndex)
        }else if( e.target.getAttribute('type') === 'checkbox' && e.target.hasAttribute('data-field')){
            const field=e.target.getAttribute('data-field')
            if(field==='focus'){
                allLevels.forEach(l=>l.focus=false)
            }
            level[field] = !!e.target.checked

        }

        save()
    }

})
document.getElementById('levels').addEventListener('click', e => {
    const resize = e.target.getAttribute('data-offset-level-size')
    const moveX = e.target.getAttribute('data-offset-x')
    const moveY = e.target.getAttribute('data-offset-y')
    const levelIndexStr = e.target.getAttribute('data-level')
    if (!levelIndexStr) return
    if (e.target.tagName!=='BUTTON') return


    const levelIndex = parseInt(levelIndexStr)
    const level = allLevels[levelIndex]
    const {bricks, size} = level;

    if (resize) {
        const newSize = size + parseInt(resize)
        const newBricks = []
        for (let x = 0; x < Math.min(size, newSize); x++) {
            for (let y = 0; y < Math.min(size, newSize); y++) {
                newBricks[y * newSize + x] = bricks[y * size + x] || ''
            }
        }

        level.size = newSize;
        level.bricks = newBricks;
    } else if (moveX && moveY) {
        const dx = parseInt(moveX), dy = parseInt(moveY)
        const moved = []
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                moved[(y + dy) * size + (x + dx)] = bricks[y * size + x] || ''
            }
        }

        level.bricks = moved;
    } else if (e.target.getAttribute('data-rename')) {
        const newName = prompt('Name ? ', level.name)
        if (newName) {
            level.name = newName
            e.target.textContent = newName
        }
    }else if (e.target.getAttribute('data-delete')) {

        if (confirm('Delete level')) {
            allLevels=allLevels.filter((l,i)=>i!==levelIndex)
            save().then(()=>window.location.reload())
        }
    }else if(e.target.getAttribute('data-set-bg-svg')){
        const newBg = prompt('New svg code',level.svg||'')
        if(newBg){
            level.svg=newBg
            level.color = ''
        }

        updateLevelBackground(levelIndex)
    }
    renderLevelBricks(levelIndex)
    save()


}, true)

let applying = undefined

function colorPixel(e) {
    if (typeof applying === 'undefined') return
    const index = e.target.getAttribute('data-set-color-of')
    const level = e.target.getAttribute('data-level')
    if (index && level) {
        const levelIndex = parseInt(level)
        e.target.style.background = applying || 'transparent'
        allLevels[levelIndex].bricks[index] = applying
    }
}

document.getElementById('levels').addEventListener('mousedown', e => {
    const index = e.target.getAttribute('data-set-color-of')
    const level = e.target.getAttribute('data-level')
    if (index && level) {
        const before = allLevels[parseInt(level)].bricks[parseInt(index)] || ''
        applying = before === currentColor ? '' : currentColor
        colorPixel(e)
    }
})

document.getElementById('levels').addEventListener('mouseenter', e => {
    if (typeof applying !== undefined) {

        colorPixel(e)
    }
}, true)

document.addEventListener('mouseup', e => {
    applying = undefined
    save()
})


document.getElementById('new-level').addEventListener('click', e => {

    const name = prompt("Name ? ")
    if (!name) return;

    allLevels.push({
        name,
        size: 8,
        bricks: ['white'],
        svg: '',
    })
    const levelIndex = allLevels.length - 1
    addLevelEditorToList(allLevels[levelIndex], levelIndex)
    save()
}, true)

renderAllLevels()


function save() {
    return fetch('/', {
        method: 'POST', headers: {
            'Content-Type': 'text/plain'
        },
        body: 'let allLevels=' + JSON.stringify(allLevels, null, 2)
    })
}
