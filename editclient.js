let currentCode = '_'

const paletteEl = document.getElementById('palette');

Object.entries(palette).forEach(([code, color]) => {
    const btn = document.createElement('button')
    Object.assign(btn.style, {
        background: color ||'linear-gradient(45deg,black,white)',
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

function addLevelEditorToList(level, levelIndex) {
    const {name, bricks, size, svg,color} = level
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
            <button data-level="${levelIndex}" data-set-bg-svg="true" >${svg?'replace':'set'}</button> 
 
           
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
            buttons.push(`<button style="background: ${palette[bricks[index]] || 'transparent'}; left:${x * 40}px;top:${y * 40
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
        const newBricks = new Array(newSize*newSize).fill('_')
        for (let x = 0; x < Math.min(size, newSize); x++) {
            for (let y = 0; y < Math.min(size, newSize); y++) {
                newBricks[y * newSize + x] = bricks.split('')[y * size + x] || '_'
            }
        }
        level.size = newSize;
        level.bricks = newBricks.map(b=>b||'_').join('');
    } else if (moveX && moveY) {
        const dx = parseInt(moveX), dy = parseInt(moveY)
        const newBricks = new Array(size*size).fill('_')
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                newBricks[(y + dy) * size + (x + dx)] = bricks.split('')[y * size + x]|| '_'
            }
        }
        level.bricks = newBricks.map(b=>b||'_').join('');
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

let applying = ''

function colorPixel(e) {
    if ( applying === '') return
    console.log('colorPixel',applying)
    const index = e.target.getAttribute('data-set-color-of')
    const level = e.target.getAttribute('data-level')
    if (index && level) {
        const levelIndex = parseInt(level)
        e.target.style.background = palette[applying]||'transparent'
        setBrick(levelIndex,parseInt(index),applying)
    }
}
function setBrick(levelIndex,index,chr) {
    const bricks=allLevels[levelIndex].bricks
    allLevels[levelIndex].bricks = bricks.substring(0,index) + chr + bricks.substring(index+1);
}
document.getElementById('levels').addEventListener('mousedown', e => {
    const index = parseInt(e.target.getAttribute('data-set-color-of'))
    const level = e.target.getAttribute('data-level')
    if (typeof index !=="undefined"  && level) {
        const before = allLevels[parseInt(level)].bricks[index] || ''
        applying = before === currentCode ? '_' : currentCode
        console.log({before, applying, currentCode})
        colorPixel(e)
    }
})

document.getElementById('levels').addEventListener('mouseenter', e => {
    if (applying !== '') {
        colorPixel(e)
    }
}, true)

document.addEventListener('mouseup', e => {
    applying = ''
    save()
})


document.getElementById('new-level').addEventListener('click', e => {

    const name = prompt("Name ? ")
    if (!name) return;

    allLevels.push({
        name,
        size: 8,
        bricks: '',
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
        body:   JSON.stringify(allLevels, null, 2)
    })
}
