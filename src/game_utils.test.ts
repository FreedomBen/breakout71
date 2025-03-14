import {getMajorityValue, sample, sumOfKeys} from "./game_utils";

describe('getMajorityValue', ()=>{

    it('returns the most common string',()=>{
        expect(getMajorityValue(['1','1','2','2','3','2','3','2','2','1'])).toStrictEqual('2')
    })
    it('returns the only string',()=>{
        expect(getMajorityValue(['1'])).toStrictEqual('1')
    })
    it('returns nothing for empty array',()=>{
        expect(getMajorityValue([])).toStrictEqual(undefined)
    })

})
describe('sample', ()=>{

    it('returns a random pick from the array',()=>{
        expect(['1','2','3'].includes(sample(['1','2','3']))).toBeTruthy()
    })
    it('returns the only item if there is just one',()=>{
        expect(sample(['1'])).toStrictEqual('1')
    })
    it('returns nothing for empty array',()=>{
        expect(sample([])).toStrictEqual(undefined)
    })

})
describe('sumOfKeys', ()=>{
    it('returns the sum of the keys of an array',()=>{
        expect(sumOfKeys({a:1,b:2})).toEqual(3)
    })
    it('returns 0 for an empty object',()=>{
        expect(sumOfKeys({})).toEqual(0)
    })
    it('returns 0 for undefined',()=>{
        expect(sumOfKeys(undefined)).toEqual(0)
    })
    it('returns 0 for null',()=>{
        expect(sumOfKeys(null)).toEqual(0)
    })
})