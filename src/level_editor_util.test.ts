import {resizeLevel} from "./levels_editor_util";

test('resizeLevel',()=>{

  expect(resizeLevel({
      name:'',
      bricks:'AAAA',
      size:2,
      svg:null,
      color:''
  }, 1)).toBe({bricks:'AA_AA____',size:3});
})