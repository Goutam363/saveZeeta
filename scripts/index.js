const canvas=document.querySelector("canvas");
const c=canvas.getContext('2d');

canvas.height=window.innerHeight;
canvas.width=window.innerWidth;

const scoreEl=document.querySelector('#scoreEl');
const startGameBtn=document.querySelector('#startGameBtn');
const modalEl=document.querySelector('#modalEl');
const bigScoreEl=document.querySelector('#bigScoreEl');
const pre_loader=document.getElementById('preLoader')
const load_lightbox=document.getElementById('lightBox')

const projectileSpeed=8;
const enemyMaxRadius=40;
const enemyMinRadius=15;
const particleSpeed=6;
const smallScoreStep=100;
const bigScoreStep=250;
const timeSpeed=1500;

window.addEventListener('resize',function(){
    canvas.height=window.innerHeight;
    canvas.width=window.innerWidth;
})

//utility functions
function randomIntFromRange(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
}
function randomColor(color_palate){
    return color_palate[Math.floor(Math.random()*color_palate.length)];
}

class Player{
    constructor(x,y,radius,color){
        this.x=x;
        this.y=y;
        this.radius=radius;
        this.color=color;
    }
    draw(){
        c.beginPath();
        c.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
        c.fillStyle=this.color;
        c.fill();
    }
}

class Projectile{
    constructor(x,y,radius,color,velocity){
        this.x=x;
        this.y=y;
        this.radius=radius;
        this.color=color;
        this.velocity=velocity;
    }
    draw(){
        c.beginPath();
        c.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
        c.fillStyle=this.color;
        c.fill();
    }
    update(){
        this.draw();
        this.x+=this.velocity.x;
        this.y+=this.velocity.y;
    }
}

class Enemy{
    constructor(x,y,radius,color,velocity){
        this.x=x;
        this.y=y;
        this.radius=radius;
        this.color=color;
        this.velocity=velocity;
    }
    draw(){
        c.beginPath();
        c.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
        c.fillStyle=this.color;
        c.fill();
    }
    update(){
        this.draw();
        this.x+=this.velocity.x;
        this.y+=this.velocity.y;
    }
}

const friction=0.99;
class Particle{
    constructor(x,y,radius,color,velocity){
        this.x=x;
        this.y=y;
        this.radius=radius;
        this.color=color;
        this.velocity=velocity;
        this.alpha=1;
    }
    draw(){
        c.save();
        c.globalAlpha=this.alpha;
        c.beginPath();
        c.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
        c.fillStyle=this.color;
        c.fill();
        c.restore();
    }
    update(){
        this.draw();
        this.velocity.x*=friction;
        this.velocity.y*=friction;
        this.x+=this.velocity.x;
        this.y+=this.velocity.y;
        this.alpha-=0.005;
    }
}

const x=canvas.width/2;
const y=canvas.height/2;

let player=new Player(x,y,10,'white');
let projectiles=[];
let enemies=[];
let particles=[];

function init(){
    player=new Player(x,y,10,'white');
    projectiles=[];
    enemies=[];
    particles=[];
    score=0;
    scoreEl.innerHTML=score;
}

function spawnEnemies(){
    setInterval(()=>{
        const radius=Math.random()*(enemyMaxRadius-enemyMinRadius)+enemyMinRadius;
        let x,y;
        if(Math.random()<0.5)
        {
            x=Math.random()<0.5?-radius:canvas.width+radius;
            y=Math.random()*canvas.height;
        }else{
            x=Math.random()*canvas.width;
            y=Math.random()<0.5?-radius:canvas.height+radius;
        }
        const color=`hsl(${Math.random()*360},70%,50%)`;
        const angle=Math.atan2(canvas.height/2-y,canvas.width/2-x);
        const velocity={x:Math.cos(angle),y:Math.sin(angle)};
        enemies.push(new Enemy(x,y,radius,color,velocity));
    },timeSpeed)
}

// Animation
let animationId;
let score=0;
function animate(){
    animationId=requestAnimationFrame(animate);
    c.fillStyle='rgba(0,0,0,0.1)'
    c.fillRect(0,0,canvas.width,canvas.height);
    player.draw();
    particles.forEach((particle,index)=>{
        if(particle.alpha<=0)
            particles.splice(index,1);
        else
            particle.update();
    })
    projectiles.forEach((projectile,index)=>{
        projectile.update();
        if(projectile.x+projectile.radius<0 || projectile.x-projectile.radius>canvas.width ||
            projectile.y+projectile.radius<0 || projectile.y-projectile.radius>canvas.height)
            setTimeout(()=>{
                projectiles.splice(index,1);
            },0)
    })
    enemies.forEach((enemy,index)=>{
        enemy.update();
        const dist=Math.hypot(player.x-enemy.x,player.y-enemy.y);
        if(dist-enemy.radius-player.radius<1){
            cancelAnimationFrame(animationId);
            setTimeout(()=>{
                modalEl.style.display='flex';
                bigScoreEl.innerHTML=score;
            },1000);
        }
        projectiles.forEach((projectile,projectileIndex)=>{
            const dist=Math.hypot(projectile.x-enemy.x,projectile.y-enemy.y);
            //when projectile touch enemy
            if(dist-enemy.radius-projectile.radius<1){
                for(let i=0;i<enemy.radius*2;i++)
                    particles.push(new Particle(projectile.x,projectile.y,Math.random()*2,enemy.color,{x:(Math.random()-0.5)*Math.random()*particleSpeed,y:(Math.random()-0.5)*Math.random()*particleSpeed}))
                if(enemy.radius-10>10){
                    score+=smallScoreStep;
                    scoreEl.innerHTML=score;
                    gsap.to(enemy,{
                        radius:enemy.radius-10
                    })
                    setTimeout(()=>{
                        projectiles.splice(projectileIndex,1);
                    },0)
                }
                else{
                    score+=bigScoreStep;
                    scoreEl.innerHTML=score;
                    setTimeout(()=>{
                        enemies.splice(index,1);
                        projectiles.splice(projectileIndex,1);
                    },0)
                }
            }
        })
    })
}

window.addEventListener('click',(event)=>{
    const angle=Math.atan2(event.clientY-y,event.clientX-x);
    const velocity={x:Math.cos(angle)*projectileSpeed,y:Math.sin(angle)*projectileSpeed};
    projectiles.push(new Projectile(x,y,5,'white',velocity))
})

startGameBtn.addEventListener('click',()=>{
    init();
    animate();
    spawnEnemies();
    modalEl.style.display='none';
})

function afterLoad(){
    setTimeout(function(){
        pre_loader.style.display="none";
        setTimeout(function(){
            load_lightbox.style.height="auto";
            const mq = window.matchMedia( "(max-width: 700px)" );
            if (mq.matches) {
                load_lightbox.style.width="60%";
                load_lightbox.style.left="20%";
            }
            else {
                load_lightbox.style.width="30%";
                load_lightbox.style.left="35%";   
            }
            load_lightbox.style.backgroundColor="lightGray";
            load_lightbox.style.top="10%";
            setTimeout(function(){
                load_lightbox.style.height="0";
                load_lightbox.style.width="0";
                load_lightbox.style.top="0";
                load_lightbox.style.left="0";
            },15000);
        },1000);
    },2000);
}