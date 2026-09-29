// const button = document.querySelector('.headerButton')
// button.addEventListener('click', () => {
//     let clicking = document.querySelector('.clickig')
//     if (clicking.style.display === 'none') {
//         clicking.style.display = 'block'
//     }else if(clicking.style.display === 'block'){
//     clicking.style.display = 'none'
//     console.log('ok');
    
//     }
// })
// let body = document.querySelector('body')

// // const icon = document.querySelector('.span')
// body.addEventListener('click', (e) => {
//     console.log(e.target);
    
// })
const button = document.querySelector('.headerButton')
const clicking = document.querySelector('.clickig')
const span = document.querySelector('.span')

button.addEventListener('click', () => {
    if (clicking.style.display === 'block') {
        clicking.style.display = 'none'
        span.style.display = 'block'
    } else {
        clicking.style.display = 'block'
        span.innerHTML = ` <span class="clickig">  ✖</span>`
    }
})
//     if (e.target.matches('.span')) {
//         if (button.innerText === '☰'){
//             button.innerHTML = '✖'
//         }else{
//             button.innerHTML = '☰'
//         }
//     }


// })
