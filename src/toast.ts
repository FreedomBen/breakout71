export function toast(html){
    const div =document.createElement('div')
    div.classList='toast'
    div.innerHTML=html
    document.body.appendChild(div)
    // TOast
    // setTimeout(()=>div.remove() , 500 )
}