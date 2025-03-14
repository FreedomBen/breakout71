
import {PerksMap, Upgrade} from "./types";

export function getMajorityValue(arr: string[]): string {
    const count: { [k: string]: number } = {};
    arr.forEach((v) => (count[v] = (count[v] || 0) + 1));
    // Object.values inline polyfill
    const max = Math.max(...Object.keys(count).map((k) => count[k]));
    return sample(Object.keys(count).filter((k) => count[k] == max));
}


export function sample<T>(arr: T[]): T {
    return arr[Math.floor(arr.length * Math.random())];
}

export function sumOfKeys(obj:{[key:string]:number} | undefined | null){
    if(!obj) return  0
    return Object.values(obj)?.reduce((a,b)=>a+b,0) ||0
}

export const makeEmptyPerksMap = (upgrades:Upgrade[]) => {
    const p = {} as any;
    upgrades.forEach((u) => (p[u.id] = 0));
    return p as PerksMap;
};