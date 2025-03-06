import {rawUpgrades} from "./rawUpgrades";

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
    bricks: string[];
    svg: string;
    color: string;
    threshold?: number;
    sortKey?: number;
};

export type Palette = { [k: string]: string }

export type Upgrade={
      threshold: number;
        giftable: boolean;
        "id": string;
        "name": string;
        "max": number;
        help: (lvl:string) => string;
        fullHelp: string;
        requires:PerkId|''
}


export type PerkId = typeof rawUpgrades[number]['id']

declare global {
    interface Window { webkitAudioContext: typeof AudioContext; }
}