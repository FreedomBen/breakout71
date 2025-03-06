import { rawUpgrades } from "./rawUpgrades";

export type colorString = string;

export type RawLevel = {
  name: string;
  size: number;
  bricks: string;
  svg: string;
  color: string;
};
export type Level = {
  name: string;
  size: number;
  bricks: colorString[];
  svg: string;
  color: string;
  threshold?: number;
  sortKey?: number;
};

export type Palette = { [k: string]: string };

export type Upgrade = {
  threshold: number;
  giftable: boolean;
  id: string;
  name: string;
  icon: string;
  max: number;
  help: (lvl: string) => string;
  fullHelp: string;
  requires: PerkId | "";
};

export type PerkId = (typeof rawUpgrades)[number]["id"];

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
  interface Document {
    webkitFullscreenEnabled?: boolean;
    webkitCancelFullScreen?: ()=>void;
  }
  interface Element {
    webkitRequestFullscreen: typeof Element.requestFullscreen
  }
}

export type Coin={
   points:number;
  color: colorString;
  x:number;
  y:number;
  previousx:number;
  previousy:number;
   vx:number;
  vy:number;
  sx:number;
  sy:number;
  a:number;
  sa:number;
  weight:number;
  destroyed?:boolean;
  coloredABrick?:boolean;
}
export type Ball = {
    x:number;
            previousx:number;
            y:number;
            previousy:number;
            vx:number;
            vy:number;
            sx:number;
            sy:number;
            sparks:number;
            piercedSinceBounce:number;
            hitSinceBounce:number;
            hitItem: {index:number, color:string}[],
            sapperUses:number;
  destroyed?:boolean;
}


export type FlashTypes= "text"|"particle"|'ball'

export type Flash = {
       type: FlashTypes;
        text?:string;
        time:number;
        color:colorString;
        x:number;
        y:number;
        duration:number;
        size:number;
        vx?:number;
        vy?:number;
        ethereal?:boolean;
        destroyed?:boolean;

}

