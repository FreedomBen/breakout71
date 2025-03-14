import {Palette, RawLevel} from "./types";
import _backgrounds from './backgrounds.json'
import _palette from './palette.json'
import _allLevels from './levels.json'
import {getLevelBackground, hashCode} from "./getLevelBackground";
import {createRoot} from 'react-dom/client';
import {useCallback, useEffect, useState} from "react";
import {moveLevel, resizeLevel, setBrick} from "./levels_editor_util";

const backgrounds = _backgrounds as string[];

const palette = _palette as Palette;

let allLevels = _allLevels as RawLevel[];


function App() {

    const [selected, setSelected] = useState('W')
    const [applying, setApplying] = useState('')
    const [levels, setLevels] = useState(allLevels)
    const updateLevel = useCallback((index: number, change: Partial<RawLevel>) => {
        setLevels(list => list.map((l, li) => li === index ? {...l, ...change} : l))
    }, []);

    const deleteLevel = useCallback((li: number) => {
        if (confirm('Delete level')) {
            setLevels(allLevels.filter((l, i) => i !== li))
        }
    }, [])

    useEffect(()=>{
       const timoutId= setTimeout(()=>{
              return fetch('http://localhost:4400/src/levels.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: JSON.stringify(levels, null, 2)
                });

        },500)
        return ()=>clearTimeout(timoutId)
    },[levels])



    return <div onMouseUp={() => setApplying('')} onMouseLeave={() => setApplying('')}>
        <div id={"levels"}>
            {
                levels.map((level, li) => {
                        const {name, bricks, size, svg, color} = level

                        const brickButtons = []
                        for (let x = 0; x < size; x++) {
                            for (let y = 0; y < size; y++) {
                                const index = y * size + x
                                brickButtons.push(<button
                                    key={index}
                                    onMouseDown={() => {
                                        const color = selected === bricks[index] ? '_' : applying
                                        setApplying(color)
                                        updateLevel(li, setBrick(level, index, color))
                                    }}
                                    onMouseEnter={() => {
                                        if (applying) {
                                            updateLevel(li, setBrick(level, index, applying))
                                        }
                                    }}
                                    style={{
                                        background: palette[bricks[index]] || 'transparent',
                                        left: x * 40, top: y * 40, width: 40, height: 40, position: 'absolute'
                                    }}></button>)
                            }
                        }

                        const background = color ? {backgroundImage: 'none', backgroundColor: color} : {
                            backgroundImage: `url("data:image/svg+xml;UTF8,${encodeURIComponent(getLevelBackground(level) as string)}")`,
                            backgroundColor: 'transparent'
                        }


                        return <div key={li}>
                            <input type="text" value={name} onChange={e => updateLevel(li, {name: e.target.value})}/>
                            <div>
                                <button onClick={() => deleteLevel(li)}>Delete</button>
                                <button onClick={() => updateLevel(li, resizeLevel(level, -1))}>-</button>
                                <button onClick={() => updateLevel(li, resizeLevel(level, +1))}>+</button>
                                <button onClick={() => updateLevel(li, moveLevel(level, -1, 0))}>L</button>
                                <button onClick={() => updateLevel(li, moveLevel(level, 1, 0))}>R</button>
                                <button onClick={() => updateLevel(li, moveLevel(level, 0, -1))}>U</button>
                                <button onClick={() => updateLevel(li, moveLevel(level, 0, 1))}>D</button>
                                <input type="color" value={level.color || ''}
                                       onChange={e => e.target.value && updateLevel(li, {color: e.target.value})}/>
                                <input type="number" value={level.svg || (hashCode(level.name) % backgrounds.length)}
                                       onChange={e => !isNaN(parseFloat(e.target.value)) && updateLevel(li, {
                                           color: '',
                                           svg: parseFloat(e.target.value)
                                       })}
                                />

                            </div>
                            <div className="level-bricks-preview" style={{
                                width: size * 40,
                                height: size * 40,
                                ...background

                            }}>
                                {brickButtons}
                            </div>
                        </div>


                    }
                )
            }

        </div>
        <div id={"palette"}>
            {
                Object.entries(palette).map(([code, color]) => <button
                    key={code}
                    className={code === selected ? 'active' : ''}
                    style={{
                        background: color || 'linear-gradient(45deg,black,white)',
                        display: 'inline-block',
                        width: '40px',
                        height: '40px',
                        border: '1px solid black'
                    }}
                    onClick={() => setSelected(code)}></button>
                )
            }
        </div>
        <button id="new-level" onClick={() => {

            const name = prompt("Name ? ")
            if (!name) return;

            setLevels(l => [...l, {
                name,
                size: 8,
                bricks: '________________________________________________________________',
                svg: null,
                color: ''
            }])

        }}>new
        </button>
    </div>;
}

const root = createRoot(document.getElementById('app') as HTMLDivElement);
root.render(<App/>);